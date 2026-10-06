import { randomUUID } from 'node:crypto';
import {
  AccountKind,
  assignmentsFromIntervals,
  cleanURL,
  createSessionHandle,
  loginCredentials,
  loginToken,
  parseTimetable,
  timetableFromIntervals,
  type SessionHandle,
  type TimetableClassLesson,
} from 'pawnote';
import type { UnifiedEvent, UnifiedHomework } from '../types.js';

export type PronoteSession = {
  session: SessionHandle;
  deviceUUID: string;
  displayName: string;
  className?: string;
  authToken?: string;
  username: string;
  url: string;
  kind: AccountKind;
};

function mapLesson(lesson: TimetableClassLesson, index: number): UnifiedEvent {
  const subject = lesson.subject?.name ?? lesson.personalNames[0] ?? 'Cours';
  return {
    id: lesson.id || `lesson-${index}`,
    title: subject,
    subject,
    start: lesson.startDate.toISOString(),
    end: lesson.endDate.toISOString(),
    room: lesson.classrooms.join(', ') || undefined,
    teachers: lesson.teacherNames,
    canceled: lesson.canceled,
  };
}

function mapDifficulty(
  value: number,
): 'easy' | 'medium' | 'hard' | undefined {
  if (value === 1) return 'easy';
  if (value === 2) return 'medium';
  if (value === 3) return 'hard';
  return undefined;
}

export async function connectPronote(params: {
  url: string;
  username: string;
  password: string;
  kind?: 'student' | 'parent' | 'teacher';
  deviceUUID?: string;
  token?: string;
}): Promise<PronoteSession> {
  const session = createSessionHandle();
  const deviceUUID = params.deviceUUID ?? randomUUID();
  const kind =
    params.kind === 'parent'
      ? AccountKind.PARENT
      : params.kind === 'teacher'
        ? AccountKind.TEACHER
        : AccountKind.STUDENT;

  const authBase = {
    url: cleanURL(params.url),
    username: params.username,
    kind,
    deviceUUID,
  };

  const refresh = params.token
    ? await loginToken(session, { ...authBase, token: params.token })
    : await loginCredentials(session, {
        ...authBase,
        password: params.password,
      });

  const resource = session.userResource;
  return {
    session,
    deviceUUID,
    displayName: resource.name,
    className: resource.className,
    authToken: refresh.token,
    username: refresh.username,
    url: refresh.url,
    kind: refresh.kind,
  };
}

export async function fetchPronoteAgenda(
  pronote: PronoteSession,
  start: Date,
  end: Date,
): Promise<UnifiedEvent[]> {
  const timetable = await timetableFromIntervals(pronote.session, start, end);
  parseTimetable(pronote.session, timetable, {
    withCanceledClasses: true,
    withPlannedClasses: false,
    withSuperposedCanceledClasses: false,
  });

  return timetable.classes
    .filter((c): c is TimetableClassLesson => c.is === 'lesson')
    .map(mapLesson);
}

export async function fetchPronoteHomework(
  pronote: PronoteSession,
  start: Date,
  end: Date,
): Promise<UnifiedHomework[]> {
  const assignments = await assignmentsFromIntervals(
    pronote.session,
    start,
    end,
  );

  return assignments.map((a) => ({
    id: a.id,
    subject: a.subject?.name ?? 'Devoir',
    description: a.description || 'Sans description',
    dueDate: a.deadline.toISOString(),
    done: a.done,
    difficulty: mapDifficulty(a.difficulty),
  }));
}
