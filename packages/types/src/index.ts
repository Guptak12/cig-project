import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const Role = z.enum(['ADMIN', 'PHOTOGRAPHER', 'MEMBER']);
export type Role = z.infer<typeof Role>;

export const ReactionType = z.enum(['like', 'love', 'fire']);
export type ReactionType = z.infer<typeof ReactionType>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: Role.optional().default('MEMBER'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Events ───────────────────────────────────────────────────────────────────

export const CreateEventSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  date: z.string().datetime(),
  clubId: z.string().cuid(),
  isPublic: z.boolean().default(true),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

// ─── Albums ───────────────────────────────────────────────────────────────────

export const CreateAlbumSchema = z.object({
  name: z.string().min(2),
  isPublic: z.boolean().default(true),
});
export type CreateAlbumInput = z.infer<typeof CreateAlbumSchema>;

// ─── Media ────────────────────────────────────────────────────────────────────

export const PresignRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string().regex(/^image\//),
  albumId: z.string().cuid(),
});
export type PresignRequest = z.infer<typeof PresignRequestSchema>;

export const ConfirmUploadSchema = z.object({
  s3Key: z.string(),
  albumId: z.string().cuid(),
});
export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>;

// ─── Reactions / Comments ─────────────────────────────────────────────────────

export const AddReactionSchema = z.object({
  type: ReactionType,
});
export type AddReactionInput = z.infer<typeof AddReactionSchema>;

export const AddCommentSchema = z.object({
  body: z.string().min(1).max(500),
});
export type AddCommentInput = z.infer<typeof AddCommentSchema>;

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
