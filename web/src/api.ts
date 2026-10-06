const SESSION_KEY = 'lea-session-id';

export type Provider = 'demo' | 'pronote' | 'ecoledirecte';

export type User = {
  displayName: string;
  provider: Provider;
  className?: string;
};

export type UnifiedEvent = {
  id: string;
  title: string;
  subject?: string;
  start: string;
  end: string;
  room?: string;
  teachers?: string[];
  canceled?: boolean;
};

export type UnifiedHomework = {
  id: string;
  subject: string;
  description: string;
  dueDate: string;
  done: boolean;
};

export type AiDigest = {
  summary: string;
  highlights: string[];
  plan: Array<{
    start: string;
    end: string;
    label: string;
    kind: string;
  }>;
  reminders: string[];
};

export function getStoredSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.auth !== false) {
    const sid = getStoredSession();
    if (sid) headers.set('x-session-id', sid);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Erreur ${res.status}`,
    );
  }
  return data;
}

export async function connect(
  body: Record<string, unknown>,
): Promise<{ sessionId: string; user: User }> {
  const data = await api<{ sessionId: string; user: User }>('/api/connect', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: false,
  });
  localStorage.setItem(SESSION_KEY, data.sessionId);
  return data;
}

export const fetchMe = () => api<{ user: User }>('/api/me');
export const fetchEvents = () =>
  api<{ events: UnifiedEvent[] }>('/api/events');
export const fetchHomework = () =>
  api<{ homework: UnifiedHomework[] }>('/api/homework');
export const fetchDigest = () =>
  api<{ digest: AiDigest }>('/api/assistant/digest');
