import { Clue, IClue } from '../../src/models/Clue';
import { v4 as uuidv4 } from 'uuid';

describe('Clue Model', () => {
  beforeEach(async () => {
    await Clue.destroy({ where: {} });
  });

  it('should create a clue successfully', async () => {
    const clueData = {
      id: uuidv4(),
      type: 'text',
      question: 'Test question',
      answer: 'Test answer',
      hint: 'Test hint'
    };

    const clue = await Clue.create(clueData);

    expect(clue.id).toBe(clueData.id);
    expect(clue.type).toBe(clueData.type);
    expect(clue.question).toBe(clueData.question);
    expect(clue.answer).toBe(clueData.answer);
    expect(clue.hint).toBe(clueData.hint);
    expect(clue.answerLowerCase).toBe(clueData.answer.toLowerCase());
  });

  it('should require all mandatory fields', async () => {
    const clueData = {
      id: uuidv4(),
      type: 'text',
      question: 'Test question',
      answer: 'Test answer'
    };

    const clue = await Clue.create(clueData);

    expect(clue.id).toBe(clueData.id);
    expect(clue.type).toBe(clueData.type);
    expect(clue.question).toBe(clueData.question);
    expect(clue.answer).toBe(clueData.answer);
    expect(clue.hint).toBeNull();
    expect(clue.answerLowerCase).toBe(clueData.answer.toLowerCase());
  });

  it('should check answers case-insensitively', async () => {
    const clueData = {
      id: uuidv4(),
      type: 'text',
      question: 'Test question',
      answer: 'Test Answer',
      hint: 'Test hint'
    };

    const clue = await Clue.create(clueData);

    expect(clue.checkAnswer('test answer')).toBe(true);
    expect(clue.checkAnswer('TEST ANSWER')).toBe(true);
    expect(clue.checkAnswer('Test Answer')).toBe(true);
    expect(clue.checkAnswer('wrong answer')).toBe(false);
  });
}); 