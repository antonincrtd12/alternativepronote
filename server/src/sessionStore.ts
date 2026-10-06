import { randomUUID } from 'node:crypto';
import type { EcoleDirecteSession } from './providers/ecoledirecte.js';
import type { PronoteSession } from './providers/pronote.js';
import type { SchoolProvider } from './types.js';

export type AppSession =
  | { provider: 'pronote'; pronote: PronoteSession }
  | { provider: 'ecoledirecte'; ecoledirecte: EcoleDirecteSession }
  | { provider: 'demo' };

const sessions = new Map<string, AppSession>();

export function createSession(data: AppSession): string {
  const id = randomUUID();
  sessions.set(id, data);
  return id;
}

export function getSession(id: string | undefined): AppSession | undefined {
  if (!id) return undefined;
  return sessions.get(id);
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

export function sessionMeta(
  data: AppSession,
): { displayName: string; provider: SchoolProvider; className?: string } {
  if (data.provider === 'pronote') {
    return {
      displayName: data.pronote.displayName,
      provider: 'pronote',
      className: data.pronote.className,
    };
  }
  if (data.provider === 'ecoledirecte') {
    return {
      displayName: data.ecoledirecte.displayName,
      provider: 'ecoledirecte',
      className: data.ecoledirecte.className,
    };
  }
  return { displayName: 'Mode démo', provider: 'demo' };
}
