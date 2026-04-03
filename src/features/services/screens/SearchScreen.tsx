import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, CommonActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { listServices, listTasks } from "../../../shared/lib/api";
import { useDebounced } from "../../../shared/hooks/useDebounced";
import { ORIGIN, COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { km } from "../../../shared/lib/geo";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import type { Service, Task } from "../../../shared/types";

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning", icon: "broom" as const, color: "#E31B23" },
  { key: "gardening", label: "Garden", icon: "flower-outline" as const, color: "#16A34A" },
  { key: "moving", label: "Moving", icon: "truck-outline" as const, color: "#2563EB" },
  { key: "chores", label: "Handyman", icon: "wrench" as const, color: "#D97706" },
  { key: "tutoring", label: "Tutoring", icon: "school-outline" as const, color: "#7C3AED" },
  { key: "plumbing", label: "Plumbing", icon: "pipe-wrench" as const, color: "#0891B2" },
  { key: "painting", label: "Painting", icon: "format-paint" as const, color: "#EA580C" },
  { key: "electrical", label: "Electrical", icon: "flash-outline" as const, color: "#4B5563" },
];

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=400&fit=crop",
  chores: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&fit=crop",
  gardening: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=400&fit=crop",
  moving: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=400&fit=crop",
  tutoring: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=400&fit=crop",
  plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=400&fit=crop",
  electrical: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400&fit=crop",
  painting: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?q=80&w=400&fit=crop",
};

