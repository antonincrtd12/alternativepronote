import type { UnifiedEvent, UnifiedHomework } from '../types.js';

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();

function at(hour: number, minute = 0): string {
  return new Date(y, m, d, hour, minute).toISOString();
}

export const demoUser = {
  displayName: 'Antonin (démo)',
  provider: 'demo' as const,
  className: 'Terminale — Spé Maths',
};

export const demoEvents: UnifiedEvent[] = [
  {
    id: 'demo-1',
    title: 'Mathématiques',
    subject: 'Mathématiques',
    start: at(8, 0),
    end: at(9, 0),
    room: 'Salle B12',
    teachers: ['M. Dupont'],
  },
  {
    id: 'demo-2',
    title: 'Physique-Chimie',
    subject: 'Physique-Chimie',
    start: at(9, 15),
    end: at(10, 15),
    room: 'Labo 3',
    teachers: ['Mme Martin'],
  },
  {
    id: 'demo-3',
    title: 'Anglais',
    subject: 'Anglais',
    start: at(10, 30),
    end: at(11, 30),
    room: 'A04',
    teachers: ['M. Smith'],
  },
  {
    id: 'demo-4',
    title: 'Philosophie',
    subject: 'Philosophie',
    start: at(13, 30),
    end: at(14, 30),
    room: 'C21',
    teachers: ['Mme Leroy'],
  },
];

export const demoHomework: UnifiedHomework[] = [
  {
    id: 'hw-1',
    subject: 'Mathématiques',
    description: 'Exercices 3 à 7 — suites et limites (chapitre 4)',
    dueDate: at(23, 59),
    done: false,
    difficulty: 'hard',
  },
  {
    id: 'hw-2',
    subject: 'Anglais',
    description: 'Rédaction : 250 mots sur le thème « technology »',
    dueDate: new Date(y, m, d + 2, 23, 59).toISOString(),
    done: false,
    difficulty: 'medium',
  },
  {
    id: 'hw-3',
    subject: 'Physique-Chimie',
    description: 'Compte-rendu TP — loi des gaz',
    dueDate: new Date(y, m, d + 1, 8, 0).toISOString(),
    done: true,
    difficulty: 'easy',
  },
];
