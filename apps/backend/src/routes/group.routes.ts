import { Router, Request, Response } from 'express';
import { CreateGroupSchema, JoinGroupSchema } from '@panasecreto/shared';
import { GroupModel } from '../models/group.model';

export const groupRouter: Router = Router();

// Listar grupos
groupRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const groups = await GroupModel.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al listar los grupos' });
  }
});

// Crear grupo con validación Zod
groupRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten() });
    }

    const inviteCode = `PANA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const creatorId = req.body.creatorId || 'user_demo_123';

    const group = await GroupModel.create({
      ...parsed.data,
      creatorId,
      inviteCode,
      members: [
        {
          userId: creatorId,
          name: req.body.creatorName || 'Organizador',
          email: req.body.creatorEmail || 'admin@panasecreto.local',
          role: 'CREATOR',
          joinedAt: new Date(),
          exclusions: [],
        },
      ],
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear grupo' });
  }
});

// Unirse a un grupo mediante código de invitación
groupRouter.post('/join', async (req: Request, res: Response) => {
  try {
    const parsed = JoinGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten() });
    }

    const group = await GroupModel.findOne({ inviteCode: parsed.data.inviteCode });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Grupo no encontrado con ese código' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al unirse al grupo' });
  }
});
