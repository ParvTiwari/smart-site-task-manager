interface ClassificationResult {
  category: 'scheduling' | 'finance' | 'technical' | 'safety' | 'general';
  priority: 'high' | 'medium' | 'low';
  extracted_entities: { dates?: string[]; people?: string[]; locations?: string[] };
  suggested_actions: string[];
}

const KEYWORDS = {
  scheduling: ['meeting', 'schedule', 'call', 'appointment', 'deadline'],
  finance: ['payment', 'invoice', 'bill', 'budget', 'cost', 'expense'],
  technical: ['bug', 'fix', 'error', 'install', 'repair', 'maintain'],
  safety: ['safety', 'hazard', 'inspection', 'compliance', 'ppe']
};

const PRIORITY_KEYWORDS = {
  high: ['urgent', 'asap', 'immediately', 'today', 'critical', 'emergency'],
  medium: ['soon', 'this week', 'important']
};

const SUGGESTED_ACTIONS = {
  scheduling: ['Block calendar', 'Send invite', 'Prepare agenda', 'Set reminder'],
  finance: ['Check budget', 'Get approval', 'Generate invoice', 'Update records'],
  technical: ['Diagnose issue', 'Check resources', 'Assign technician', 'Document fix'],
  safety: ['Conduct inspection', 'File report', 'Notify supervisor', 'Update checklist']
};

export function classifyTask(description: string): ClassificationResult {
  const lowerDesc = description.toLowerCase();
  
  // Category
  type Category = 'scheduling' | 'finance' | 'technical' | 'safety' | 'general';
  let category: Category = 'general';
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    if (words.some(word => lowerDesc.includes(word))) {
      category = cat;
      break;
    }
  }


  // Priority
  let priority: 'high' | 'medium' | 'low' = 'low';
  if (PRIORITY_KEYWORDS.high.some(word => lowerDesc.includes(word))) {
    priority = 'high';
  } else if (PRIORITY_KEYWORDS.medium.some(word => lowerDesc.includes(word))) {
    priority = 'medium';
  }

  // Simple entity extraction (basic regex)
  const dates = lowerDesc.match(/\b(\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|today|tomorrow|this week)\b/gi) || [];
  const people = lowerDesc.match(/(with|by|assign to|for)\s+([a-zA-Z\s]+)/gi) || [];

  return {
    category: category as any,
    priority,
    extracted_entities: { dates, people: people.map(p => p.split(' ').slice(1).join(' ')) },
    suggested_actions: SUGGESTED_ACTIONS[category as keyof typeof SUGGESTED_ACTIONS] || []
  };
}