import { describe, it, expect } from 'vitest';
import { classifyTask } from '../services/classifier';

describe('classifyTask', () => {
  it('classifies scheduling + high priority with entities', () => {
    const desc = 'Schedule urgent meeting with team today about budget allocation';
    const result = classifyTask(desc);

    expect(result.category).toBe('scheduling');
    expect(result.priority).toBe('high');
    expect(result.suggested_actions.length).toBeGreaterThan(0);
  });

  it('classifies finance category', () => {
    const desc = 'Process invoice payment for office expenses this week';
    const result = classifyTask(desc);

    expect(result.category).toBe('finance');
  });

  it('defaults to general + low when no keywords', () => {
    const desc = 'Read documentation about project guidelines';
    const result = classifyTask(desc);

    expect(result.category).toBe('general');
    expect(result.priority).toBe('low');
  });
});