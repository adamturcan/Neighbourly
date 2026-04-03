import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTask,
  listOffers,
  acceptOffer,
  createOffer,
  completeTask,
  fetchReviewStatus,
  confirmStart,
  confirmComplete,
  getTaskConfirmations,
} from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { supabase } from "../../../shared/lib/supabase";
import MapView, { Marker } from "react-native-maps";

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  open: { color: "#22C55E", icon: "circle-outline", label: "Open" },
  matched: { color: "#3B82F6", icon: "handshake", label: "Matched" },
  in_progress: { color: "#F59E0B", icon: "progress-clock", label: "In Progress" },
  completed: { color: "#6B7280", icon: "check-circle", label: "Completed" },
  disputed: { color: "#EF4444", icon: "alert-circle", label: "Disputed" },
};

export default function TaskDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const taskId = route.params?.taskId as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: task, refetch: refetchTask } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });

  const { data: offers = [], refetch: refetchOffers } = useQuery({
    queryKey: ["offers", taskId],
    queryFn: () => listOffers(taskId),
    enabled: !!taskId,
  });

  // Get other party info (for all statuses beyond open)
  const { data: otherParty } = useQuery({
    queryKey: ["otherPartyFull", taskId],
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
    enabled: !!task && task.status !== "open",
  });

  // Confirmations for matched/in_progress tasks
  const { data: confirmations, refetch: refetchConfirmations } = useQuery({
    queryKey: ["confirmations", taskId],
    queryFn: () => getTaskConfirmations(taskId),
    enabled: !!task && (task.status === "matched" || task.status === "in_progress"),
  });

  // Review status for completed tasks
  const { data: reviewStatus } = useQuery({
    queryKey: ["reviewStatus", taskId],
    queryFn: () => fetchReviewStatus(taskId),
    enabled: !!task && task.status === "completed",
  });

  useFocusEffect(
    React.useCallback(() => {
      refetchTask();
      refetchOffers();
    }, [refetchTask, refetchOffers]),
  );

  // Real-time subscription for offers
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`offers-${taskId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `task_id=eq.${taskId}` }, () => {
        refetchOffers();
        refetchTask();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, refetchOffers, refetchTask]);

  // Real-time subscription for task status changes
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`task-status-${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${taskId}` }, () => {
        refetchTask();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, refetchTask]);

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const isOwner = task.requesterId === user?.id;
  const isHelper = task.helperId === user?.id;
  const myOffer = offers.find((o) => o.helperId === user?.id);
  const hasOffered = !!myOffer;
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.open;
  const isBooking = task.title.startsWith("Booking:");
  const displayTitle = isBooking ? task.title.replace("Booking: ", "") : task.title;
  const scheduledDate = task.when ? new Date(task.when) : null;
  const isScheduled = scheduledDate && scheduledDate.getTime() > new Date(task.createdAt).getTime() + 60000;

  const handleMakeOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      Alert.alert("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await createOffer({ taskId, amount: Number(offerAmount), message: offerMessage || undefined });
      setShowOfferForm(false);
      setOfferAmount("");
      setOfferMessage("");
      refetchOffers();
      Alert.alert(isBooking ? "Request accepted!" : "Offer sent!",
        isBooking ? "The seeker will be notified." : "Waiting for the task owner to respond.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSubmitting(false);
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptOffer({ taskId, offerId });
      refetchTask();
      refetchOffers();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      Alert.alert("Offer accepted!", "You can now message and coordinate.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleConfirmStart = async () => {
    try {
      const { bothConfirmed } = await confirmStart(taskId);
      refetchTask();
      refetchConfirmations();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (bothConfirmed) {
        Alert.alert("Work started!", "Both parties confirmed. Task is now in progress.");
      } else {
        Alert.alert("Confirmed!", "Waiting for the other party to confirm start.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleConfirmComplete = async () => {
    try {
      const { bothConfirmed } = await confirmComplete(taskId);
      refetchTask();
      refetchConfirmations();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (bothConfirmed) {
        // Both confirmed — go to completion screen
        navigation.goBack();
        setTimeout(() => {
          (navigation as any).getParent?.()?.navigate("Discover", {
            screen: "TaskCompletion",
            params: { taskId: task.id },
          });
        }, 100);
      } else {
        Alert.alert("Confirmed!", "Waiting for the other party to confirm completion.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const goToChat = () => {
    navigation.goBack();
    setTimeout(() => {
      (navigation as any).getParent?.()?.navigate("Discover", {
        screen: "ChatScreen",
        params: { taskId: task.id, otherName: otherParty?.name ?? "User", fromInbox: true },
      });
    }, 100);
  };

  const goToCompletion = () => {
    navigation.goBack();
    setTimeout(() => {
      (navigation as any).getParent?.()?.navigate("Discover", {
        screen: "TaskCompletion",
        params: { taskId: task.id },
      });
    }, 100);
  };

  const goToReview = () => {
    if (!otherParty) return;
    navigation.navigate("ReviewSubmit", {
      taskId: task.id,
      revieweeId: otherParty.id,
      revieweeName: otherParty.name,
      taskTitle: displayTitle,
    });
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={st.content}>
        {/* Status Badge */}
        <View style={st.statusRow}>
          <View style={[st.statusBadge, { backgroundColor: statusConf.color + "18" }]}>
            <MaterialCommunityIcons name={statusConf.icon as any} size={14} color={statusConf.color} />
            <Text style={[st.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
          </View>
          <View style={[st.catBadge, { backgroundColor: (CATEGORY_COLORS[task.category] ?? "#6B7280") + "18" }]}>
            <Text style={[st.catText, { color: CATEGORY_COLORS[task.category] ?? "#6B7280" }]}>{task.category}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={st.title}>{displayTitle}</Text>
        {task.description && task.description !== displayTitle && (
          <Text style={st.desc}>{task.description}</Text>
        )}

        {/* Info Cards */}
        <View style={st.infoCard}>
          <View style={st.infoRow}>
            <MaterialCommunityIcons name="cash" size={20} color={COLORS.red} />
            <View>
              <Text style={st.infoLabel}>Budget</Text>
              <Text style={st.infoValue}>€{task.budget}</Text>
            </View>
          </View>
          {isScheduled && (
            <View style={st.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#2563EB" />
              <View>
                <Text style={st.infoLabel}>Scheduled</Text>
                <Text style={st.infoValue}>
                  {scheduledDate!.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {scheduledDate!.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          )}
          {otherParty && (
            <View style={st.infoRow}>
              <MaterialCommunityIcons name="account" size={20} color="#6B7280" />
              <View>
                <Text style={st.infoLabel}>{isOwner ? "Helper" : "Posted by"}</Text>
                <Text style={st.infoValue}>{otherParty.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Timeline */}
        {task.status !== "open" && (
          <View style={st.timeline}>
            <Text style={st.timelineTitle}>Progress</Text>
            <TimelineItem
              done={true}
              active={false}
              icon="check"
              title="Task Posted"
              sub={new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              isLast={false}
            />
            <TimelineItem
              done={true}
              active={(task.status as string) === "matched"}
              icon="check"
              title={`Offer Accepted — €${task.budget}`}
              sub={otherParty ? `with ${otherParty.name}` : undefined}
              isLast={false}
            />
            {isScheduled && (
              <TimelineItem
                done={task.status === "in_progress" || task.status === "completed"}
                active={false}
                icon="check"
                title={`Scheduled — ${scheduledDate!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                isLast={false}
              />
            )}
            <TimelineItem
              done={task.status === "in_progress" || task.status === "completed"}
              active={task.status === "in_progress"}
              icon={task.status === "in_progress" ? "progress-clock" : task.status === "completed" ? "check" : "circle-outline"}
              title="Work in Progress"
              isLast={false}
            />
            <TimelineItem
              done={task.status === "completed"}
              active={false}
              icon={task.status === "completed" ? "check" : "circle-outline"}
              title="Payment & Review"
              isLast={true}
            />
          </View>
        )}

        {/* Map */}
        {task.lat !== 0 && task.lng !== 0 && (
          <View style={st.mapWrap}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{ latitude: task.lat, longitude: task.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
              scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: task.lat, longitude: task.lng }}>
                <View style={[st.mapPin, { backgroundColor: CATEGORY_COLORS[task.category] ?? "#6B7280" }]}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* ========== ACTIONS BY STATUS ========== */}

        {/* OPEN — Non-owner: Make offer / Accept booking */}
        {task.status === "open" && !isOwner && (
          <View style={{ gap: 12 }}>
            {hasOffered ? (
              <View style={st.offerSent}>
                <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#000" }}>You offered €{myOffer!.amount}</Text>
                  {myOffer!.message && <Text style={{ fontSize: 13, color: "#71717A", marginTop: 1 }}>{myOffer!.message}</Text>}
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#22C55E" }}>Pending</Text>
              </View>
            ) : !showOfferForm ? (
              <Pressable onPress={() => { setShowOfferForm(true); setOfferAmount(String(task.budget)); }} style={st.primaryBtn}>
                <MaterialCommunityIcons name={isBooking ? "calendar-check" : "hand-coin-outline"} size={18} color="#fff" />
                <Text style={st.primaryBtnText}>{isBooking ? "Accept Booking Request" : "Make an Offer"}</Text>
              </Pressable>
            ) : (
              <View style={st.offerForm}>
                <Text style={{ fontWeight: "700", color: "#000", fontSize: 15 }}>
                  {isBooking ? "Confirm & set your price" : "Your offer"}
                </Text>
                <TextInput
                  placeholder="Amount (€)"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                  style={st.formInput}
                  placeholderTextColor="#C7C7CC"
                />
                <TextInput
                  placeholder="Message (optional)"
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  multiline
                  style={[st.formInput, { minHeight: 70, textAlignVertical: "top" }]}
                  placeholderTextColor="#C7C7CC"
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable onPress={() => setShowOfferForm(false)} style={st.outlineBtn}>
                    <Text style={st.outlineBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleMakeOffer} disabled={submitting} style={[st.primaryBtn, { flex: 1 }]}>
                    <Text style={st.primaryBtnText}>{submitting ? "Sending…" : "Send"}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* OPEN — Owner: See offers */}
        {task.status === "open" && isOwner && offers.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={st.sectionTitle}>Offers ({offers.length})</Text>
            {offers.map((offer) => (
              <View key={offer.id} style={st.offerCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>€{offer.amount}</Text>
                  {offer.message && <Text style={{ color: "#71717A", marginTop: 2, fontSize: 13 }} numberOfLines={2}>{offer.message}</Text>}
                </View>
                <Pressable onPress={() => handleAcceptOffer(offer.id)} style={st.acceptBtn}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Accept</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* OPEN — Owner: No offers yet */}
        {task.status === "open" && isOwner && offers.length === 0 && (
          <View style={st.waitingCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: "#000" }}>Waiting for offers</Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                {isBooking ? "The provider will review your request." : "Helpers can see your task and make offers."}
              </Text>
            </View>
          </View>
        )}

        {/* MATCHED — Mutual start confirmation */}
        {task.status === "matched" && (
          <View style={{ gap: 12 }}>
            <View style={st.matchedBanner}>
              <MaterialCommunityIcons name="handshake" size={22} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#1E40AF" }}>Matched!</Text>
                <Text style={{ fontSize: 13, color: "#3B82F6", marginTop: 2 }}>
                  Both parties must confirm to start work.
                </Text>
              </View>
            </View>

            {/* Confirmation status */}
            {confirmations && (
              <View style={st.confirmCard}>
                <View style={st.confirmRow}>
                  <MaterialCommunityIcons
                    name={confirmations.creatorStarted ? "check-circle" : "circle-outline"}
                    size={20}
                    color={confirmations.creatorStarted ? "#22C55E" : "#D1D5DB"}
                  />
                  <Text style={st.confirmLabel}>
                    {isOwner ? "You" : "Task owner"} {confirmations.creatorStarted ? "confirmed" : "not confirmed yet"}
                  </Text>
                </View>
                <View style={st.confirmRow}>
                  <MaterialCommunityIcons
                    name={confirmations.helperStarted ? "check-circle" : "circle-outline"}
                    size={20}
                    color={confirmations.helperStarted ? "#22C55E" : "#D1D5DB"}
                  />
                  <Text style={st.confirmLabel}>
                    {isHelper ? "You" : "Helper"} {confirmations.helperStarted ? "confirmed" : "not confirmed yet"}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={goToChat} style={[st.primaryBtn, { flex: 1 }]}>
                <MaterialCommunityIcons name="chat-outline" size={18} color="#fff" />
                <Text style={st.primaryBtnText}>Message</Text>
              </Pressable>
              {((isOwner && !confirmations?.creatorStarted) || (isHelper && !confirmations?.helperStarted)) && (
                <Pressable onPress={handleConfirmStart} style={[st.greenBtn, { flex: 1 }]}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                  <Text style={st.greenBtnText}>Confirm Start</Text>
                </Pressable>
              )}
              {((isOwner && confirmations?.creatorStarted) || (isHelper && confirmations?.helperStarted)) && (
                <View style={[st.confirmedPill]}>
                  <MaterialCommunityIcons name="check" size={16} color="#22C55E" />
                  <Text style={{ color: "#22C55E", fontWeight: "600", fontSize: 13 }}>You confirmed</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* IN PROGRESS — Mutual completion */}
        {task.status === "in_progress" && (
          <View style={{ gap: 12 }}>
            {isScheduled && (
              <View style={st.scheduleBanner}>
                <View style={st.scheduleIcon}>
                  <MaterialCommunityIcons name="calendar-clock" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#000" }}>Scheduled</Text>
                  <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "600", marginTop: 2 }}>
                    {scheduledDate!.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {scheduledDate!.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            )}

            {/* Completion confirmation status */}
            {confirmations && (confirmations.creatorCompleted || confirmations.helperCompleted) && (
              <View style={st.confirmCard}>
                <Text style={{ fontWeight: "700", color: "#000", marginBottom: 8 }}>Completion Status</Text>
                <View style={st.confirmRow}>
                  <MaterialCommunityIcons
                    name={confirmations.creatorCompleted ? "check-circle" : "circle-outline"}
                    size={20}
                    color={confirmations.creatorCompleted ? "#22C55E" : "#D1D5DB"}
                  />
                  <Text style={st.confirmLabel}>
                    {isOwner ? "You" : "Task owner"} {confirmations.creatorCompleted ? "confirmed done" : "not confirmed yet"}
                  </Text>
                </View>
                <View style={st.confirmRow}>
                  <MaterialCommunityIcons
                    name={confirmations.helperCompleted ? "check-circle" : "circle-outline"}
                    size={20}
                    color={confirmations.helperCompleted ? "#22C55E" : "#D1D5DB"}
                  />
                  <Text style={st.confirmLabel}>
                    {isHelper ? "You" : "Helper"} {confirmations.helperCompleted ? "confirmed done" : "not confirmed yet"}
                  </Text>
                </View>
              </View>
            )}

            <Pressable onPress={goToChat} style={st.primaryBtn}>
              <MaterialCommunityIcons name="chat-outline" size={18} color="#fff" />
              <Text style={st.primaryBtnText}>Message {otherParty?.name ?? ""}</Text>
            </Pressable>

            {/* Show confirm complete or already confirmed */}
            {((isOwner && !confirmations?.creatorCompleted) || (isHelper && !confirmations?.helperCompleted)) && (
              <Pressable onPress={handleConfirmComplete} style={st.greenBtn}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                <Text style={st.greenBtnText}>Confirm Done</Text>
              </Pressable>
            )}
            {((isOwner && confirmations?.creatorCompleted) || (isHelper && confirmations?.helperCompleted)) && (
              <View style={st.waitingConfirmBanner}>
                <MaterialCommunityIcons name="clock-check-outline" size={22} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#92400E" }}>You confirmed completion</Text>
                  <Text style={{ fontSize: 13, color: "#A16207", marginTop: 2 }}>
                    Waiting for {isOwner ? "the helper" : "the task owner"} to confirm too.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* COMPLETED */}
        {task.status === "completed" && (
          <View style={{ gap: 12 }}>
            <View style={st.completedBanner}>
              <MaterialCommunityIcons name="check-circle" size={22} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#166534" }}>Task Completed</Text>
                <Text style={{ fontSize: 13, color: "#15803D", marginTop: 2 }}>
                  Payment: €{task.budget} (cash)
                </Text>
              </View>
            </View>

            {reviewStatus?.canReview && otherParty && (
              <Pressable onPress={goToReview} style={st.reviewBanner}>
                <MaterialCommunityIcons name="star-outline" size={24} color={COLORS.red} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#000", fontSize: 15 }}>Leave a Review</Text>
                  <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    How was your experience with {otherParty.name}?
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>
            )}

            {reviewStatus && !reviewStatus.canReview && otherParty && (
              <View style={st.reviewedBanner}>
                <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
                <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
                  You've reviewed {otherParty.name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Offer count for non-owners */}
        {!isOwner && task.status === "open" && offers.length > 1 && (
          <Text style={{ fontSize: 13, color: "#A1A1AA" }}>
            {offers.length} offer{offers.length !== 1 ? "s" : ""} on this task
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function TimelineItem({ done, active, icon, title, sub, isLast }: {
  done: boolean; active: boolean; icon: string; title: string; sub?: string; isLast: boolean;
}) {
  const dotColor = done ? "#22C55E" : active ? COLORS.red : "#F3F4F6";
  const iconColor = done || active ? "#fff" : "#9CA3AF";

  return (
    <View style={st.tlItem}>
      {!isLast && <View style={[st.tlLine, done && { backgroundColor: "#22C55E" }]} />}
      <View style={[st.tlDot, { backgroundColor: dotColor }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} />
      </View>
      <View style={st.tlContent}>
        <Text style={[st.tlTitle, (done || active) && { color: "#000" }]}>{title}</Text>
        {sub && <Text style={st.tlSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16 },
  // Status
  statusRow: { flexDirection: "row", gap: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  // Title
  title: { fontSize: 24, fontWeight: "800", color: "#000" },
  desc: { fontSize: 15, color: "#71717A", lineHeight: 22 },
  // Info card
  infoCard: { backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16, gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoLabel: { fontSize: 11, color: "#9CA3AF" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#000" },
  // Timeline
  timeline: { gap: 0 },
  timelineTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 16 },
  tlItem: { flexDirection: "row", gap: 14, paddingBottom: 20, position: "relative" },
  tlLine: { position: "absolute", left: 13, top: 30, bottom: 0, width: 2, backgroundColor: "#E5E7EB" },
  tlDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 1 },
  tlContent: { flex: 1, paddingTop: 3 },
  tlTitle: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  tlSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  // Map
  mapWrap: { borderRadius: 16, overflow: "hidden", height: 150 },
  mapPin: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: "#fff" },
  // Buttons
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.red, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  greenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#22C55E", borderRadius: 14, paddingVertical: 16 },
  greenBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  outlineBtnText: { fontWeight: "600", color: "#71717A" },
  acceptBtn: { backgroundColor: COLORS.red, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  // Offer
  offerSent: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  offerForm: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, gap: 12 },
  formInput: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: "#E5E5EA", color: "#000" },
  offerCard: { padding: 14, borderRadius: 12, backgroundColor: "#FAFAFA", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#000" },
  // Banners
  waitingCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#FEF3C7", borderRadius: 14 },
  matchedBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#EFF6FF", borderRadius: 14, borderWidth: 1.5, borderColor: "#BFDBFE" },
  scheduleBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#F0F9FF", borderRadius: 14, borderWidth: 1.5, borderColor: "#BAE6FD" },
  scheduleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  completedBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#DCFCE7", borderRadius: 14 },
  reviewBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#FEF2F2", borderRadius: 14 },
  reviewedBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: "#F0FDF4", borderRadius: 14 },
  // Confirmations
  confirmCard: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, gap: 8 },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmLabel: { fontSize: 13, color: "#374151" },
  confirmedPill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16, borderRadius: 14, backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#BBF7D0" },
  waitingConfirmBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#FEF3C7", borderRadius: 14, borderWidth: 1.5, borderColor: "#FDE68A" },
});
