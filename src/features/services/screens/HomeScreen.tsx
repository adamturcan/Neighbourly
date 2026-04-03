import React, { useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Animated,
  Text,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listServices, listTasks } from "../../../shared/lib/api";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ServiceCard from "../components/ServiceCard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import JobCard from "../../tasks/components/JobCard";
import LocationPickerSheet from "../../../shared/components/LocationPickerSheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { COLORS } from "../../../shared/lib/constants";
import DiscoverMapView from "../../map/components/DiscoverMapView";
import { useLocation } from "../../../shared/lib/store/useLocation";

const CARD_W = Math.min(240, Dimensions.get("window").width * 0.72);

type ViewMode = "hire" | "jobs" | "map";

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [viewMode, setViewMode] = useState<ViewMode>("hire");
  const [locSheet, setLocSheet] = useState(false);
  const { current: currentAddr } = useLocation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for header collapse
  scrollY.addListener(({ value }) => setScrolled(value > 40));

  const {
    data: services = [],
    isLoading: loadingServices,
    refetch: refetchServices,
  } = useQuery({ queryKey: ["services", "nearby"], queryFn: () => listServices() });

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({ queryKey: ["tasks", "open"], queryFn: () => listTasks() });

  const qc = useQueryClient();
  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["tasks", "open"] });
    }, [qc]),
  );

  const BASIC_SECTIONS = [
    { key: "cleaning", label: "Cleaning & home", cat: "chores" },
    { key: "garden", label: "Garden & exterior", cat: "gardening" },
    { key: "moving", label: "Moving & transport", cat: "moving" },
    { key: "tutoring", label: "Tutoring & study", cat: "tutoring" },
  ];

  const providerCategorySections = useMemo(() => {
    const byCat = (c: string) => services.filter((s: any) => (s.categories ?? []).includes(c));
    return BASIC_SECTIONS
      .map((s) => ({ key: s.key, title: s.label, data: [byCat(s.cat)] }))
      .filter((section) => section.data[0].length > 0);
  }, [services]);

  const requestSections = useMemo(() => {
    if (!tasks.length) return [];
    const groups: Record<string, typeof tasks> = {};
    tasks.forEach((t: any) => {
      const cat = (t.category ?? "other") as string;
      groups[cat] = groups[cat] ? [...groups[cat], t] : [t];
    });
    return Object.entries(groups).map(([cat, list]) => ({
      title: cat[0].toUpperCase() + cat.slice(1),
      data: [list],
    }));
  }, [tasks]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const addressLabel = currentAddr
    ? `${currentAddr.line1}${currentAddr.city ? `, ${currentAddr.city}` : ""}`
    : "Select location";

  return (
    <SafeAreaView style={h.safe}>
      {/* ===== HEADER ===== */}
      {!scrolled ? (
        /* Expanded header */
        <View style={h.headerExpanded}>
          {/* Location row */}
          <Pressable onPress={() => setLocSheet(true)} style={h.locationRow}>
            <View style={h.locationDot}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={h.locationLabel}>Deliver to</Text>
              <Text style={h.locationAddr} numberOfLines={1}>{addressLabel}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#A1A1AA" />
          </Pressable>

          {/* Segmented control */}
          <View style={h.segmentWrap}>
            <Pressable
              onPress={() => { setViewMode("hire"); refetchServices(); }}
              style={[h.segmentItem, viewMode === "hire" && h.segmentActive]}
            >
              <MaterialCommunityIcons name="hammer-wrench" size={16} color={viewMode === "hire" ? COLORS.red : "#A1A1AA"} />
              <Text style={[h.segmentText, viewMode === "hire" && h.segmentTextActive]}>Hire help</Text>
            </Pressable>
            <Pressable
              onPress={() => { setViewMode("jobs"); refetchTasks(); }}
              style={[h.segmentItem, viewMode === "jobs" && h.segmentActive]}
            >
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={viewMode === "jobs" ? COLORS.red : "#A1A1AA"} />
              <Text style={[h.segmentText, viewMode === "jobs" && h.segmentTextActive]}>Jobs</Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode("map")}
              style={[h.segmentItem, viewMode === "map" && h.segmentActive]}
            >
              <MaterialCommunityIcons name="map-outline" size={16} color={viewMode === "map" ? COLORS.red : "#A1A1AA"} />
              <Text style={[h.segmentText, viewMode === "map" && h.segmentTextActive]}>Map</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Collapsed header */
        <View style={h.headerCollapsed}>
          <Pressable onPress={() => setLocSheet(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.red} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#000" }} numberOfLines={1}>
              {currentAddr?.city ?? "Location"}
            </Text>
          </Pressable>
          <View style={h.miniSegment}>
            <Pressable onPress={() => { setViewMode("hire"); refetchServices(); }} style={[h.miniSegItem, viewMode === "hire" && h.miniSegActive]}>
              <MaterialCommunityIcons name="hammer-wrench" size={14} color={viewMode === "hire" ? COLORS.red : "#A1A1AA"} />
            </Pressable>
            <Pressable onPress={() => { setViewMode("jobs"); refetchTasks(); }} style={[h.miniSegItem, viewMode === "jobs" && h.miniSegActive]}>
              <MaterialCommunityIcons name="briefcase-outline" size={14} color={viewMode === "jobs" ? COLORS.red : "#A1A1AA"} />
            </Pressable>
            <Pressable onPress={() => setViewMode("map")} style={[h.miniSegItem, viewMode === "map" && h.miniSegActive]}>
              <MaterialCommunityIcons name="map-outline" size={14} color={viewMode === "map" ? COLORS.red : "#A1A1AA"} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ===== CONTENT ===== */}
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {viewMode === "map" ? (
          <DiscoverMapView onTaskPress={(id) => nav.navigate("TaskDetail", { taskId: id })} />
        ) : viewMode === "hire" ? (
          loadingServices ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#A1A1AA" }}>Loading…</Text>
            </View>
          ) : (
            <Animated.ScrollView
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={refetchServices} tintColor={COLORS.red} />}
            >
              {/* Hero banner */}
              <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 16, overflow: "hidden", height: 140 }}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop" }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", padding: 16, justifyContent: "flex-end" }}>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", lineHeight: 22 }}>
                    Find trusted help{"\n"}in your neighbourhood
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>
                    Browse services from local helpers
                  </Text>
                </View>
              </View>

              {providerCategorySections.map((section) => (
                <View key={section.key} style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#000", paddingHorizontal: 16, marginBottom: 10 }}>
                    {section.title}
                  </Text>
                  <FlatList
                    data={section.data[0]}
                    keyExtractor={(s: any) => s.id}
                    horizontal
                    renderItem={({ item }) => (
                      <View style={{ width: CARD_W, marginLeft: 16, marginRight: 8 }}>
                        <ServiceCard service={item} onPress={() => nav.navigate("ServiceDetail", { serviceId: item.id })} />
                      </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ))}
            </Animated.ScrollView>
          )
        ) : loadingTasks ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#A1A1AA" }}>Loading…</Text>
          </View>
        ) : (
          <Animated.SectionList
            onScroll={onScroll}
            scrollEventThrottle={16}
            sections={requestSections}
            keyExtractor={(_, index) => `req-section-${index}`}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchTasks} tintColor={COLORS.red} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#000", paddingHorizontal: 16, marginTop: 14, marginBottom: 8 }}>
                {title}
              </Text>
            )}
            renderItem={({ item }) => (
              <FlatList
                data={item}
                keyExtractor={(t: any) => t.id}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item: task }) => (
                  <JobCard task={task} onPress={() => nav.navigate("TaskDetail", { taskId: task.id })} />
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
          />
        )}
      </View>

      <LocationPickerSheet
        visible={locSheet}
        onDismiss={() => setLocSheet(false)}
        onAddAddress={() => setLocSheet(false)}
        onShowAll={() => setLocSheet(false)}
        onShowMap={() => { setLocSheet(false); nav.navigate("FullMap"); }}
      />
    </SafeAreaView>
  );
}

const h = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  // Expanded header
  headerExpanded: { borderBottomWidth: 0.5, borderBottomColor: "#F0F0F0" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  locationDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  locationLabel: { fontSize: 11, fontWeight: "500", color: "#A1A1AA" },
  locationAddr: { fontSize: 14, fontWeight: "700", color: "#000" },

  segmentWrap: { flexDirection: "row", marginHorizontal: 16, marginBottom: 10, backgroundColor: "#F5F5F5", borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10 },
  segmentActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segmentText: { fontSize: 12, fontWeight: "600", color: "#A1A1AA" },
  segmentTextActive: { color: "#000" },

  // Collapsed header
  headerCollapsed: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#F0F0F0" },
  miniSegment: { flexDirection: "row", backgroundColor: "#F5F5F5", borderRadius: 8, padding: 2 },
  miniSegItem: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  miniSegActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
});
