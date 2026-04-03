import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import MapView, { Marker } from "react-native-maps";
import { useRoute } from "@react-navigation/native";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { useQuery } from "@tanstack/react-query";
import { getService } from "../../../shared/lib/api";
import { COLORS } from "../../../shared/lib/constants";

type RouteParams = { serviceId: string };

export default function ServiceDetailScreen() {
  const route = useRoute();
  const { serviceId } = (route.params ?? {}) as RouteParams;

  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });

  if (!service) return null;

  const hero = service.photoUrl || "https://images.unsplash.com/photo-1503602642458-232111445657";
  const lat = Number(service.lat);
  const lng = Number(service.lng);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}>
      <View className="h-60 bg-gray-100">
        <Image
          source={{ uri: hero }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={150}
        />
      </View>

      <View className="p-4 gap-2.5">
        <Text className="text-2xl font-extrabold text-black">
          {service.title}
        </Text>

        <View className="flex-row gap-2 flex-wrap">
          {service.categories?.map((c: string) => (
            <View key={c} className="bg-red-100 rounded-pill px-3 py-1">
              <Text className="text-brand-red font-bold text-sm">{c}</Text>
            </View>
          ))}
        </View>

        <Text className="text-black text-base">
          from{" "}
          <Text className="font-extrabold">€{Number(service.priceFrom ?? 0)}</Text>{" "}
          · ⭐ {Number(service.rating ?? 0).toFixed(1)} · {service.jobsDone ?? 0}{" "}
          jobs
        </Text>

        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <View className="rounded-card overflow-hidden h-40">
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
            >
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                title={service.title ?? "Service"}
              />
            </MapView>
          </View>
        )}

        <Pressable
          onPress={() => alert("Request sent (mock).")}
          className="mt-1.5 bg-brand-red rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">Hire now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
