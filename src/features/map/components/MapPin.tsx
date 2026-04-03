import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

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

export default function MapPin({
  color,
  category,
}: {
  color: string;
  category: string;
}) {
  return (
    <View style={s.wrap}>
      <View style={[s.head, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name={(CATEGORY_ICONS[category] as any) ?? "help-circle-outline"}
          size={15}
          color="#fff"
        />
      </View>
      <View style={[s.pointer, { borderTopColor: color }]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 34,
    height: 44,
  },
  head: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
