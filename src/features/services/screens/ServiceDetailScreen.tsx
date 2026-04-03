import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getService, getPublicProfile, fetchReviewsForUser } from "../../../shared/lib/api";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import StarRating from "../../../shared/components/StarRating";
import type { Review } from "../../../shared/types";

const AVATAR_COLORS = ["#E31B23", "#2563EB", "#16A34A", "#7C3AED", "#D97706"];

type RouteParams = { serviceId: string };

export default function ServiceDetailScreen() {
  const route = useRoute();
  const nav = useNavigation<any>();
  const { serviceId } = (route.params ?? {}) as RouteParams;

  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });

  const { data: provider } = useQuery({
    queryKey: ["publicProfile", service?.providerId],
    queryFn: () => getPublicProfile(service!.providerId),
    enabled: !!service?.providerId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", service?.providerId],
    queryFn: () => fetchReviewsForUser(service!.providerId),
    enabled: !!service?.providerId,
  });

  if (!service) return null;

  const hero = service.photoUrl || "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&fit=crop";
  const lat = Number(service.lat);
  const lng = Number(service.lng);
  const initial = (provider?.name ?? "U").charAt(0).toUpperCase();
  const avatarColor = AVATAR_COLORS[(provider?.name ?? "U").charCodeAt(0) % AVATAR_COLORS.length];

  const goToProfile = () => {
    if (!service.providerId) return;
    nav.navigate("PublicProfile", { userId: service.providerId });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}>
      {/* Hero Image */}
      <View style={s.heroWrap}>
        <Image
          source={{ uri: hero }}
          style={s.heroImg}
          contentFit="cover"
          transition={150}
        />
      </View>

      <View style={s.content}>
        {/* Title + Categories */}
        <Text style={s.title}>{service.title}</Text>
        <View style={s.catsRow}>
          {service.categories?.map((c: string) => (
            <View key={c} style={[s.catBadge, { backgroundColor: (CATEGORY_COLORS[c] ?? "#6B7280") + "18" }]}>
              <Text style={[s.catBadgeText, { color: CATEGORY_COLORS[c] ?? "#6B7280" }]}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <Text style={s.price}>
            From <Text style={s.priceBold}>€{Number(service.priceFrom ?? 0)}</Text>
          </Text>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <StarRating rating={service.rating} size={14} />
            <Text style={s.statText}>{Number(service.rating ?? 0).toFixed(1)}</Text>
          </View>
          <View style={s.statDivider} />
          <Text style={s.statText}>{service.jobsDone ?? 0} jobs</Text>
        </View>

        {/* Provider Card */}
        {provider && (
          <Pressable style={s.providerCard} onPress={goToProfile}>
            <View style={[s.providerAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.providerAvatarText}>{initial}</Text>
            </View>
            <View style={s.providerInfo}>
              <Text style={s.providerName}>{provider.name}</Text>
              <Text style={s.providerMeta}>
                {provider.role} · {provider.jobsDone} jobs · ★ {provider.rating.toFixed(1)}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
          </Pressable>
        )}

        {/* Map */}
        {Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && (
          <View style={s.mapWrap}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={{ latitude: lat, longitude: lng }} />
            </MapView>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={s.reviewsSection}>
            <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.slice(0, 3).map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
            {reviews.length > 3 && (
              <Pressable onPress={goToProfile}>
                <Text style={s.seeAllLink}>See all reviews</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Hire Button */}
        <Pressable style={s.hireBtn} onPress={() => nav.navigate("BookService", { serviceId: service.id })}>
          <Text style={s.hireBtnText}>Request Booking</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const initial = (review.reviewerName ?? "U").charAt(0).toUpperCase();
  const colorIdx = review.fromUserId.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <View style={s.reviewItem}>
      <View style={s.reviewHeader}>
        <View style={s.reviewerInfo}>
          <View style={[s.reviewerAvatar, { backgroundColor: AVATAR_COLORS[colorIdx] }]}>
            <Text style={s.reviewerAvatarText}>{initial}</Text>
          </View>
          <Text style={s.reviewerName}>{review.reviewerName ?? "User"}</Text>
        </View>
        <StarRating rating={review.rating} size={12} />
      </View>
      {review.comment && <Text style={s.reviewComment}>{review.comment}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heroWrap: { height: 240, backgroundColor: "#F3F4F6" },
  heroImg: { width: "100%", height: "100%" },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#000" },
  catsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  catBadgeText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  price: { fontSize: 15, color: "#000" },
  priceBold: { fontWeight: "800", fontSize: 18 },
  statDivider: { width: 1, height: 20, backgroundColor: "#E5E7EB" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  // Provider
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  providerAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: "700", color: "#000" },
  providerMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2, textTransform: "capitalize" },
  // Map
  mapWrap: { height: 150, borderRadius: 16, overflow: "hidden" },
  // Reviews
  reviewsSection: { gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 8 },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  reviewerName: { fontSize: 13, fontWeight: "600", color: "#000" },
  reviewComment: { fontSize: 13, color: "#4B5563", lineHeight: 18 },
  seeAllLink: { fontSize: 13, color: COLORS.red, fontWeight: "600", paddingVertical: 8 },
  // Hire
  hireBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  hireBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