export default function SearchScreen() {
  const nav = useNavigation<any>();
  const [q, setQ] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const qd = useDebounced(q, 300);

  const isSearching = qd.trim().length > 0 || selectedCat !== null;

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services", "nearby"],
    queryFn: () => listServices({ near: ORIGIN }),
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "open"],
    queryFn: () => listTasks(),
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  // Filter results
  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCat ? s.categories.includes(selectedCat) : true;
    const matchesQ = qd.trim()
      ? s.title.toLowerCase().includes(qd.toLowerCase()) ||
        s.categories.some((c) => c.toLowerCase().includes(qd.toLowerCase()))
      : true;
    return matchesCat && matchesQ;
  });

  const handleSearch = useCallback((text: string) => {
    setQ(text);
    if (selectedCat) setSelectedCat(null);
  }, [selectedCat]);

  const handleCategoryPress = useCallback((cat: string) => {
    setSelectedCat((prev) => (prev === cat ? null : cat));
    setQ("");
  }, []);

  const handleRecentPress = useCallback((term: string) => {
    setQ(term);
  }, []);

  const clearRecents = useCallback(() => setRecentSearches([]), []);

  const handleSubmit = useCallback(() => {
    const trimmed = q.trim();
    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches((prev) => [trimmed, ...prev].slice(0, 5));
    }
  }, [q, recentSearches]);

  const goToTask = (taskId: string) => {
    nav.dispatch(
      CommonActions.navigate({
        name: "Discover",
        params: { screen: "TaskDetail", params: { taskId } },
      }),
    );
  };

  // Popular = top rated services
  const popular = [...services]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Search</Text>
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={s.searchInput}
            placeholder="Search services, tasks, helpers…"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(""); setSelectedCat(null); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isSearching ? (
        /* Search Results */
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceResult service={item} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            selectedCat ? (
              <View style={s.activeFilterRow}>
                <View style={[s.activeFilter, { backgroundColor: (CATEGORY_COLORS[selectedCat] ?? "#6B7280") + "18" }]}>
                  <Text style={[s.activeFilterText, { color: CATEGORY_COLORS[selectedCat] ?? "#6B7280" }]}>
                    {CATEGORIES.find((c) => c.key === selectedCat)?.label ?? selectedCat}
                  </Text>
                  <Pressable onPress={() => setSelectedCat(null)}>
                    <MaterialCommunityIcons name="close" size={14} color={CATEGORY_COLORS[selectedCat] ?? "#6B7280"} />
                  </Pressable>
                </View>
                <Text style={s.resultCount}>{filteredServices.length} results</Text>
              </View>
            ) : (
              <Text style={s.resultCount}>{filteredServices.length} results</Text>
            )
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="magnify" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>No results found</Text>
              <Text style={s.emptySub}>Try a different search or category</Text>
            </View>
          }
        />
      ) : (
        /* Explore State */
        <ScrollView
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={clearRecents}>
                  <Text style={s.sectionLink}>Clear</Text>
                </Pressable>
              </View>
              {recentSearches.map((term, i) => (
                <Pressable key={i} style={s.recentRow} onPress={() => handleRecentPress(term)}>
                  <View style={s.recentIcon}>
                    <MaterialCommunityIcons name="history" size={20} color="#6B7280" />
                  </View>
                  <Text style={s.recentText}>{term}</Text>
                  <MaterialCommunityIcons name="arrow-top-left" size={18} color="#D1D5DB" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Browse Categories */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Browse Categories</Text>
            </View>
            <View style={s.catGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat.key} style={s.catItem} onPress={() => handleCategoryPress(cat.key)}>
                  <View style={[s.catIcon, { backgroundColor: cat.color }]}>
                    <MaterialCommunityIcons name={cat.icon} size={24} color="#fff" />
                  </View>
                  <Text style={s.catLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Popular Near You */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Popular Near You</Text>
            </View>
            {popular.map((service) => (
              <PopularCard key={service.id} service={service} />
            ))}
          </View>

          {/* Open Tasks */}
          {tasks.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Open Tasks Nearby</Text>
              </View>
              {tasks.slice(0, 3).map((task) => (
                <Pressable key={task.id} style={s.taskRow} onPress={() => goToTask(task.id)}>
                  <View style={[s.taskCatDot, { backgroundColor: CATEGORY_COLORS[task.category] ?? "#6B7280" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={s.taskMeta}>{task.category} · €{task.budget}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ServiceResult({ service }: { service: Service }) {
  const distance = km(ORIGIN, { lat: service.lat, lng: service.lng });
  const imageUrl =
    service.photoUrl ||
    service.categories?.map((c) => FALLBACK_IMAGES[c]).find(Boolean) ||
    FALLBACK_IMAGES.chores;

  return (
    <View style={s.resultCard}>
      <Image
        source={{ uri: imageUrl }}
        style={s.resultImg}
        contentFit="cover"
        transition={150}
      />
      <View style={s.resultInfo}>
        <Text style={s.resultTitle} numberOfLines={2}>{service.title}</Text>
        <View style={s.resultCats}>
          {service.categories.slice(0, 2).map((c) => (
            <View key={c} style={[s.resultCat, { backgroundColor: (CATEGORY_COLORS[c] ?? "#6B7280") + "18" }]}>
              <Text style={[s.resultCatText, { color: CATEGORY_COLORS[c] ?? "#6B7280" }]}>{c}</Text>
            </View>
          ))}
        </View>
        <Text style={s.resultMeta}>
          ★ {service.rating.toFixed(1)} · {service.jobsDone} jobs · {distance.toFixed(1)} km
        </Text>
        <Text style={s.resultPrice}>From €{service.priceFrom}</Text>
      </View>
    </View>
  );
}

function PopularCard({ service }: { service: Service }) {
  const distance = km(ORIGIN, { lat: service.lat, lng: service.lng });
  const imageUrl =
    service.photoUrl ||
    service.categories?.map((c) => FALLBACK_IMAGES[c]).find(Boolean) ||
    FALLBACK_IMAGES.chores;

  return (
    <View style={s.popularCard}>
      <Image
        source={{ uri: imageUrl }}
        style={s.popularImg}
        contentFit="cover"
        transition={150}
      />
      <View style={s.popularInfo}>
        <Text style={s.popularTitle} numberOfLines={1}>{service.title}</Text>
        <Text style={s.popularSub} numberOfLines={1}>
          {service.categories.join(", ")}
        </Text>
        <View style={s.popularBottom}>
          <Text style={s.popularPrice}>From €{service.priceFrom}</Text>
          <Text style={s.popularRating}>★ {service.rating.toFixed(1)} · {distance.toFixed(1)} km</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#000", marginBottom: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
  },
  // Sections
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  sectionLink: { fontSize: 13, color: COLORS.red, fontWeight: "600" },
  // Recents
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  recentText: { flex: 1, fontSize: 14, color: "#374151" },
  // Category grid
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  catItem: {
    width: "22%",
    alignItems: "center",
    gap: 8,
  },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
  // Popular
  popularCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 10,
  },
  popularImg: { width: 64, height: 64, borderRadius: 12 },
  popularInfo: { flex: 1, justifyContent: "center" },
  popularTitle: { fontSize: 14, fontWeight: "700", color: "#000" },
  popularSub: { fontSize: 12, color: "#6B7280", marginTop: 2, textTransform: "capitalize" },
  popularBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  popularPrice: { fontSize: 13, fontWeight: "700", color: "#000" },
  popularRating: { fontSize: 12, color: "#9CA3AF" },
  // Tasks
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  taskCatDot: { width: 10, height: 10, borderRadius: 5 },
  taskTitle: { fontSize: 14, fontWeight: "600", color: "#000" },
  taskMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2, textTransform: "capitalize" },
  // Search results
  resultCount: { fontSize: 13, color: "#9CA3AF", paddingVertical: 12 },
  activeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeFilterText: { fontSize: 13, fontWeight: "600" },
  resultCard: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultImg: { width: 80, height: 80, borderRadius: 14 },
  resultInfo: { flex: 1, justifyContent: "center" },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#000" },
  resultCats: { flexDirection: "row", gap: 6, marginTop: 4 },
  resultCat: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  resultCatText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  resultMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  resultPrice: { fontSize: 14, fontWeight: "700", color: "#000", marginTop: 4 },
  // Empty
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  emptySub: { fontSize: 13, color: "#9CA3AF" },
});
