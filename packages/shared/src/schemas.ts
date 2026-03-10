import { z } from 'zod';

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const GameSessionSchema = z.object({
  gameId: z.string().min(1),
  scopes: z.array(z.string().min(1)).min(1).optional(),
});

// Progress schemas
export const MarkKnownSchema = z.object({
  cardId: z.string().uuid(),
  known: z.boolean(),
});

export const SavePositionSchema = z.object({
  lastIndex: z.number().int().min(0),
});

export const AddPointsSchema = z.object({
  gameId: z.string().min(1),
  points: z.number().int().positive(),
});

export const GameAuthPolicySchema = z.object({
  requiresUserAuth: z.boolean(),
  requiresAppIdentity: z.boolean(),
  requiredScopes: z.array(z.string().min(1)),
  tokenAudience: z.string().min(1),
});

export const GameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['enabled', 'disabled']),
  description: z.string(),
  iconEmoji: z.string(),
  routeBase: z.string().min(1),
  integrationMode: z.enum(['local', 'external']),
  clientTargets: z.array(z.enum(['web', 'mobile'])).min(1),
  capabilities: z.array(z.string()),
  apiVersion: z.string().min(1),
  authPolicy: GameAuthPolicySchema,
  entryWeb: z.string().nullable(),
  entryMobile: z.string().nullable(),
});

// Types inferred from schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type GameSessionInput = z.infer<typeof GameSessionSchema>;
export type MarkKnownInput = z.infer<typeof MarkKnownSchema>;
export type SavePositionInput = z.infer<typeof SavePositionSchema>;
export type AddPointsInput = z.infer<typeof AddPointsSchema>;
export type GameAuthPolicyInput = z.infer<typeof GameAuthPolicySchema>;
export type GameInput = z.infer<typeof GameSchema>;
