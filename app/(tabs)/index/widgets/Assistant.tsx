import { Papicons } from "@getpapillon/papicons";
import { useRouter } from "expo-router";
import { t } from "i18next";
import React from "react";
import { View } from "react-native";

import { useAssistantPlan } from "@/hooks/useAssistantPlan";
import Stack from "@/ui/components/Stack";
import Typography from "@/ui/components/Typography";
import Button from "@/ui/new/Button";

const AssistantWidget = () => {
  const router = useRouter();
  const { digest, pendingCount } = useAssistantPlan();

  return (
    <View style={{ width: "100%", gap: 10, paddingVertical: 4 }}>
      <Typography variant="body2" color="textSecondary">
        {digest.summary}
      </Typography>
      {digest.highlights.slice(0, 2).map((line) => (
        <Stack key={line} direction="horizontal" gap={8} vAlign="start">
          <Papicons name="Sparkles" size={16} />
          <Typography variant="body2" style={{ flex: 1 }}>
            {line}
          </Typography>
        </Stack>
      ))}
      <Button
        label={t("Home_Assistant_Open", { count: pendingCount })}
        onPress={() => router.navigate("/(modals)/assistant")}
        variant="secondary"
      />
    </View>
  );
};

export default AssistantWidget;
