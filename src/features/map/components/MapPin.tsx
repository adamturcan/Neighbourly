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
  selected,
}: {
  color: string;
  category: string;
  selected?: boolean;
}) {
  const size = selected ? 42 : 34;
  const iconSize = selected ? 18 : 15;

  return (
    <View style={[s.wrap, { width: size, height: size + 10 }]}>
      {/* Drop shape */}
      <View
        style={[
          s.head,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderWidth: selected ? 3 : 2.5,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={(CATEGORY_ICONS[category] as any) ?? "help-circle-outline"}
          size={iconSize}
          color="#fff"
        />
      </View>
      {/* Triangle pointer */}
      <View
        style={[
          s.pointer,
          {
            borderLeftWidth: selected ? 7 : 5,
            borderRightWidth: selected ? 7 : 5,
            borderTopWidth: selected ? 9 : 7,
            borderTopColor: color,
          },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  head: {
    alignItems: "center",
    justifyContent: "center",
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
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
