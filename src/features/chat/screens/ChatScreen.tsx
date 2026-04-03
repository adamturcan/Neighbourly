import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { listMessages, sendMessage, getTask } from "../../../shared/lib/api";
import type { Message } from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import { supabase } from "../../../shared/lib/supabase";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";

const CATEGORY_ICONS: Record<string, string> = {
  cleaning: "broom",
  chores: "broom",
  gardening: "flower-outline",
  moving: "truck-outline",
  tutoring: "school-outline",
  plumbing: "pipe-wrench",
  electrical: "flash-outline",
  painting: "format-paint",
  car: "car-outline",
};

const AVATAR_COLORS = [
  "#E31B23",
  "#2563EB",
  "#16A34A",
  "#7C3AED",
  "#D97706",
  "#0891B2",
  "#EA580C",
];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { taskId, otherName } = route.params as {
    taskId: string;
    otherName: string;
  };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["messages", taskId],
    queryFn: () => listMessages(taskId),
    enabled: !!taskId,
  });

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`messages-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, refetch]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await sendMessage(taskId, trimmed);
      setText("");
      refetch();
    } catch (e) {
      // silently fail
    }
    setSending(false);
  }, [text, sending, taskId, refetch]);

  const avatarColor =
    AVATAR_COLORS[
      otherName.charCodeAt(0) % AVATAR_COLORS.length
    ];

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.senderId === user?.id;
      return (
        <View
          style={[
            styles.messageBubbleWrap,
            isMine ? styles.messageBubbleWrapRight : styles.messageBubbleWrapLeft,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
          </View>
          <Text
            style={[
              styles.timestamp,
              isMine ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      );
    },
    [user?.id],
  );

  const categoryColor =
    CATEGORY_COLORS[task?.category ?? ""] ?? CATEGORY_COLORS.other;
  const categoryIcon =
    CATEGORY_ICONS[task?.category ?? ""] ?? "help-circle-outline";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>
            {otherName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      {/* Task context banner */}
      {task && (
        <View style={styles.taskBanner}>
          <View
            style={[styles.taskIconBox, { backgroundColor: categoryColor }]}
          >
            <MaterialCommunityIcons
              name={categoryIcon as any}
              size={16}
              color="#fff"
            />
          </View>
          <View style={styles.taskBannerInfo}>
            <Text style={styles.taskBannerTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.taskBannerMeta}>
              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}{" "}
              · {task.budget ? `\u20AC${task.budget}` : "TBD"} ·{" "}
              {task.status.replace("_", " ")}
            </Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView edges={["bottom"]} style={styles.inputBarSafe}>
          <View style={styles.inputBar}>
            <Pressable style={styles.attachBtn}>
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={[
                styles.sendBtn,
                (!text.trim() || sending) && styles.sendBtnDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  headerStatus: {
    fontSize: 12,
    color: "#22C55E",
    marginTop: 1,
  },
  taskBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  taskIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  taskBannerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  taskBannerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  taskBannerMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleWrap: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  messageBubbleWrapLeft: {
    alignSelf: "flex-start",
  },
  messageBubbleWrapRight: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: COLORS.red,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: "#fff",
  },
  messageTextOther: {
    color: "#000",
  },
  timestamp: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  timestampLeft: {
    textAlign: "left",
  },
  timestampRight: {
    textAlign: "right",
  },
  inputBarSafe: {
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    backgroundColor: "#fff",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 14,
    maxHeight: 100,
    color: "#000",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
