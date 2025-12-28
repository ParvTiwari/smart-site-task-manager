import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db';
import { classifyTask } from '../services/classifier';

const router = Router();

// Schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().optional(),
  due_date: z.string().optional()
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['scheduling', 'finance', 'technical', 'safety', 'general']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional()
});

const listQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  category: z.enum(['scheduling', 'finance', 'technical', 'safety', 'general']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'due_date']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
});

// POST /api/tasks - create with autoclassification
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createTaskSchema.parse(req.body);
    const classification = classifyTask(validated.description);

    const result = await pool.query(
      `INSERT INTO tasks (title, description, category, priority, status, assigned_to, due_date, extracted_entities, suggested_actions)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
       RETURNING *`,
      [
        validated.title,
        validated.description,
        classification.category,
        classification.priority,
        validated.assigned_to ?? null,
        validated.due_date ? new Date(validated.due_date) : null,
        JSON.stringify(classification.extracted_entities),
        JSON.stringify(classification.suggested_actions)
      ]
    );

    await pool.query(
      `INSERT INTO task_history (task_id, action, new_value, changed_by)
       VALUES ($1, 'created', $2, 'system')`,
      [result.rows[0].id, JSON.stringify(result.rows[0])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks - list with filters + pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = listQuerySchema.parse(req.query);

    const limit = parsed.limit ? parseInt(parsed.limit, 10) : 10;
    const offset = parsed.offset ? parseInt(parsed.offset, 10) : 0;
    const { status, category, priority, search, sort_by, sort_order } = parsed;

    const where: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) {
      where.push(`status = $${idx++}`);
      params.push(status);
    }
    if (category) {
      where.push(`category = $${idx++}`);
      params.push(category);
    }
    if (priority) {
      where.push(`priority = $${idx++}`);
      params.push(priority);
    }
    if (search) {
      where.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = sort_by ? `ORDER BY ${sort_by} ${sort_order ?? 'desc'}` : 'ORDER BY created_at DESC';

    const sql = `
      SELECT * FROM tasks
      ${whereClause}
      ${orderBy}
      LIMIT $${idx++}
      OFFSET $${idx}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(sql, params);

    res.json({ data: rows, limit, offset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - details + history
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const historyResult = await pool.query(
      'SELECT * FROM task_history WHERE task_id = $1 ORDER BY changed_at DESC',
      [id]
    );

    res.json({ task: taskResult.rows[0], history: historyResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id - update
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateTaskSchema.parse(req.body);

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const fields = Object.keys(validated);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const key of fields) {
      if (key === 'due_date' && validated.due_date) {
        setClauses.push(`${key} = $${idx++}`);
        params.push(new Date(validated.due_date));
      } else {
        setClauses.push(`${key} = $${idx++}`);
        // @ts-ignore
        params.push(validated[key]);
      }
    }
    setClauses.push(`updated_at = now()`);

    const sql = `
      UPDATE tasks
      SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    params.push(id);

    const updated = await pool.query(sql, params);

    await pool.query(
      `INSERT INTO task_history (task_id, action, old_value, new_value, changed_by)
       VALUES ($1, 'updated', $2, $3, 'system')`,
      [id, JSON.stringify(existing.rows[0]), JSON.stringify(updated.rows[0])]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await pool.query(
      `INSERT INTO task_history (task_id, action, old_value, changed_by)
       VALUES ($1, 'deleted', $2, 'system')`,
      [id, JSON.stringify(existing.rows[0])]
    );

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;