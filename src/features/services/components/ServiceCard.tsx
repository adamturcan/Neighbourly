import React from "react";
import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import { Image } from "expo-image";
import type { Service } from "../../../shared/types";
import { km } from "../../../shared/lib/geo";
import { ORIGIN, COLORS } from "../../../shared/lib/constants";

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=600&auto=format&fit=crop",
  chores: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=600&auto=format&fit=crop",
  gardening: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=600&auto=format&fit=crop",
  moving: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=600&auto=format&fit=crop",
  tutoring: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop",
  plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop",
  electrical: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=600&auto=format&fit=crop",
  painting: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?q=80&w=600&auto=format&fit=crop",
  car: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=600&auto=format&fit=crop",
  maintenance: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
};

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
  const imageUrl = service.photoUrl
    || service.categories?.map((c) => FALLBACK_IMAGES[c]).find(Boolean)
    || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View className="w-[220px] h-[260px] rounded-card bg-white overflow-hidden shadow-md">
        <View className="h-[120px] bg-gray-100">
          <Image
            source={{ uri: imageUrl }}
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
