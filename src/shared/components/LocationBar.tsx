import React from "react";
import { View, Pressable, Text, Animated } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocation } from "../lib/store/useLocation";
import { COLORS } from "../lib/constants";

export default function LocationBar({
  onPress,
  rightSlot,
  animatedStyle,
  showChevron = true,
}: {
  onPress: () => void;
  rightSlot?: React.ReactNode;
  animatedStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  showChevron?: boolean;
}) {
  const { current } = useLocation();
  const address = current
    ? `${current.label} · ${current.line1}${current.city ? `, ${current.city}` : ""}`
    : "Vyber polohu";

  return (
    <Animated.View style={[{ backgroundColor: "transparent" }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        className="px-4 py-2.5"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="w-7 h-7 rounded-full bg-red-100 items-center justify-center">
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.red} />
          </View>

          <View className="flex-1 flex-row items-center">
            <Text
              numberOfLines={1}
              className="flex-shrink text-base font-bold text-black"
            >
              {address}
            </Text>

            <View className="ml-1.5">
              {showChevron || !rightSlot ? (
                <MaterialCommunityIcons name="chevron-down" size={22} color="#000" />
              ) : (
                rightSlot
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
