import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { listConversations, listTasks } from "../../../shared/lib/api";
import type { Conversation } from "../../../shared/lib/api";
import type { Task } from "../../../shared/types";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { useAuth } from "../../auth/store/useAuth";
import { supabase } from "../../../shared/lib/supabase";
import { onTyping } from "../../../shared/lib/typingService";

const AVATAR_COLORS = [
  "#E31B23",
  "#2563EB",
  "#16A34A",
  "#7C3AED",
  "#D97706",
  "#0891B2",
  "#EA580C",
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

export default function InboxScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [typingTasks, setTypingTasks] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  // Fetch open tasks (booking requests + user's own pending tasks)
  const { data: openTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", "open"],
    queryFn: listTasks,
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  // Booking requests others sent (tasks starting with "Booking:" where user has matching skills)
  const mySkills = new Set(user ? [] : []); // We'll show all booking requests for now
  const bookingRequests = openTasks.filter(
    (t) => t.title.startsWith("Booking:") && t.requesterId !== user?.id,
  );

  // User's own pending tasks waiting for offers
  const myPendingTasks = openTasks.filter(
    (t) => t.requesterId === user?.id && t.status === "open",
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchTasks();
    }, [refetch, refetchTasks]),
  );

  // Typing indicators via shared service
  useEffect(() => {
    if (!user) return;
    const taskIds = new Set(conversations.map((c) => c.taskId));
    const unsub = onTyping((tId, uId) => {
      if (uId !== user.id && taskIds.has(tId)) {
        setTypingTasks((prev) => new Set(prev).add(tId));
        const existing = typingTimeouts.current.get(tId);
        if (existing) clearTimeout(existing);
        typingTimeouts.current.set(
          tId,
          setTimeout(() => {
            setTypingTasks((prev) => {
              const next = new Set(prev);
              next.delete(tId);
              return next;
            });
          }, 3000),
        );
      }
    });
    return () => { unsub(); typingTimeouts.current.forEach((t) => clearTimeout(t)); };
  }, [conversations.length, user]);

  // Listen for new messages
  useEffect(() => {
    if (!conversations.length) return;
    const channels: any[] = [];
    conversations.forEach((conv) => {
      const msgCh = supabase
        .channel(`inbox-msg-${conv.taskId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `task_id=eq.${conv.taskId}` },
          () => {
            const existing = typingTimeouts.current.get(conv.taskId);
            if (existing) clearTimeout(existing);
            setTypingTasks((prev) => {
              const next = new Set(prev);
              next.delete(conv.taskId);
              return next;
            });
            refetch();
          },
        )
        .subscribe();
      channels.push(msgCh);
    });
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [conversations.length, user, refetch]);

  const handlePress = useCallback(
    (conv: Conversation) => {
      navigation.navigate("Discover", {
        screen: "ChatScreen",
        params: { taskId: conv.taskId, otherName: conv.otherUserName, fromInbox: true },
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => {
      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
      const catColor =
        CATEGORY_COLORS[item.taskCategory] ?? CATEGORY_COLORS.other;
      const fromOther = item.lastMessageSenderId != null && item.lastMessageSenderId !== user?.id;
      const isUnread = fromOther && (
        !item.myLastReadAt
        || !item.lastMessageAt
        || new Date(item.lastMessageAt).getTime() > new Date(item.myLastReadAt).getTime()
      );
      const isTyping = typingTasks.has(item.taskId);

      return (
        <Pressable
          style={[styles.row, isUnread && styles.rowUnread]}
          onPress={() => handlePress(item)}
        >
          {/* Avatar */}
          <View style={{ position: "relative" }}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>
                {item.otherUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isTyping && (
              <View style={styles.onlineDot} />
            )}
          </View>

          {/* Content */}
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                {item.otherUserName}
              </Text>
              <Text style={[styles.time, isUnread && { color: COLORS.red }]}>
                {timeAgo(item.lastMessageAt)}
              </Text>
            </View>

            {isTyping ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <View style={styles.typingDotsRow}>
                  <View style={styles.tDot} />
                  <View style={styles.tDot} />
                  <View style={styles.tDot} />
                </View>
                <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "500" }}>typing…</Text>
              </View>
            ) : item.lastMessage ? (
              <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
                {item.lastMessageSenderId === user?.id ? `You: ${item.lastMessage}` : item.lastMessage}
              </Text>
            ) : null}

            <View style={styles.rowBottom}>
              <View
                style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}
              >
                <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                  {item.taskCategory}
                </Text>
              </View>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {item.taskTitle}
              </Text>
            </View>
          </View>

          {/* Unread badge */}
          {isUnread && (
            <View style={styles.unreadBadge}>
              <View style={styles.unreadDot} />
            </View>
          )}
        </Pressable>
      );
    },
    [handlePress, user?.id, typingTasks],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Inbox</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      ) : conversations.filter((c) => c.taskStatus !== "completed").length === 0 && bookingRequests.length === 0 && myPendingTasks.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="chat-outline"
            size={48}
            color="#D1D5DB"
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Accept or receive an offer to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations.filter((c) => c.taskStatus !== "completed")}
          renderItem={renderItem}
          keyExtractor={(item) => item.taskId}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + 20,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Booking Requests */}
              {bookingRequests.length > 0 && (
                <View style={styles.requestSection}>
                  <Text style={styles.requestSectionTitle}>
                    Booking Requests ({bookingRequests.length})
                  </Text>
                  {bookingRequests.map((t) => (
                    <Pressable
                      key={t.id}
                      style={styles.requestRow}
                      onPress={() => navigation.navigate("Discover", {
                        screen: "TaskDetail",
                        params: { taskId: t.id },
                      })}
                    >
                      <View style={styles.requestIcon}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.red} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestTitle} numberOfLines={1}>
                          {t.title.replace("Booking: ", "")}
                        </Text>
                        <Text style={styles.requestMeta}>
                          €{t.budget} · {t.category} · {t.when ? new Date(t.when).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "ASAP"}
                        </Text>
                      </View>
                      <View style={styles.requestBadge}>
                        <Text style={styles.requestBadgeText}>View</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* My Pending Tasks */}
              {myPendingTasks.length > 0 && (
                <View style={styles.requestSection}>
                  <Text style={styles.requestSectionTitle}>
                    Awaiting Offers ({myPendingTasks.length})
                  </Text>
                  {myPendingTasks.map((t) => (
                    <Pressable
                      key={t.id}
                      style={styles.requestRow}
                      onPress={() => navigation.navigate("Discover", {
                        screen: "TaskDetail",
                        params: { taskId: t.id },
                      })}
                    >
                      <View style={[styles.requestIcon, { backgroundColor: "#FEF3C7" }]}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestTitle} numberOfLines={1}>{t.title}</Text>
                        <Text style={styles.requestMeta}>€{t.budget} · {t.category} · waiting for helpers</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Conversations header */}
              {conversations.length > 0 && (bookingRequests.length > 0 || myPendingTasks.length > 0) && (
                <Text style={[styles.requestSectionTitle, { paddingHorizontal: 20, paddingTop: 16 }]}>
                  Messages
                </Text>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
    gap: 3,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  preview: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  taskTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
  },
  // Unread styles
  rowUnread: {
    backgroundColor: "#FEF2F2",
  },
  nameUnread: {
    fontWeight: "800",
  },
  previewUnread: {
    color: "#000",
    fontWeight: "600",
  },
  unreadBadge: {
    marginLeft: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  typingDotsRow: {
    flexDirection: "row",
    gap: 2,
  },
  tDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
  },
  // Request sections
  requestSection: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  requestSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  requestMeta: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    textTransform: "capitalize",
  },
  requestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.red,
  },
  requestBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
