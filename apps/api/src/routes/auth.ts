import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@cig/db';
import { RegisterSchema, LoginSchema } from '@cig/types';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role ?? 'MEMBER',
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.status(201).json({ ok: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      res.status(401).json({ ok: false, error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ ok: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });
  } catch (err) {
    next(err);
  }
});
