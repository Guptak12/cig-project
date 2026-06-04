import type { Request } from 'express';

/**
 * Express types req.params values as `string | string[]`.
 * In practice, named params are always a single string.
 * This helper narrows the type so Prisma queries stay type-safe.
 */
export function param(req: Request, key: string): string {
  const val = req.params[key];
  if (!val) throw new Error(`Missing route param: ${key}`);
  return Array.isArray(val) ? val[0] : val;
}
