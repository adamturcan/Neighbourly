import React, { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { listTasks } from "../../../shared/lib/api";
import { useCurrentLocation } from "../../../shared/hooks/useCurrentLocation";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Task } from "../../../shared/types";

export default function DiscoverMapView({
  onTaskPress,
}: {
  onTaskPress: (taskId: string) => void;
}) {
  const { location } = useCurrentLocation();
  const mapRef = useRef<MapView>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "open"],
    queryFn: () => listTasks(),
  });

  const recenter = () => {
    mapRef.current?.animateToRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    });
  };

  const validTasks = tasks.filter((t) => t.lat !== 0 && t.lng !== 0);

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
        onPress={() => setSelectedTask(null)}
      >
        {validTasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{ latitude: task.lat, longitude: task.lng }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedTask(task);
            }}
            tracksViewChanges={false}
            pinColor={CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.other}
          />
        ))}
      </MapView>

      {/* Recenter button */}
      <Pressable onPress={recenter} style={s.recenterBtn}>
        <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#3B82F6" />
      </Pressable>

      {/* Task preview card */}
      {selectedTask && (
        <View style={[s.previewWrap, { bottom: TAB_BAR_HEIGHT + 12 }]}>
          <View style={s.previewCard}>
            <View style={s.grabber} />
            <Pressable onPress={() => onTaskPress(selectedTask.id)} style={s.previewRow}>
              <View
                style={[
                  s.previewIcon,
                  { backgroundColor: CATEGORY_COLORS[selectedTask.category] ?? CATEGORY_COLORS.other },
                ]}
              >
                <MaterialCommunityIcons name="map-marker" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewTitle} numberOfLines={1}>{selectedTask.title}</Text>
                <Text style={s.previewSub}>{selectedTask.category}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.previewPrice}>€{selectedTask.budget}</Text>
                <Text style={s.previewTime}>ASAP</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => onTaskPress(selectedTask.id)} style={s.previewBtn}>
              <Text style={s.previewBtnText}>View task</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  recenterBtn: {
    position: "absolute",
    bottom: 160,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  previewWrap: { position: "absolute", left: 0, right: 0 },
  previewCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E5EA", alignSelf: "center", marginBottom: 12 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previewTitle: { fontSize: 14, fontWeight: "700", color: "#000" },
  previewSub: { fontSize: 12, color: "#A1A1AA", marginTop: 1, textTransform: "capitalize" },
  previewPrice: { fontSize: 15, fontWeight: "700", color: COLORS.red },
  previewTime: { fontSize: 11, color: "#A1A1AA" },
  previewBtn: { backgroundColor: COLORS.red, borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  previewBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
