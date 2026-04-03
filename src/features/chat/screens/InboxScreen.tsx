import React, { useCallback } from "react";
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
import { listConversations } from "../../../shared/lib/api";
import type { Conversation } from "../../../shared/lib/api";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";

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

  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handlePress = useCallback(
    (conv: Conversation) => {
      navigation.navigate("Discover", {
        screen: "ChatScreen",
        params: { taskId: conv.taskId, otherName: conv.otherUserName },
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => {
      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
      const catColor =
        CATEGORY_COLORS[item.taskCategory] ?? CATEGORY_COLORS.other;

      return (
        <Pressable
          style={styles.row}
          onPress={() => handlePress(item)}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {item.otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={styles.name} numberOfLines={1}>
                {item.otherUserName}
              </Text>
              <Text style={styles.time}>
                {timeAgo(item.lastMessageAt)}
              </Text>
            </View>

            {item.lastMessage && (
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            )}

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
        </Pressable>
      );
    },
    [handlePress],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Inbox</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      ) : conversations.length === 0 ? (
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
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.taskId}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + 20,
          }}
          showsVerticalScrollIndicator={false}
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
});
