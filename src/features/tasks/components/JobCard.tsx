import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Task } from "../../../shared/types";
import { CATEGORY_COLORS } from "../../../shared/lib/constants";

const CATEGORY_IMAGES: Record<string, string> = {
  cleaning: "https://images.unsplash.com/photo-1581574209460-7bdd93839a0b?q=80&w=600&auto=format&fit=crop",
  chores: "https://images.unsplash.com/photo-1581574209460-7bdd93839a0b?q=80&w=600&auto=format&fit=crop",
  gardening: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=600&auto=format&fit=crop",
  moving: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=600&auto=format&fit=crop",
  tutoring: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop",
  plumbing: "https://images.unsplash.com/photo-1581579188871-c6b9b9c49b08?q=80&w=600&auto=format&fit=crop",
  electrical: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=600&auto=format&fit=crop",
  painting: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?q=80&w=600&auto=format&fit=crop",
  car: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=600&auto=format&fit=crop",
};

const CATEGORY_ICONS: Record<string, string> = {
  cleaning: "broom",
  chores: "broom",
  gardening: "flower-outline",
  moving: "truck-outline",
  tutoring: "school-outline",
  plumbing: "pipe-wrench",
  electrical: "flash-outline",
  painting: "format-paint",
  car: "car-outline",
};

type Props = {
  task: Task;
  onPress?: () => void;
};

export default function JobCard({ task, onPress }: Props) {
  const img = CATEGORY_IMAGES[task.category] ?? "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=600";
  const catColor = CATEGORY_COLORS[task.category] ?? "#6B7280";

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 220,
        borderRadius: 16,
        backgroundColor: "#fff",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      {/* Image with category badge */}
      <View style={{ height: 120, backgroundColor: "#eee" }}>
        <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: catColor,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <MaterialCommunityIcons
            name={(CATEGORY_ICONS[task.category] as any) ?? "help-circle-outline"}
            size={12}
            color="#fff"
          />
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff", textTransform: "capitalize" }}>
            {task.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 10, gap: 4 }}>
        <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: "600", color: "#000" }}>
          {task.title}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 12, color: "#71717A", lineHeight: 16 }}>
          {task.description}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: catColor }}>
            {task.budget ? `€${task.budget}` : "Budget TBD"}
          </Text>
          <Text style={{ fontSize: 11, color: "#A1A1AA" }}>ASAP</Text>
        </View>
      </View>
    </Pressable>
  );
}
