import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useFocusEffect, CommonActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { listMyServices, deleteService } from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import type { Service } from "../../../shared/types";

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=400&fit=crop",
  gardening: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=400&fit=crop",
  moving: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=400&fit=crop",
  chores: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&fit=crop",
};

export default function MyServicesScreen() {
  const nav = useNavigation<any>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: services = [], refetch } = useQuery({
    queryKey: ["services", "mine"],
    queryFn: listMyServices,
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const totalBookings = services.reduce((sum, s) => sum + s.jobsDone, 0);
  const avgRating = services.length > 0
    ? services.reduce((sum, s) => sum + s.rating, 0) / services.length
    : 0;

  const handleDelete = (id: string) => {
    Alert.alert("Delete Service", "Are you sure you want to remove this service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteService(id);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["services"] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{services.length}</Text>
            <Text style={s.statLabel}>Active Services</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalBookings}</Text>
            <Text style={s.statLabel}>Total Bookings</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{avgRating > 0 ? avgRating.toFixed(1) : "–"}</Text>
            <Text style={s.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Services List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Services</Text>

          {services.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="briefcase-plus-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>No services yet</Text>
              <Text style={s.emptySub}>Create your first service to start earning</Text>
            </View>
          ) : (
            services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() =>
                  nav.navigate("CreateService", { editId: service.id })
                }
                onDelete={() => handleDelete(service.id)}
              />
            ))
          )}
        </View>

        {/* Add New Service Button */}
        <Pressable
          style={s.addBtn}
          onPress={() => nav.navigate("CreateService")}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add New Service</Text>
        </Pressable>

        {/* Earnings Preview */}
        {totalBookings > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Earnings</Text>
            <View style={s.earningsCard}>
              <View style={s.earningsRow}>
                <Text style={s.earningsLabel}>Total bookings</Text>
                <Text style={s.earningsValue}>{totalBookings}</Text>
              </View>
              <View style={s.earningsRow}>
                <Text style={s.earningsLabel}>Average rating</Text>
                <Text style={[s.earningsValue, { color: "#16A34A" }]}>
                  ★ {avgRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imageUrl =
    service.photoUrl ||
    service.categories?.map((c) => FALLBACK_IMAGES[c]).find(Boolean) ||
    FALLBACK_IMAGES.chores;

  return (
    <View style={s.serviceCard}>
      <View style={s.scImgWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={s.scImg}
          contentFit="cover"
          transition={150}
        />
        <View style={[s.scStatus, s.scLive]}>
          <Text style={s.scStatusText}>● Live</Text>
        </View>
      </View>
      <View style={s.scBody}>
        <Text style={s.scTitle} numberOfLines={1}>{service.title}</Text>
        <View style={s.scCats}>
          {service.categories.slice(0, 3).map((c) => (
            <View key={c} style={[s.scCat, { backgroundColor: (CATEGORY_COLORS[c] ?? "#6B7280") + "18" }]}>
              <Text style={[s.scCatText, { color: CATEGORY_COLORS[c] ?? "#6B7280" }]}>{c}</Text>
            </View>
          ))}
        </View>
        <View style={s.scMeta}>
          <Text style={s.scPrice}>From €{service.priceFrom}</Text>
          <Text style={s.scStats}>★ {service.rating.toFixed(1)} · {service.jobsDone} bookings</Text>
        </View>
        <View style={s.scActions}>
          <Pressable style={[s.scAction, s.scEditBtn]} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil" size={14} color="#374151" />
            <Text style={s.scEditText}>Edit</Text>
          </Pressable>
          <Pressable style={[s.scAction, s.scDeleteBtn]} onPress={onDelete}>
            <MaterialCommunityIcons name="delete-outline" size={14} color="#EF4444" />
            <Text style={s.scDeleteText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  statNum: { fontSize: 22, fontWeight: "800", color: "#000" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  // Section
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 14 },
  // Empty
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  emptySub: { fontSize: 13, color: "#9CA3AF" },
  // Service Card
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  scImgWrap: { height: 120, position: "relative" },
  scImg: { width: "100%", height: "100%" },
  scStatus: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scLive: { backgroundColor: "#DCFCE7" },
  scStatusText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  scBody: { padding: 14 },
  scTitle: { fontSize: 15, fontWeight: "700", color: "#000" },
  scCats: { flexDirection: "row", gap: 6, marginTop: 6 },
  scCat: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  scCatText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  scMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  scPrice: { fontSize: 14, fontWeight: "700", color: "#000" },
  scStats: { fontSize: 12, color: "#9CA3AF" },
  scActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  scAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  scEditBtn: { backgroundColor: "#F3F4F6" },
  scEditText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  scDeleteBtn: { backgroundColor: "#FEF2F2" },
  scDeleteText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },
  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.red,
    borderRadius: 14,
    marginHorizontal: 20,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Earnings
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  earningsLabel: { fontSize: 13, color: "#6B7280" },
  earningsValue: { fontSize: 15, fontWeight: "700", color: "#000" },
});
