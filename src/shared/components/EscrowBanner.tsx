import React from "react";
import { View, Text } from "react-native";

export default function EscrowBanner({
  status,
}: {
  status: "held" | "released" | "none";
}) {
  if (status === "none") return null;
  const text =
    status === "held"
      ? "Funds held in escrow until you confirm completion."
      : "Funds released to helper. Thank you!";
  return (
    <View className="px-4 py-3 bg-surface-muted rounded-2xl mx-4">
      <Text className="text-sm text-text-muted">{text}</Text>
    </View>
  );
}
