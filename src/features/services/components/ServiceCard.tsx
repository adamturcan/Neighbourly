import React from "react";
import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import { Image } from "expo-image";
import type { Service } from "../../../shared/types";
import { km } from "../../../shared/lib/geo";
import { ORIGIN, COLORS } from "../../../shared/lib/constants";

export default function ServiceCard({
  service,
  origin = ORIGIN,
  onPress,
}: {
  service: Service;
  origin?: { lat: number; lng: number };
  onPress?: () => void;
}) {
  const distance = km(origin, { lat: service.lat, lng: service.lng });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View className="w-[220px] h-[260px] rounded-card bg-white overflow-hidden shadow-md">
        <View className="h-[120px] bg-gray-100">
          <Image
            source={{ uri: service.photoUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        </View>

        <View className="flex-1 p-2.5 justify-between">
          <Text className="text-base font-bold text-black" numberOfLines={2}>
            {service.title}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1.5"
            contentContainerStyle={{ gap: 6 }}
          >
            {service.categories.map((c) => (
              <View key={c} className="bg-red-100 rounded-pill px-2 h-7 justify-center">
                <Text className="text-brand-red font-bold text-xs">{c}</Text>
              </View>
            ))}
          </ScrollView>

          <View className="mt-2.5">
            <Text className="text-black font-bold">from €{service.priceFrom}</Text>
            <Text className="text-black/75 text-xs">
              ⭐ {service.rating.toFixed(1)} · {service.jobsDone} jobs · {distance.toFixed(1)} km
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
