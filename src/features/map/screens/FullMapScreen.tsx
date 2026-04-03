import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { listServices } from "../../../shared/lib/repo";
import { ORIGIN } from "../../../shared/lib/constants";

export default function FullMapScreen() {
  const { data } = useQuery({
    queryKey: ["services", "map"],
    queryFn: () => listServices({ near: ORIGIN }),
  });

  return (
    <View className="flex-1 bg-white">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: ORIGIN.lat,
          longitude: ORIGIN.lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        {data?.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={s.title}
            description={`from €${s.priceFrom} • ⭐ ${s.rating.toFixed(1)}`}
          />
        ))}
      </MapView>
    </View>
  );
}
