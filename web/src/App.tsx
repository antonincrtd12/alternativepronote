import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';

import {
  clearSession,
  connect,
  fetchDigest,
  fetchEvents,
  fetchHomework,
  fetchMe,
  getStoredSession,
  type AiDigest,
  type Provider,
  type UnifiedEvent,
  type UnifiedHomework,
  type User,
} from './api';

type Screen = 'login' | 'app';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<Provider>('demo');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [homework, setHomework] = useState<UnifiedHomework[]>([]);
  const [digest, setDigest] = useState<AiDigest | null>(null);

  const loadDashboard = useCallback(async () => {
    const [ev, hw, dg] = await Promise.all([
      fetchEvents(),
      fetchHomework(),
      fetchDigest(),
    ]);
    setEvents(ev.events);
    setHomework(hw.homework);
    setDigest(dg.digest);
  }, []);

  useEffect(() => {
    const sid = getStoredSession();
    if (!sid) return;
    setLoading(true);
    fetchMe()
      .then((r) => {
        setUser(r.user);
        setScreen('app');
        return loadDashboard();
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body =
        provider === 'demo'
          ? { provider: 'demo' }
          : provider === 'pronote'
            ? { provider, url, username, password, kind: 'student' }
            : { provider, username, password };
      const { user: u } = await connect(body);
      setUser(u);
      setScreen('app');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setScreen('login');
    setUser(null);
    setEvents([]);
    setHomework([]);
    setDigest(null);
  }

  if (screen === 'login') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <header className="mb-8 text-center">
          <p className="text-sm font-medium text-[var(--color-brand)]">
            Inspiré de Papillon
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Léa</h1>
          <p className="mt-2 text-sm text-zinc-600">
            PRONOTE, École Directe — agenda et devoirs avec planification auto.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/80"
        >
          <label className="block text-sm font-medium text-zinc-700">
            Service
            <select
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="demo">Démo (sans compte)</option>
              <option value="pronote">PRONOTE</option>
              <option value="ecoledirecte">École Directe</option>
            </select>
          </label>

          {provider === 'pronote' && (
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              URL PRONOTE
              <input
                required
                type="url"
                placeholder="https://…/pronote/"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          )}

          {provider !== 'demo' && (
            <>
              <label className="mt-4 block text-sm font-medium text-zinc-700">
                Identifiant
                <input
                  required
                  autoComplete="username"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-zinc-700">
                Mot de passe
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[var(--color-brand)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)] disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }

  const pending = homework.filter((h) => !h.done);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-10 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{user?.displayName}</h1>
          <p className="text-sm text-zinc-500">
            {user?.className ?? user?.provider}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 ring-1 ring-zinc-200 hover:bg-white"
        >
          Déconnexion
        </button>
      </header>

      {digest && (
        <section className="mb-5 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-indigo-700 p-5 text-white shadow-md">
          <h2 className="text-sm font-medium opacity-90">Léa</h2>
          <p className="mt-2 text-sm leading-relaxed">{digest.summary}</p>
          <ul className="mt-3 space-y-1 text-xs opacity-95">
            {digest.highlights.slice(0, 3).map((h) => (
              <li key={h}>• {h}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
        <h2 className="text-sm font-semibold text-zinc-800">Aujourd&apos;hui</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Pas de cours (ou ENT sans EDT web).
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.slice(0, 8).map((ev) => (
              <li
                key={ev.id}
                className="flex gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="shrink-0 font-medium text-[var(--color-brand)]">
                  {format(parseISO(ev.start), 'HH:mm', { locale: fr })}
                </span>
                <span>
                  <span className="font-medium">{ev.title}</span>
                  {ev.room && (
                    <span className="block text-xs text-zinc-500">{ev.room}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
        <h2 className="text-sm font-semibold text-zinc-800">
          Devoirs ({pending.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {pending.slice(0, 10).map((hw) => (
            <li key={hw.id} className="rounded-xl border border-zinc-100 px-3 py-2">
              <p className="text-sm font-medium">{hw.subject}</p>
              <p className="text-xs text-zinc-600 line-clamp-2">{hw.description}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Pour le{' '}
                {format(parseISO(hw.dueDate), 'd MMM', { locale: fr })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {digest && digest.plan.length > 0 && (
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
          <h2 className="text-sm font-semibold">Plan suggéré</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {digest.plan.slice(0, 12).map((b, i) => (
              <li key={`${b.start}-${i}`} className="flex gap-2 text-zinc-700">
                <span className="w-12 shrink-0 text-xs text-zinc-400">
                  {format(parseISO(b.start), 'HH:mm')}
                </span>
                {b.label}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
