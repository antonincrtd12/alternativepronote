import { Homework } from "@/services/shared/homework";
import { Course, CourseStatus } from "@/services/shared/timetable";

export type AiPlanBlock = {
  start: Date;
  end: Date;
  label: string;
  kind: "study" | "break" | "homework" | "class";
  priority?: number;
};

export type AiDigest = {
  summary: string;
  highlights: string[];
  plan: AiPlanBlock[];
  reminders: string[];
};

const difficultyWeight = { easy: 1, medium: 2, hard: 3 } as const;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function freeSlots(courses: Course[]): Array<{ start: Date; end: Date }> {
  const sorted = [...courses]
    .filter((c) => c.status !== CourseStatus.CANCELED)
    .sort((a, b) => a.from.getTime() - b.from.getTime());

  const slots: Array<{ start: Date; end: Date }> = [];
  const dayStart = new Date();
  dayStart.setHours(17, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(21, 30, 0, 0);

  let cursor = dayStart;
  for (const course of sorted) {
    if (course.to <= cursor || course.from >= dayEnd) continue;
    if (course.from > cursor) {
      slots.push({
        start: cursor,
        end: course.from < dayEnd ? course.from : dayEnd,
      });
    }
    if (course.to > cursor) cursor = course.to;
  }
  if (cursor < dayEnd) slots.push({ start: cursor, end: dayEnd });
  return slots.filter((s) => s.end.getTime() - s.start.getTime() >= 25 * 60_000);
}

function homeworkPriority(hw: Homework): number {
  const now = Date.now();
  const due = hw.dueDate.getTime() - now;
  const progress = hw.progress ?? 0.5;
  return due - progress * 12 * 3_600_000;
}

function prioritizeHomework(homework: Homework[]): Homework[] {
  return [...homework]
    .filter((h) => !h.isDone)
    .sort((a, b) => homeworkPriority(a) - homeworkPriority(b));
}

/** Planifie automatiquement devoirs + créneaux libres à partir des données Papillon. */
export function buildAgendaPlan(
  courses: Course[],
  homework: Homework[],
): AiDigest {
  const pending = prioritizeHomework(homework);
  const slots = freeSlots(courses);
  const plan: AiPlanBlock[] = [];

  for (const course of courses.filter((c) => c.status !== CourseStatus.CANCELED)) {
    plan.push({
      start: course.from,
      end: course.to,
      label: course.subject,
      kind: "class",
    });
  }

  let slotIndex = 0;
  for (const hw of pending.slice(0, 4)) {
    const slot = slots[slotIndex];
    if (!slot) break;
    const duration = Math.min(50 * 60_000, slot.end.getTime() - slot.start.getTime());
    const end = new Date(slot.start.getTime() + duration);
    plan.push({
      start: slot.start,
      end,
      label: `Devoir : ${hw.subject}`,
      kind: "homework",
      priority: 2,
    });
    slot.start = end;
    if (slot.end.getTime() - slot.start.getTime() < 20 * 60_000) slotIndex++;
  }

  const nextClass = courses.find(
    (c) => c.status !== CourseStatus.CANCELED && c.from > new Date(),
  );
  const urgent = pending[0];

  const highlights: string[] = [];
  if (nextClass) {
    highlights.push(
      `Prochain cours : ${nextClass.subject} à ${nextClass.from.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );
  }
  if (urgent) {
    highlights.push(
      `Priorité : ${urgent.subject} — ${stripHtml(urgent.content).slice(0, 80)}…`,
    );
  }
  highlights.push(`${pending.length} devoir(s) à faire.`);

  const reminders: string[] = [];
  if (urgent && urgent.dueDate.getTime() - Date.now() < 48 * 3_600_000) {
    reminders.push(`Prévois ~45 min pour « ${urgent.subject} » ce soir.`);
  }
  reminders.push(
    "Ajoute ton emploi du temps au calendrier du téléphone via iCal (réglages Papillon / ENT).",
  );

  const summary =
    pending.length === 0
      ? "Rien en attente — bon moment pour réviser ou souffler."
      : `J’ai placé ${Math.min(pending.length, slots.length)} session(s) dans tes créneaux libres.`;

  return {
    summary,
    highlights,
    plan: plan.sort((a, b) => a.start.getTime() - b.start.getTime()),
    reminders,
  };
}
