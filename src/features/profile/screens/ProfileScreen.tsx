import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store/useAuth";
import { useQuery } from "@tanstack/react-query";
import { listMyTasks, listMyOffers, fetchReviewsForUser } from "../../../shared/lib/api";
import { useNavigation, useFocusEffect, CommonActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Task, Review } from "../../../shared/types";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { COLORS } from "../../../shared/lib/constants";
import StarRating from "../../../shared/components/StarRating";

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  matched: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#6B7280",
  disputed: "#EF4444",
  pending: "#F59E0B",
  accepted: "#22C55E",
  rejected: "#EF4444",
};

const AVATAR_COLORS = ["#E31B23", "#2563EB", "#16A34A", "#7C3AED", "#D97706"];

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "today";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const nav = useNavigation<any>();

  const { data: myTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: listMyTasks,
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const { data: myOffers = [], refetch: refetchOffers } = useQuery({
    queryKey: ["offers", "mine"],
    queryFn: listMyOffers,
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: () => fetchReviewsForUser(user!.id),
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetchTasks();
      refetchOffers();
      refetchReviews();
    }, [refetchTasks, refetchOffers, refetchReviews]),
  );

  const postedTasks = myTasks.filter((t) => t.requesterId === user?.id);
  const helperTasks = myTasks.filter((t) => t.helperId === user?.id && t.requesterId !== user?.id);
  const helperTaskIds = new Set(helperTasks.map((t) => t.id));
  const filteredOffers = myOffers.filter((o) => !helperTaskIds.has(o.taskId));

  const goToTask = (taskId: string) => {
    nav.dispatch(
      CommonActions.navigate({
        name: "Discover",
        params: { screen: "TaskDetail", params: { taskId } },
      }),
    );
  };

  const initial = (profile?.full_name ?? "U").charAt(0).toUpperCase();
  const memberDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={s.card}>
          <View style={s.headerTop}>
            <View style={s.avatarArea}>
              <View style={[s.avatar, { backgroundColor: COLORS.red }]}>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{profile?.full_name ?? "User"}</Text>
                <View style={s.roleBadge}>
                  <MaterialCommunityIcons name="wrench" size={14} color={COLORS.red} />
                  <Text style={s.roleText}>
                    {profile?.role === "both" ? "Helper & Seeker" : profile?.role ?? "member"}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              style={s.editBtn}
              onPress={() =>
                nav.dispatch(
                  CommonActions.navigate({
                    name: "Discover",
                    params: { screen: "EditProfile" },
                  }),
                )
              }
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#6B7280" />
            </Pressable>
          </View>
          {profile?.bio ? (
            <Text style={s.bio}>{profile.bio}</Text>
          ) : null}
          {memberDate ? (
            <View style={s.memberRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
              <Text style={s.memberText}>Member since {memberDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats Card */}
        <View style={s.statsCard}>
          <View style={s.stat}>
            <StarRating rating={profile?.rating ?? 0} size={14} />
            <Text style={s.statValue}>{profile?.rating?.toFixed(1) ?? "–"}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{profile?.jobs_done ?? 0}</Text>
            <Text style={s.statLabel}>Jobs Done</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{reviews.length}</Text>
            <Text style={s.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Skills Card */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.skillsRow}>
              {profile.skills.map((skill) => (
                <View key={skill} style={s.skillChip}>
                  <Text style={s.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Card */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Reviews</Text>
            {reviews.length > 3 && (
              <Text style={s.seeAll}>See all</Text>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={s.emptyText}>No reviews yet</Text>
          ) : (
            reviews.slice(0, 3).map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))
          )}
        </View>

        {/* My Tasks Card */}
        {postedTasks.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>My Tasks</Text>
            {postedTasks.map((t) => (
              <TaskRow key={t.id} task={t} onPress={() => goToTask(t.id)} />
            ))}
          </View>
        )}

        {/* My Offers Card */}
        {filteredOffers.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>My Offers</Text>
            {filteredOffers.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => goToTask(o.taskId)}
                style={s.taskRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.taskName} numberOfLines={1}>
                    {(o as any).task_title ?? "Task"}
                  </Text>
                  <Text style={s.taskMeta}>
                    €{o.amount} · {(o as any).task_category ?? ""}
                  </Text>
                </View>
                <StatusBadge status={(o as any).status ?? "pending"} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Helping On Card */}
        {helperTasks.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Helping On</Text>
            {helperTasks.map((t) => (
              <TaskRow key={t.id} task={t} onPress={() => goToTask(t.id)} />
            ))}
          </View>
        )}

        {/* Settings Card */}
        <View style={s.card}>
          <SettingsRow
            icon="bell-outline"
            iconBg="#F3F4F6"
            iconColor="#374151"
            label="Notifications"
          />
          <SettingsRow
            icon="help-circle-outline"
            iconBg="#F3F4F6"
            iconColor="#374151"
            label="Help & Support"
          />
          <Pressable style={s.settingsRow} onPress={signOut}>
            <View style={s.settingsLeft}>
              <View style={[s.settingsIcon, { backgroundColor: "#FEF2F2" }]}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.red} />
              </View>
              <Text style={[s.settingsLabel, { color: COLORS.red }]}>Sign Out</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
        <Text style={s.reviewDate}>{timeAgo(review.createdAt)}</Text>
      </View>
      <StarRating rating={review.rating} size={14} />
      {review.comment && (
        <Text style={s.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );
}

function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.taskRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.taskName} numberOfLines={1}>{task.title}</Text>
        <Text style={s.taskMeta}>€{task.budget} · {task.category}</Text>
      </View>
      <StatusBadge status={task.status} />
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6B7280";
  return (
    <View style={[s.statusBadge, { backgroundColor: color + "18" }]}>
      <Text style={[s.statusText, { color }]}>
        {status.replace("_", " ")}
      </Text>
    </View>
  );
}

function SettingsRow({ icon, iconBg, iconColor, label }: { icon: any; iconBg: string; iconColor: string; label: string }) {
  return (
    <Pressable style={s.settingsRow}>
      <View style={s.settingsLeft}>
        <View style={[s.settingsIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={s.settingsLabel}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 8,
  },
  // Header
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatarArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
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
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.red,
    textTransform: "capitalize",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  bio: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginTop: 12 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  memberText: { fontSize: 12, color: "#9CA3AF" },
  // Stats
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
  // Skills
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 14 },
  seeAll: { fontSize: 13, color: COLORS.red, fontWeight: "600", marginBottom: 14 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.red,
    textTransform: "capitalize",
  },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  // Reviews
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
  // Tasks
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  taskName: { fontWeight: "600", color: "#000", fontSize: 14 },
  taskMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  // Settings
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
});
