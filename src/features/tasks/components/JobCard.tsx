import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import type { Task } from "../../../shared/types";

type Props = {
  task: Task;
  onPress?: () => void;
};

export default function JobCard({ task, onPress }: Props) {
  const img =
    typeof task.image === "string" && task.image.length
      ? task.image
      : "https://images.unsplash.com/photo-1503602642458-232111445657";

  const cats = Array.isArray(task.categories) ? task.categories : [];

  return (
    <Pressable onPress={onPress} className="w-[220px] h-[260px] rounded-2xl bg-white overflow-hidden shadow-md">
      <Image source={{ uri: img }} style={{ width: "100%", height: 120 }} resizeMode="cover" />
      <View className="flex-1 p-2.5 gap-1.5">
        <Text numberOfLines={2} className="text-base font-semibold">
          {task.title}
        </Text>

        <Text numberOfLines={2} className="text-text-subtle text-sm">
          {task.description}
        </Text>

        <View className="flex-row items-center">
          <Text className="font-semibold">
            {task.budget ? `€${task.budget}` : "Budget TBD"}
          </Text>
        </View>

        {!!cats.length && (
          <View className="flex-row flex-wrap gap-1.5">
            {cats.slice(0, 3).map((c: string) => (
              <View key={c} className="px-2 py-1 rounded-pill bg-surface-dim">
                <Text className="text-xs text-gray-700">{c}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
