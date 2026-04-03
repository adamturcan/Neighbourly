import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type Props = {
  rating: number;
  size?: number;
  onRate?: (rating: number) => void;
  color?: string;
};

export default function StarRating({ rating, size = 20, onRate, color = "#FBBF24" }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const isFull = rating >= star;
        const isHalf = !isFull && rating >= star - 0.5;
        const icon = isFull ? "star" : isHalf ? "star-half-full" : "star-outline";
        const starColor = isFull || isHalf ? color : "#E5E7EB";

        const StarIcon = (
          <MaterialCommunityIcons name={icon} size={size} color={starColor} />
        );

        if (onRate) {
          return (
            <Pressable key={star} onPress={() => onRate(star)} hitSlop={4}>
              {StarIcon}
            </Pressable>
          );
        }
        return <View key={star}>{StarIcon}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 2,
  },
});
