import React from "react";
import MapView, { Marker } from "react-native-maps";
import { Repo } from "../../../shared/lib/repo";
import { useQuery } from "@tanstack/react-query";
import { ORIGIN } from "../../../shared/lib/constants";

export default function MapScreen() {
  const { data: helpers } = useQuery({
    queryKey: ["helpers", ORIGIN],
    queryFn: () =>
      Repo.getNearbyHelpers({ lat: ORIGIN.lat, lng: ORIGIN.lng }),
  });

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: ORIGIN.lat,
        longitude: ORIGIN.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {helpers?.map((h) => (
        <Marker
          key={h.id}
          coordinate={{ latitude: h.lat, longitude: h.lng }}
          title={h.name}
        />
      ))}
    </MapView>
  );
}
