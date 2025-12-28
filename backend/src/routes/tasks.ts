import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db';
import { classifyTask } from '../services/classifier';

const router = Router();

// Create task schema
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().optional(),
  due_date: z.string().optional()
});

// POST /api/tasks
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
        validated.assigned_to,
        validated.due_date ? new Date(validated.due_date) : null,
        JSON.stringify(classification.extracted_entities),
        JSON.stringify(classification.suggested_actions)
      ]
    );

    // Log to history
    await pool.query(
      `INSERT INTO task_history (task_id, action, new_value, changed_by)
       VALUES ($1, 'created', $2, 'system')`,
      [result.rows[0].id, JSON.stringify(result.rows[0])]
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Existing GET
router.get('/', (req, res) => {
  res.json({ message: 'Tasks API working!' });
});

export default router;