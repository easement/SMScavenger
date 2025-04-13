import { Router } from 'express';
import { Clue, IClue } from '../models/Clue';
import { PlayerSession, IPlayerSession } from '../models/PlayerSession';
import { config } from '../config/env';
import { z } from 'zod';

const router = Router();

// Middleware to check API key
const checkApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== config.admin.apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Clue routes
router.post('/clues', checkApiKey, async (req, res) => {
  try {
    const clueSchema = z.object({
      id: z.string(),
      type: z.string(),
      question: z.string(),
      answer: z.string(),
      hint: z.string().optional()
    });

    const clueData = clueSchema.parse(req.body);
    const existingClue = await Clue.findOne({
      where: { id: clueData.id }
    });

    if (existingClue) {
      return res.status(400).json({ error: 'Clue with this ID already exists' });
    }

    const clue = await Clue.create(clueData);
    res.status(201).json(clue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid clue data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create clue' });
  }
});

router.get('/clues', checkApiKey, async (req, res) => {
  try {
    const clues = await Clue.findAll({
      order: [['id', 'ASC']]
    });
    res.json(clues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve clues' });
  }
});

router.get('/clues/:id', checkApiKey, async (req, res) => {
  try {
    const clue = await Clue.findOne({
      where: { id: req.params.id }
    });

    if (!clue) {
      return res.status(404).json({ error: 'Clue not found' });
    }

    res.json(clue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve clue' });
  }
});

router.put('/clues/:id', checkApiKey, async (req, res) => {
  try {
    const clueSchema = z.object({
      type: z.string().optional(),
      question: z.string().optional(),
      answer: z.string().optional(),
      hint: z.string().optional()
    });

    const updateData = clueSchema.parse(req.body);
    const [updated] = await Clue.update(updateData, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Clue not found' });
    }

    const updatedClue = await Clue.findOne({
      where: { id: req.params.id }
    });
    res.json(updatedClue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid clue data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update clue' });
  }
});

router.delete('/clues/:id', checkApiKey, async (req, res) => {
  try {
    const deleted = await Clue.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Clue not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete clue' });
  }
});

// Player session routes
router.get('/sessions', checkApiKey, async (req, res) => {
  try {
    const query: any = {};
    if (req.query.phoneNumber) {
      query.phoneNumber = req.query.phoneNumber;
    }
    if (req.query.completed !== undefined) {
      query.completed = req.query.completed === 'true';
    }

    const sessions = await PlayerSession.findAll({
      where: query,
      order: [['startTime', 'DESC']]
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

router.delete('/sessions/:phoneNumber', checkApiKey, async (req, res) => {
  try {
    const deleted = await PlayerSession.destroy({
      where: { phoneNumber: req.params.phoneNumber }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Statistics route
router.get('/stats', checkApiKey, async (req, res) => {
  try {
    const [totalClues, totalPlayers, activePlayers, completedPlayers] = await Promise.all([
      Clue.count(),
      PlayerSession.count(),
      PlayerSession.count({
        where: {
          completed: false
        }
      }),
      PlayerSession.count({
        where: {
          completed: true
        }
      })
    ]);

    res.json({
      totalClues,
      totalPlayers,
      activePlayers,
      completedPlayers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router; 