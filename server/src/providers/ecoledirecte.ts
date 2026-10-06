import { createRequire } from 'node:module';
import type { UnifiedHomework } from '../types.js';

const require = createRequire(import.meta.url);
const { Auth, Api } = require('ecoledirecte-client') as {
  Auth: new () => {
    login: (
      username: string,
      password: string,
      cn?: string,
      cv?: string,
    ) => Promise<{ token: string; profile: Record<string, unknown> }>;
  };
  Api: new (login: { token: string; profile: Record<string, unknown> }) => {
    getStudents: () => Promise<
      Array<{
        getId: () => number;
        getFullName: () => string;
        getClass: () => string;
        getHomeworks: () => Promise<unknown>;
      }>
    >;
  };
};

export type EcoleDirecteSession = {
  api: InstanceType<typeof Api>;
  studentId: number;
  displayName: string;
  className: string;
};

export async function connectEcoleDirecte(params: {
  username: string;
  password: string;
}): Promise<EcoleDirecteSession> {
  const auth = new Auth();
  const login = await auth.login(params.username, params.password);
  if (!login) {
    throw new Error(
      'Connexion ÉcoleDirecte impossible (double auth ou identifiants).',
    );
  }

  const api = new Api(login);
  const students = await api.getStudents();
  const student = students[0];
  if (!student) {
    throw new Error('Aucun profil élève trouvé sur ce compte.');
  }

  return {
    api,
    studentId: student.getId(),
    displayName: student.getFullName(),
    className: student.getClass(),
  };
}

/** Cahier de texte — l’emploi du temps ED arrive dans une prochaine itération. */
export async function fetchEcoleDirecteHomework(
  ed: EcoleDirecteSession,
): Promise<UnifiedHomework[]> {
  const students = await ed.api.getStudents();
  const student = students.find((s) => s.getId() === ed.studentId) ?? students[0];
  const days = await student.getHomeworks();
  const list: UnifiedHomework[] = [];

  for (const day of days as Array<{
    getDate: () => string;
    getHomeworks: () => Promise<
      Array<{
        getSubject: () => string;
        getDescription: () => string;
        isDone: () => boolean;
      }>
    >;
  }>) {
    const date = day.getDate();
    const homeworks = await day.getHomeworks();
    for (const hw of homeworks) {
      list.push({
        id: `${date}-${hw.getSubject()}-${list.length}`,
        subject: hw.getSubject(),
        description: hw.getDescription(),
        dueDate: date,
        done: hw.isDone(),
      });
    }
  }

  return list;
}
