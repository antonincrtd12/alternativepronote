import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';

import { buildAgendaPlan, enhanceWithLlm } from './ai/agendaAssistant.js';
import { demoEvents, demoHomework, demoUser } from './demo/data.js';
import {
  connectEcoleDirecte,
  fetchEcoleDirecteHomework,
} from './providers/ecoledirecte.js';
import {
  connectPronote,
  fetchPronoteAgenda,
  fetchPronoteHomework,
} from './providers/pronote.js';
import {
  createSession,
  getSession,
  sessionMeta,
} from './sessionStore.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function sessionId(req: express.Request): string | undefined {
  const h = req.header('x-session-id');
  return h?.trim() || undefined;
}

const connectSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('demo'),
  }),
  z.object({
    provider: z.literal('pronote'),
    url: z.string().url(),
    username: z.string().min(1),
    password: z.string().min(1),
    kind: z.enum(['student', 'parent', 'teacher']).optional(),
  }),
  z.object({
    provider: z.literal('ecoledirecte'),
    username: z.string().min(1),
    password: z.string().min(1),
  }),
]);

app.post('/api/connect', async (req, res) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const body = parsed.data;
    if (body.provider === 'demo') {
      const id = createSession({ provider: 'demo' });
      res.json({ sessionId: id, user: demoUser });
      return;
    }
    if (body.provider === 'pronote') {
      const pronote = await connectPronote(body);
      const id = createSession({ provider: 'pronote', pronote });
      res.json({
        sessionId: id,
        user: sessionMeta({ provider: 'pronote', pronote }),
        authToken: pronote.authToken,
      });
      return;
    }
    const ecoledirecte = await connectEcoleDirecte(body);
    const id = createSession({ provider: 'ecoledirecte', ecoledirecte });
    res.json({
      sessionId: id,
      user: sessionMeta({ provider: 'ecoledirecte', ecoledirecte }),
    });
  } catch (e) {
    res.status(401).json({
      error: e instanceof Error ? e.message : 'Connexion impossible',
    });
  }
});

app.get('/api/me', (req, res) => {
  const s = getSession(sessionId(req));
  if (!s) {
    res.status(401).json({ error: 'Session expirée' });
    return;
  }
  res.json({ user: sessionMeta(s) });
});

async function loadAgenda(s: NonNullable<ReturnType<typeof getSession>>) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  if (s.provider === 'demo') {
    return { events: demoEvents, homework: demoHomework };
  }
  if (s.provider === 'pronote') {
    const [events, homework] = await Promise.all([
      fetchPronoteAgenda(s.pronote, start, end),
      fetchPronoteHomework(s.pronote, start, end),
    ]);
    return { events, homework };
  }
  const homework = await fetchEcoleDirecteHomework(s.ecoledirecte);
  return { events: [], homework };
}

app.get('/api/events', async (req, res) => {
  const s = getSession(sessionId(req));
  if (!s) {
    res.status(401).json({ error: 'Session expirée' });
    return;
  }
  try {
    const { events } = await loadAgenda(s);
    res.json({ events });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Erreur emploi du temps',
    });
  }
});

app.get('/api/homework', async (req, res) => {
  const s = getSession(sessionId(req));
  if (!s) {
    res.status(401).json({ error: 'Session expirée' });
    return;
  }
  try {
    const { homework } = await loadAgenda(s);
    res.json({ homework });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Erreur devoirs',
    });
  }
});

app.get('/api/assistant/digest', async (req, res) => {
  const s = getSession(sessionId(req));
  if (!s) {
    res.status(401).json({ error: 'Session expirée' });
    return;
  }
  try {
    const { events, homework } = await loadAgenda(s);
    let digest = buildAgendaPlan(events, homework);
    digest = await enhanceWithLlm(digest, events, homework);
    res.json({ digest });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Erreur assistant',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API Léa → http://127.0.0.1:${PORT}`);
});
