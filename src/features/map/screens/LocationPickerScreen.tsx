import React, { useRef, useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Region } from "react-native-maps";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCurrentLocation } from "../../../shared/hooks/useCurrentLocation";
import { COLORS } from "../../../shared/lib/constants";

type Props = {
  onConfirm: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
};

export default function LocationPickerScreen({
  onConfirm,
  onClose,
  initialLocation,
}: Props) {
  const { location: currentLoc } = useCurrentLocation();
  const mapRef = useRef<MapView>(null);

  const initial = initialLocation ?? currentLoc;
  const [region, setRegion] = useState<Region>({
    latitude: initial.lat,
    longitude: initial.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState("Move the map to pick a location");

  const onRegionChange = useCallback((r: Region) => {
    setRegion(r);
    // Simple reverse geocode placeholder — in production use Google/Mapbox geocoding API
    setAddress(`${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`);
  }, []);

  const useMyLocation = () => {
    const r = {
      latitude: currentLoc.lat,
      longitude: currentLoc.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(r);
    setRegion(r);
    setAddress("Current location");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={22} color="#71717A" />
        </Pressable>
        <Text style={s.headerTitle}>Choose location</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color="#A1A1AA" />
          <TextInput
            placeholder="Search address…"
            style={s.searchInput}
            placeholderTextColor="#A1A1AA"
          />
        </View>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          onRegionChangeComplete={onRegionChange}
          showsUserLocation
          showsMyLocationButton={false}
        />

        {/* Center pin (fixed in center of map) */}
        <View style={s.centerPin} pointerEvents="none">
          <View style={s.pinHead}>
            <MaterialCommunityIcons name="map-marker" size={22} color="#fff" />
          </View>
          <View style={s.pinShadow} />
        </View>

        {/* Use my location button */}
        <Pressable onPress={useMyLocation} style={s.myLocationBtn}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#3B82F6" />
          <Text style={s.myLocationText}>Use my location</Text>
        </Pressable>
      </View>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        <View style={s.addressRow}>
          <View style={s.addressIcon}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.addressTitle} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() =>
            onConfirm({
              lat: region.latitude,
              lng: region.longitude,
              address,
            })
          }
          style={s.confirmBtn}
        >
          <Text style={s.confirmText}>Confirm location</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBar: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#000" },
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -44,
    alignItems: "center",
    zIndex: 10,
  },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pinShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(227,27,35,0.3)",
    marginTop: 2,
  },
  myLocationBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  myLocationText: { fontSize: 12, fontWeight: "600", color: "#000" },
  bottomCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
    borderTopWidth: 0.5,
    borderTopColor: "#F0F0F0",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  addressTitle: { fontSize: 14, fontWeight: "600", color: "#000" },
  confirmBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
