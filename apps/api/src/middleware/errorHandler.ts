import type { Request, Response, NextFunction } from 'express';

/**
 * Centralised error handler — must be the last app.use() in index.ts.
 * Handles Zod validation errors, Prisma errors, and generic 500s.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[error]', err);

  // Zod validation errors
  if (isZodError(err)) {
    res.status(400).json({ ok: false, error: 'Validation error', details: err.errors });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (isPrismaError(err, 'P2002')) {
    res.status(409).json({ ok: false, error: 'A record with that value already exists' });
    return;
  }

  // Prisma record not found (P2025)
  if (isPrismaError(err, 'P2025')) {
    res.status(404).json({ ok: false, error: 'Record not found' });
    return;
  }

  res.status(500).json({ ok: false, error: (err as any)?.message ?? 'Internal server error', stack: (err as any)?.stack });
}

function isZodError(err: unknown): err is { errors: unknown[] } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    Array.isArray((err as { errors: unknown }).errors)
  );
}

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === code
  );
}
