import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { leaveReview } from "../../../shared/lib/api";
import { COLORS } from "../../../shared/lib/constants";
import StarRating from "../../../shared/components/StarRating";

const RATING_LABELS = ["", "Terrible", "Poor", "Okay", "Great", "Amazing"];

export default function ReviewSubmitScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { taskId, revieweeId, revieweeName, taskTitle } = route.params ?? {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await leaveReview({
        taskId,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["reviewStatus", taskId] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      Alert.alert(
        "Review submitted!",
        "Your review will be visible once the other party leaves theirs, or after 48 hours.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSubmitting(false);
  };

  const initial = (revieweeName ?? "U").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Leave a Review</Text>
            <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="close" size={18} color="#6B7280" />
            </Pressable>
          </View>

          {/* User info card */}
          <View style={styles.taskInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{revieweeName ?? "User"}</Text>
              <Text style={styles.taskName} numberOfLines={1}>{taskTitle ?? "Task"}</Text>
            </View>
          </View>

          {/* Stars */}
          <View style={styles.starsSection}>
            <Text style={styles.starsLabel}>How was your experience?</Text>
            <StarRating rating={rating} size={40} onRate={setRating} />
            {rating > 0 && (
              <Text style={styles.ratingText}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          {/* Comment */}
          <Text style={styles.commentLabel}>Add a comment (optional)</Text>
          <TextInput
            style={styles.commentBox}
            placeholder="Tell others about your experience..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, rating === 0 && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            <Text style={styles.submitText}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Text>
          </Pressable>

          {/* Skip */}
          <Pressable style={styles.skipBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  taskName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  starsSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  starsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  commentBox: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontFamily: undefined,
    minHeight: 100,
    color: "#374151",
  },
  submitBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  skipBtn: {
    width: "100%",
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  skipText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
});
