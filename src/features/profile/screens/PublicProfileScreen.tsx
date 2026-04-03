import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getPublicProfile, fetchReviewsForUser } from "../../../shared/lib/api";
import { COLORS } from "../../../shared/lib/constants";
import StarRating from "../../../shared/components/StarRating";
import type { Review } from "../../../shared/types";

const AVATAR_COLORS = ["#E31B23", "#2563EB", "#16A34A", "#7C3AED", "#D97706"];

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "today";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function PublicProfileScreen() {
  const route = useRoute<any>();
  const userId = route.params?.userId as string;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => getPublicProfile(userId),
    enabled: !!userId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", userId],
    queryFn: () => fetchReviewsForUser(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.red} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Profile not found</Text>
      </View>
    );
  }

  const initial = profile.name.charAt(0).toUpperCase();
  const memberDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarArea}>
            <View style={[styles.avatar, { backgroundColor: COLORS.red }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile.name}</Text>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons name="wrench" size={14} color={COLORS.red} />
                <Text style={styles.roleText}>{profile.role}</Text>
              </View>
            </View>
          </View>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <View style={styles.memberRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
            <Text style={styles.memberText}>Member since {memberDate}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <StarRating rating={profile.rating} size={14} />
            <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.jobsDone}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Skills */}
        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {profile.skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet</Text>
          ) : (
            reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const initial = (review.reviewerName ?? "U").charAt(0).toUpperCase();
  const colorIdx = review.fromUserId.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={[styles.reviewerAvatar, { backgroundColor: AVATAR_COLORS[colorIdx] }]}>
            <Text style={styles.reviewerAvatarText}>{initial}</Text>
          </View>
          <Text style={styles.reviewerName}>{review.reviewerName ?? "User"}</Text>
        </View>
        <Text style={styles.reviewDate}>{timeAgo(review.createdAt)}</Text>
      </View>
      <StarRating rating={review.rating} size={14} />
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
      {review.taskTitle && (
        <View style={styles.reviewTaskRow}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={12} color="#9CA3AF" />
          <Text style={styles.reviewTaskText}>{review.taskTitle}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 40 },
  headerCard: {
    backgroundColor: "#fff",
    padding: 24,
    marginBottom: 8,
  },
  avatarArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: "#000" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: COLORS.red, textTransform: "capitalize" },
  bio: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginTop: 12 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  memberText: { fontSize: 12, color: "#9CA3AF" },
  statsCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#000" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 14 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: { fontSize: 13, fontWeight: "600", color: COLORS.red, textTransform: "capitalize" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  reviewItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerAvatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  reviewerName: { fontSize: 14, fontWeight: "600", color: "#000" },
  reviewDate: { fontSize: 12, color: "#9CA3AF" },
  reviewComment: { fontSize: 13, color: "#4B5563", lineHeight: 20 },
  reviewTaskRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  reviewTaskText: { fontSize: 11, color: "#9CA3AF" },
});
