import { useMemo } from "react";

import { buildAgendaPlan } from "@/utils/ai/agendaAssistant";

import { useTimetableWidgetData } from "@/app/(tabs)/index/hooks/useTimetableWidgetData";
import { useUpcomingHomework } from "@/app/(tabs)/tasks/hooks/useUpcomingHomework";

export const useAssistantPlan = () => {
  const { courses } = useTimetableWidgetData();
  const { upcoming } = useUpcomingHomework(2);

  const digest = useMemo(
    () => buildAgendaPlan(courses, upcoming),
    [courses, upcoming],
  );

  return { digest, hasCourses: courses.length > 0, pendingCount: upcoming.length };
};
