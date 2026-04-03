import React, { useState } from "react";
import { View, FlatList, TextInput, Text } from "react-native";
import { listServices } from "../../../shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import ServiceCard from "../components/ServiceCard";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebounced } from "../../../shared/hooks/useDebounced";
import { ORIGIN } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const qd = useDebounced(q, 300);
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ["search", qd],
    queryFn: async () => {
      const all = await listServices({ near: ORIGIN });
      if (!qd.trim()) return all;
      const s = qd.toLowerCase();
      return all.filter(
        (item) =>
          item.title.toLowerCase().includes(s) ||
          item.categories.some((c) => c.toLowerCase().includes(s)),
      );
    },
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pb-2">
        <TextInput
          placeholder="Search services, e.g. cleaning, tutoring…"
          value={q}
          onChangeText={setQ}
          className="bg-surface-muted rounded-2xl px-4 py-3 text-base"
          placeholderTextColor="#6B7280"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">Loading…</Text>
        </View>
      ) : data?.length ? (
        <FlatList
          data={data}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <ServiceCard service={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: TAB_BAR_HEIGHT + 16,
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted">No results. Try another term.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
