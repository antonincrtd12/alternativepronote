export type SchoolProvider = 'pronote' | 'ecoledirecte' | 'demo';

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
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type AiPlanBlock = {
  start: string;
  end: string;
  label: string;
  kind: 'study' | 'break' | 'homework' | 'class';
  priority?: number;
};

export type AiDigest = {
  summary: string;
  highlights: string[];
  plan: AiPlanBlock[];
  reminders: string[];
};

export type ConnectedUser = {
  displayName: string;
  provider: SchoolProvider;
  className?: string;
};
