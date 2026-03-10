// Core domain types shared between API and web client

export type UserId = string;
export type DeckId = string;
export type CardId = string;
export type GameId = string;
export type GameIntegrationMode = 'local' | 'external';
export type GameClientTarget = 'web' | 'mobile';

export interface GameAuthPolicy {
  requiresUserAuth: boolean;
  requiresAppIdentity: boolean;
  requiredScopes: string[];
  tokenAudience: string;
}

export interface User {
  id: UserId;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface Game {
  id: GameId;
  title: string;
  status: 'enabled' | 'disabled';
  description: string;
  iconEmoji: string;
  routeBase: string;
  integrationMode: GameIntegrationMode;
  clientTargets: GameClientTarget[];
  capabilities: string[];
  apiVersion: string;
  authPolicy: GameAuthPolicy;
  entryWeb: string | null;
  entryMobile: string | null;
}

export interface Deck {
  id: DeckId;
  gameId: GameId;
  languageCode: string;
  title: string;
  description: string;
  cardCount: number;
  version: number;
  createdAt: string;
}

export interface Card {
  id: CardId;
  deckId: DeckId;
  term: string;
  imagePath: string | null;
  audioPath: string | null;
  tags: string[];
}

export interface DeckProgress {
  userId: UserId;
  deckId: DeckId;
  lastIndex: number;
  knownCount: number;
  totalCards: number;
  knownCardIds: CardId[];
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
