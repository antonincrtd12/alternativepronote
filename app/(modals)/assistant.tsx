import { Papicons } from "@getpapillon/papicons";
import { useTheme } from "expo-router/react-navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { t } from "i18next";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAssistantPlan } from "@/hooks/useAssistantPlan";
import Stack from "@/ui/components/Stack";
import Typography from "@/ui/components/Typography";

export default function AssistantModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { digest } = useAssistantPlan();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        gap: 20,
      }}
    >
      <Typography variant="h2">{t("Assistant_Title")}</Typography>
      <Typography variant="body2" color="textSecondary">
        {t("Assistant_Subtitle")}
      </Typography>
      <Typography variant="body1">{digest.summary}</Typography>

      <View style={{ gap: 8 }}>
        <Typography variant="body1" weight="bold">
          {t("Assistant_Highlights")}
        </Typography>
        {digest.highlights.map((line) => (
          <Stack key={line} direction="horizontal" gap={8}>
            <Papicons name="Check" size={18} />
            <Typography variant="body2" style={{ flex: 1 }}>{line}</Typography>
          </Stack>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Typography variant="body1" weight="bold">
          {t("Assistant_Plan")}
        </Typography>
        {digest.plan.map((block, index) => (
          <Stack
            key={`${block.kind}-${index}-${block.start.getTime()}`}
            direction="horizontal"
            gap={12}
            vAlign="center"
          >
            <Typography variant="caption" style={{ width: 52, opacity: 0.6 }}>
              {format(block.start, "HH:mm", { locale: fr })}
            </Typography>
            <Typography variant="body2" style={{ flex: 1 }}>
              {block.label}
            </Typography>
          </Stack>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Typography variant="body1" weight="bold">
          {t("Assistant_Reminders")}
        </Typography>
        {digest.reminders.map((line) => (
          <Stack key={line} direction="horizontal" gap={8}>
            <Papicons name="Bell" size={18} />
            <Typography variant="body2" style={{ flex: 1 }}>{line}</Typography>
          </Stack>
        ))}
      </View>
    </ScrollView>
  );
}
