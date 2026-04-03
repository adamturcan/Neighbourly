import React, { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { listTasks } from "../../../shared/lib/api";
import { useCurrentLocation } from "../../../shared/hooks/useCurrentLocation";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MapPin from "./MapPin";
import type { Task } from "../../../shared/types";
import { km } from "../../../shared/lib/geo";

const CATEGORY_ICONS: Record<string, string> = {
  cleaning: "broom", chores: "broom", gardening: "flower-outline",
  moving: "truck-outline", tutoring: "school-outline", plumbing: "pipe-wrench",
  electrical: "flash-outline", painting: "format-paint", car: "car-outline",
};

export default function DiscoverMapView({
  onTaskPress,
}: {
  onTaskPress: (taskId: string) => void;
}) {
  const { location } = useCurrentLocation();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "open"],
    queryFn: () => listTasks(),
  });

  const validTasks = tasks.filter((t) => t.lat !== 0 && t.lng !== 0);
  const selected = validTasks.find((t) => t.id === selectedId);

  // Sort nearby tasks by distance
  const nearby = [...validTasks]
    .map((t) => ({ ...t, dist: km(location, { lat: t.lat, lng: t.lng }) }))
    .sort((a, b) => a.dist - b.dist);

  const otherNearby = nearby.filter((t) => t.id !== selectedId).slice(0, 3);

  const recenter = () => {
    mapRef.current?.animateToRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedId(null)}
      >
        {validTasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{ latitude: task.lat, longitude: task.lng }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedId(task.id);
            }}
            tracksViewChanges={false}
          >
            <MapPin
              color={CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.other}
              category={task.category}
              selected={task.id === selectedId}
            />
          </Marker>
        ))}
      </MapView>

      {/* Recenter */}
      <Pressable onPress={recenter} style={s.recenterBtn}>
        <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#3B82F6" />
      </Pressable>

      {/* V2: Bottom sheet */}
      <View style={[s.sheet, { bottom: TAB_BAR_HEIGHT + 4 }]}>
        <View style={s.sheetInner}>
          <View style={s.grabber} />

          {selected ? (
            <>
              {/* Selected task (highlighted) */}
              <Pressable onPress={() => onTaskPress(selected.id)} style={s.selectedRow}>
                <View style={[s.iconBox, { backgroundColor: CATEGORY_COLORS[selected.category] ?? "#6B7280" }]}>
                  <MaterialCommunityIcons
                    name={(CATEGORY_ICONS[selected.category] as any) ?? "help-circle-outline"}
                    size={18} color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectedTitle} numberOfLines={1}>{selected.title}</Text>
                  <Text style={s.selectedSub}>
                    {km(location, { lat: selected.lat, lng: selected.lng }).toFixed(1)} km · {selected.category}
                  </Text>
                </View>
                <Text style={s.selectedPrice}>€{selected.budget}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
              </Pressable>

              {/* Other nearby */}
              {otherNearby.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setSelectedId(t.id);
                    mapRef.current?.animateToRegion({
                      latitude: t.lat, longitude: t.lng,
                      latitudeDelta: 0.02, longitudeDelta: 0.02,
                    });
                  }}
                  style={s.nearbyRow}
                >
                  <View style={[s.nearbyIcon, { backgroundColor: (CATEGORY_COLORS[t.category] ?? "#6B7280") + "15" }]}>
                    <MaterialCommunityIcons
                      name={(CATEGORY_ICONS[t.category] as any) ?? "help-circle-outline"}
                      size={16} color={CATEGORY_COLORS[t.category] ?? "#6B7280"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nearbyTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={s.nearbySub}>{t.dist.toFixed(1)} km</Text>
                  </View>
                  <Text style={s.nearbyPrice}>€{t.budget}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            /* No selection — show nearby list */
            nearby.slice(0, 4).map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setSelectedId(t.id);
                  mapRef.current?.animateToRegion({
                    latitude: t.lat, longitude: t.lng,
                    latitudeDelta: 0.02, longitudeDelta: 0.02,
                  });
                }}
                style={s.nearbyRow}
              >
                <View style={[s.nearbyIcon, { backgroundColor: (CATEGORY_COLORS[t.category] ?? "#6B7280") + "15" }]}>
                  <MaterialCommunityIcons
                    name={(CATEGORY_ICONS[t.category] as any) ?? "help-circle-outline"}
                    size={16} color={CATEGORY_COLORS[t.category] ?? "#6B7280"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.nearbyTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={s.nearbySub}>{t.dist.toFixed(1)} km</Text>
                </View>
                <Text style={s.nearbyPrice}>€{t.budget}</Text>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  recenterBtn: {
    position: "absolute", top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  sheet: {
    position: "absolute", left: 0, right: 0,
  },
  sheetInner: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 6, paddingBottom: 10, paddingHorizontal: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 }, elevation: 6,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E5EA", alignSelf: "center", marginBottom: 10 },

  // Selected task
  selectedRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 14,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FEE2E2",
    marginBottom: 6,
  },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  selectedTitle: { fontSize: 13, fontWeight: "700", color: "#000" },
  selectedSub: { fontSize: 11, color: "#A1A1AA", marginTop: 1 },
  selectedPrice: { fontSize: 15, fontWeight: "700", color: COLORS.red, marginRight: 2 },

  // Nearby tasks
  nearbyRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 8, paddingHorizontal: 4,
    borderTopWidth: 0.5, borderTopColor: "#F5F5F5",
  },
  nearbyIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  nearbyTitle: { fontSize: 12, fontWeight: "600", color: "#000" },
  nearbySub: { fontSize: 10, color: "#A1A1AA" },
  nearbyPrice: { fontSize: 13, fontWeight: "700", color: "#71717A" },
});
