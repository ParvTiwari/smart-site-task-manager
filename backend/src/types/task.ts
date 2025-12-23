export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'scheduling' | 'finance' | 'technical' | 'safety' | 'general';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
  due_date?: string;
  extracted_entities: Record<string, any>;
  suggested_actions: string[];
  created_at: string;
  updated_at: string;
}