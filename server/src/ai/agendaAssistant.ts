import type { AiDigest, AiPlanBlock, UnifiedEvent, UnifiedHomework } from '../types.js';

const difficultyWeight = { easy: 1, medium: 2, hard: 3 } as const;

function freeSlots(events: UnifiedEvent[]): Array<{ start: Date; end: Date }> {
  const sorted = [...events]
    .filter((e) => !e.canceled)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const slots: Array<{ start: Date; end: Date }> = [];
  const dayStart = new Date();
  dayStart.setHours(17, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(21, 30, 0, 0);

  let cursor = dayStart;
  for (const ev of sorted) {
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    if (end <= cursor || start >= dayEnd) continue;
    if (start > cursor) {
      slots.push({ start: cursor, end: start < dayEnd ? start : dayEnd });
    }
    if (end > cursor) cursor = end;
  }
  if (cursor < dayEnd) slots.push({ start: cursor, end: dayEnd });
  return slots.filter((s) => s.end.getTime() - s.start.getTime() >= 25 * 60_000);
}

function prioritizeHomework(homework: UnifiedHomework[]): UnifiedHomework[] {
  const now = Date.now();
  return [...homework]
    .filter((h) => !h.done)
    .sort((a, b) => {
      const da = new Date(a.dueDate).getTime() - now;
      const db = new Date(b.dueDate).getTime() - now;
      const wa = difficultyWeight[a.difficulty ?? 'medium'];
      const wb = difficultyWeight[b.difficulty ?? 'medium'];
      return da + wa * 3_600_000 - (db + wb * 3_600_000);
    });
}

export function buildAgendaPlan(
  events: UnifiedEvent[],
  homework: UnifiedHomework[],
): AiDigest {
  const pending = prioritizeHomework(homework);
  const slots = freeSlots(events);
  const plan: AiPlanBlock[] = [];

  for (const ev of events.filter((e) => !e.canceled)) {
    plan.push({
      start: ev.start,
      end: ev.end,
      label: ev.title,
      kind: 'class',
    });
  }

  let slotIndex = 0;
  for (const hw of pending.slice(0, 4)) {
    const slot = slots[slotIndex];
    if (!slot) break;
    const duration = Math.min(
      50 * 60_000,
      slot.end.getTime() - slot.start.getTime(),
    );
    const end = new Date(slot.start.getTime() + duration);
    plan.push({
      start: slot.start.toISOString(),
      end: end.toISOString(),
      label: `Réviser : ${hw.subject}`,
      kind: 'homework',
      priority: difficultyWeight[hw.difficulty ?? 'medium'],
    });
    slot.start = end;
    if (slot.end.getTime() - slot.start.getTime() < 20 * 60_000) slotIndex++;
  }

  const nextClass = events.find(
    (e) => !e.canceled && new Date(e.start) > new Date(),
  );
  const urgent = pending[0];

  const highlights: string[] = [];
  if (nextClass) {
    highlights.push(
      `Prochain cours : ${nextClass.title} à ${new Date(nextClass.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    );
  }
  if (urgent) {
    highlights.push(
      `Priorité devoirs : ${urgent.subject} — échéance ${new Date(urgent.dueDate).toLocaleDateString('fr-FR')}`,
    );
  }
  highlights.push(`${pending.length} devoir(s) restant(s) aujourd’hui ou bientôt.`);

  const reminders: string[] = [];
  if (urgent && new Date(urgent.dueDate).getTime() - Date.now() < 48 * 3_600_000) {
    reminders.push(`Bloc de 45 min conseillé pour « ${urgent.subject} » ce soir.`);
  }
  reminders.push('Synchronise ton calendrier téléphone via l’export iCal (Pronote) depuis les réglages.');

  const summary =
    pending.length === 0
      ? 'Aucun devoir en attente — profite des créneaux libres pour réviser ou te reposer.'
      : `J’ai planifié ${Math.min(pending.length, slots.length)} session(s) de travail dans tes créneaux libres.`;

  return {
    summary,
    highlights,
    plan: plan.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    ),
    reminders,
  };
}

export async function enhanceWithLlm(
  digest: AiDigest,
  events: UnifiedEvent[],
  homework: UnifiedHomework[],
): Promise<AiDigest> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return digest;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'Tu es Léa, assistante scolaire française. Réponds en JSON avec les clés summary (string), highlights (string[]), reminders (string[]). Sois concise et bienveillante.',
          },
          {
            role: 'user',
            content: JSON.stringify({ digest, events, homework }),
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return digest;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return digest;
    const parsed = JSON.parse(content) as Partial<AiDigest>;
    return {
      ...digest,
      summary: parsed.summary ?? digest.summary,
      highlights: parsed.highlights ?? digest.highlights,
      reminders: parsed.reminders ?? digest.reminders,
    };
  } catch {
    return digest;
  }
}
