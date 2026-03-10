import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  MarkKnownSchema,
  GameSchema,
  GameSessionSchema,
} from '../schemas.js';

describe('RegisterSchema', () => {
  it('accepts valid registration data', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid login data', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });
});

describe('MarkKnownSchema', () => {
  it('accepts valid mark known payload', () => {
    const result = MarkKnownSchema.safeParse({
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      known: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid cardId', () => {
    const result = MarkKnownSchema.safeParse({ cardId: 'not-a-uuid', known: true });
    expect(result.success).toBe(false);
  });
});

describe('GameSchema', () => {
  it('accepts valid modular game metadata', () => {
    const result = GameSchema.safeParse({
      id: 'flashcards',
      title: 'Flash Cards',
      status: 'enabled',
      description: 'Learn words',
      iconEmoji: '🃏',
      routeBase: '/games/flashcards',
      integrationMode: 'local',
      clientTargets: ['web', 'mobile'],
      capabilities: ['progress', 'points'],
      apiVersion: 'v1',
      authPolicy: {
        requiresUserAuth: true,
        requiresAppIdentity: true,
        requiredScopes: ['points:add'],
        tokenAudience: 'game:flashcards',
      },
      entryWeb: '/games/flashcards',
      entryMobile: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid integration mode', () => {
    const result = GameSchema.safeParse({
      id: 'flashcards',
      title: 'Flash Cards',
      status: 'enabled',
      description: 'Learn words',
      iconEmoji: '🃏',
      routeBase: '/games/flashcards',
      integrationMode: 'partner',
      clientTargets: ['web'],
      capabilities: [],
      apiVersion: 'v1',
      authPolicy: {
        requiresUserAuth: true,
        requiresAppIdentity: true,
        requiredScopes: ['points:add'],
        tokenAudience: 'game:flashcards',
      },
      entryWeb: '/games/flashcards',
      entryMobile: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('GameSessionSchema', () => {
  it('accepts valid game session payload', () => {
    const result = GameSessionSchema.safeParse({
      gameId: 'flashcards',
      scopes: ['points:add'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty scopes when provided', () => {
    const result = GameSessionSchema.safeParse({
      gameId: 'flashcards',
      scopes: [],
    });
    expect(result.success).toBe(false);
  });
});
