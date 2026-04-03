import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getTask, completeTask, leaveReview } from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import { COLORS } from "../../../shared/lib/constants";
import { supabase } from "../../../shared/lib/supabase";
import StarRating from "../../../shared/components/StarRating";

export default function TaskCompletionScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const taskId = route.params?.taskId as string;

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });

  const [step, setStep] = useState<"confirm" | "review" | "done">("confirm");
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get other party name
  const { data: otherParty } = useQuery({
    queryKey: ["otherParty", taskId],
    queryFn: async () => {
      if (!task) return null;
      const otherId = task.requesterId === user?.id ? task.helperId : task.requesterId;
      if (!otherId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("id", otherId)
        .single();
      return data ? { id: data.id, name: data.full_name ?? data.username ?? "User" } : null;
    },
    enabled: !!task,
  });

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      if (task?.status !== "completed") {
        await completeTask(taskId);
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setStep("review");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setConfirming(false);
  };

  const handleReview = async () => {
    if (rating === 0 || !otherParty) {
      setStep("done");
      return;
    }
    setSubmittingReview(true);
    try {
      await leaveReview({
        taskId,
        revieweeId: otherParty.id,
        rating,
        comment: comment.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    } catch (e) {
      // Might already have reviewed
    }
    setSubmittingReview(false);
    setStep("done");
  };

  if (!task) return null;

  const otherName = otherParty?.name ?? "User";

  if (step === "done") {
    return (
      <SafeAreaView style={s.container} edges={["top", "bottom"]}>
        <View style={s.centerScreen}>
          <View style={[s.bigIcon, { backgroundColor: COLORS.red }]}>
            <MaterialCommunityIcons name="party-popper" size={36} color="#fff" />
          </View>
          <Text style={s.doneTitle}>All Done!</Text>
          <Text style={s.doneSub}>Payment confirmed · Task completed</Text>

          <View style={s.summaryCard}>
            <SummaryRow icon="clipboard-check-outline" label="Task" value={task.title} />
            <SummaryRow icon="account" label="Helper" value={otherName} />
            <SummaryRow icon="cash" label="Paid" value={`€${task.budget} (cash)`} valueColor="#16A34A" />
          </View>

          <Pressable style={s.redBtn} onPress={() => nav.goBack()}>
            <Text style={s.redBtnText}>Back to Task</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "review") {
    return (
      <SafeAreaView style={s.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.topBar}>
            <View style={{ width: 24 }} />
            <Text style={s.topTitle}>Rate & Review</Text>
            <Pressable onPress={() => setStep("done")}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <View style={s.centerContent}>
            <View style={[s.bigIcon, { backgroundColor: "#DCFCE7" }]}>
              <MaterialCommunityIcons name="check-circle" size={36} color="#16A34A" />
            </View>
            <Text style={s.reviewTitle}>How was {otherName}?</Text>
            <Text style={s.reviewSub}>{task.title}</Text>

            <View style={{ marginVertical: 20 }}>
              <StarRating rating={rating} size={42} onRate={setRating} />
            </View>

            <View style={s.commentWrap}>
              <Text style={s.commentPlaceholder}>
                {comment ? "" : "Add a comment (optional)"}
              </Text>
              <View style={s.commentInput}>
                <Text style={{ fontSize: 14, color: "#000" }} numberOfLines={0}>
                  {comment}
                </Text>
              </View>
              {/* Using a real TextInput below the visual one */}
            </View>
          </View>

          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="comment-text-outline" size={18} color="#9CA3AF" />
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Comment</Text>
              <View style={s.realInput}>
                <Text style={{ fontSize: 14, color: comment ? "#000" : "#9CA3AF" }}>
                  {comment || "Write something..."}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[s.redBtn, { marginHorizontal: 20, marginBottom: 12 }]}
            onPress={handleReview}
            disabled={submittingReview}
          >
            <Text style={s.redBtnText}>
              {submittingReview ? "Submitting..." : rating > 0 ? "Submit Review" : "Skip Review"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Confirm step
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topBar}>
          <Pressable onPress={() => nav.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </Pressable>
          <Text style={s.topTitle}>Complete Task</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View style={[s.bigIcon, { backgroundColor: "#DCFCE7" }]}>
            <MaterialCommunityIcons name="check-circle" size={36} color="#16A34A" />
          </View>
          <Text style={s.confirmTitle}>Ready to finish?</Text>
          <Text style={s.confirmSub}>{task.title}</Text>
        </View>

        {/* Payment Summary */}
        <View style={s.paymentCard}>
          <View style={s.paymentHeader}>
            <MaterialCommunityIcons name="receipt-text-outline" size={22} color={COLORS.red} />
            <Text style={s.paymentTitle}>Payment Summary</Text>
          </View>
          <View style={s.paymentBody}>
            <PayRow label="Service" value={task.title} />
            <PayRow label="Agreed amount" value={`€${task.budget}`} />
            <View style={s.payTotal}>
              <Text style={s.payTotalLabel}>Total</Text>
              <Text style={s.payTotalVal}>€{task.budget}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={s.methodRow}>
          <View style={s.methodIcon}>
            <MaterialCommunityIcons name="cash" size={22} color="#374151" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodName}>Cash Payment</Text>
            <Text style={s.methodSub}>Pay the helper directly</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color="#22C55E" />
        </View>

        <View style={[s.methodRow, { opacity: 0.4 }]}>
          <View style={s.methodIcon}>
            <MaterialCommunityIcons name="credit-card-outline" size={22} color="#374151" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodName}>Online Payment</Text>
            <Text style={s.methodSub}>Coming soon</Text>
          </View>
        </View>

        {/* Agreement */}
        <View style={s.agreement}>
          <MaterialCommunityIcons name="information" size={18} color="#D97706" />
          <Text style={s.agreementText}>
            By confirming, you agree that the task has been completed satisfactorily and the agreed payment will be made.
          </Text>
        </View>

        <Pressable
          style={[s.greenBtn, confirming && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={confirming}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
          <Text style={s.greenBtnText}>{confirming ? "Confirming..." : "Confirm & Complete"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.payRow}>
      <Text style={s.payLabel}>{label}</Text>
      <Text style={s.payVal}>{value}</Text>
    </View>
  );
}

function SummaryRow({ icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <View style={s.summaryRow}>
      <MaterialCommunityIcons name={icon} size={20} color="#6B7280" />
      <View style={{ flex: 1 }}>
        <Text style={s.summaryLabel}>{label}</Text>
        <Text style={[s.summaryValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: "#000" },
  bigIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  // Confirm
  confirmTitle: { fontSize: 22, fontWeight: "800", color: "#000" },
  confirmSub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  // Payment
  paymentCard: {
    marginHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  paymentTitle: { fontSize: 15, fontWeight: "700", color: "#000" },
  paymentBody: { padding: 16 },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  payLabel: { fontSize: 13, color: "#6B7280" },
  payVal: { fontSize: 13, fontWeight: "600", color: "#000" },
  payTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 10,
  },
  payTotalLabel: { fontSize: 14, fontWeight: "700", color: "#000" },
  payTotalVal: { fontSize: 18, fontWeight: "800", color: COLORS.red },
  // Method
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    marginBottom: 10,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  methodName: { fontSize: 14, fontWeight: "600", color: "#000" },
  methodSub: { fontSize: 12, color: "#9CA3AF" },
  // Agreement
  agreement: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    marginBottom: 20,
    marginTop: 6,
  },
  agreementText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },
  // Buttons
  greenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#22C55E",
  },
  greenBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  redBtn: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
  },
  redBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Review
  reviewTitle: { fontSize: 20, fontWeight: "800", color: "#000" },
  reviewSub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  centerContent: { alignItems: "center", paddingHorizontal: 20, paddingTop: 20 },
  commentWrap: { width: "100%", marginBottom: 20 },
  commentPlaceholder: { fontSize: 13, color: "#9CA3AF" },
  commentInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    minHeight: 60,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  realInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    minHeight: 60,
  },
  // Done
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  doneTitle: { fontSize: 24, fontWeight: "800", color: "#000" },
  doneSub: { fontSize: 14, color: "#6B7280" },
  summaryCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryLabel: { fontSize: 12, color: "#9CA3AF" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#000" },
});
