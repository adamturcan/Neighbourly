import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
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
} from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import { supabase } from "../../../shared/lib/supabase";
import MapView, { Marker } from "react-native-maps";

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  matched: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#6B7280",
  disputed: "#EF4444",
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

  // Get other party's name for chat
  const { data: otherPartyName } = useQuery({
    queryKey: ["otherPartyName", taskId],
    queryFn: async () => {
      if (!task) return "User";
      const otherId = task.requesterId === user?.id ? task.helperId : task.requesterId;
      if (!otherId) return "User";
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", otherId)
        .single();
      return data?.full_name ?? data?.username ?? "User";
    },
    enabled: !!task && (task.status === "matched" || task.status === "in_progress"),
  });

  // Refetch on focus
  useFocusEffect(
    React.useCallback(() => {
      refetchTask();
      refetchOffers();
    }, [refetchTask, refetchOffers]),
  );

  // Real-time subscription for new offers
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`offers-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `task_id=eq.${taskId}` },
        () => {
          refetchOffers();
          refetchTask();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, refetchOffers, refetchTask]);

  // Review status for completed tasks
  const { data: reviewStatus } = useQuery({
    queryKey: ["reviewStatus", taskId],
    queryFn: () => fetchReviewStatus(taskId),
    enabled: !!task && task.status === "completed",
  });

  // Get other party info for review
  const { data: otherPartyInfo } = useQuery({
    queryKey: ["otherPartyInfo", taskId],
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
    enabled: !!task && task.status === "completed",
  });

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const isOwner = task.requesterId === user?.id;
  const myOffer = offers.find((o) => o.helperId === user?.id);
  const hasOffered = !!myOffer;

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
      Alert.alert("Offer sent!");
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
      Alert.alert("Offer accepted!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleComplete = async () => {
    Alert.alert("Complete task?", "Confirm the work has been done.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          await completeTask(taskId);
          refetchTask();
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          // Prompt to leave review
          const otherId = task.requesterId === user?.id ? task.helperId : task.requesterId;
          if (otherId) {
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("id, full_name, username")
              .eq("id", otherId)
              .single();
            if (otherProfile) {
              Alert.alert("Task completed!", "Would you like to leave a review?", [
                { text: "Later", style: "cancel" },
                {
                  text: "Review Now",
                  onPress: () =>
                    navigation.navigate("ReviewSubmit", {
                      taskId: task.id,
                      revieweeId: otherProfile.id,
                      revieweeName: otherProfile.full_name ?? otherProfile.username ?? "User",
                      taskTitle: task.title,
                    }),
                },
              ]);
              return;
            }
          }
          Alert.alert("Task completed!");
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Status badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: (STATUS_COLORS[task.status] ?? "#6B7280") + "18",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: STATUS_COLORS[task.status] ?? "#6B7280",
                textTransform: "capitalize",
              }}
            >
              {task.status.replace("_", " ")}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#A1A1AA" }}>{task.category}</Text>
        </View>

        {/* Title & description */}
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#000" }}>{task.title}</Text>
        <Text style={{ fontSize: 15, color: "#71717A", lineHeight: 22 }}>{task.description}</Text>

        {/* Budget + info row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialCommunityIcons name="cash" size={18} color={COLORS.red} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#000" }}>
              {task.budget ? `€${task.budget}` : "Budget TBD"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#A1A1AA" />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#A1A1AA" }}>ASAP</Text>
          </View>
        </View>

        {/* Inline map */}
        {task.lat !== 0 && task.lng !== 0 && (
          <View style={{ borderRadius: 16, overflow: "hidden", height: 150 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: task.lat,
                longitude: task.lng,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: task.lat, longitude: task.lng }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.other,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 2.5, borderColor: "#fff",
                  shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                }}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Make offer / show existing offer (for non-owners on open tasks) */}
        {task.status === "open" && !isOwner && (
          <View style={{ gap: 12 }}>
            {hasOffered ? (
              <View style={{ backgroundColor: "#F0FDF4", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#000" }}>You offered €{myOffer!.amount}</Text>
                  {myOffer!.message && <Text style={{ fontSize: 13, color: "#71717A", marginTop: 1 }}>{myOffer!.message}</Text>}
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#22C55E", textTransform: "capitalize" }}>Pending</Text>
              </View>
            ) : !showOfferForm ? (
              <Pressable
                onPress={() => setShowOfferForm(true)}
                style={{ backgroundColor: COLORS.red, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Make an offer</Text>
              </Pressable>
            ) : (
              <View style={{ backgroundColor: "#FAFAFA", borderRadius: 12, padding: 16, gap: 12 }}>
                <Text style={{ fontWeight: "600", color: "#000" }}>Your offer</Text>
                <TextInput
                  placeholder="Amount (€)"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                  style={{ backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: "#E5E5EA" }}
                  placeholderTextColor="#C7C7CC"
                />
                <TextInput
                  placeholder="Message (optional)"
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  multiline
                  style={{ backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 70, textAlignVertical: "top", borderWidth: 1, borderColor: "#E5E5EA" }}
                  placeholderTextColor="#C7C7CC"
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => setShowOfferForm(false)}
                    style={{ flex: 1, borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                  >
                    <Text style={{ fontWeight: "600", color: "#71717A" }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleMakeOffer}
                    disabled={submitting}
                    style={{ flex: 1, backgroundColor: COLORS.red, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>{submitting ? "Sending…" : "Send"}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Message button — dismiss modal and go to Inbox chat */}
        {(task.status === "matched" || task.status === "in_progress") && (
          <Pressable
            onPress={() => {
              // Close the modal first, then navigate to chat via Inbox tab
              navigation.goBack();
              setTimeout(() => {
                (navigation as any).getParent?.()?.navigate("Discover", {
                  screen: "ChatScreen",
                  params: { taskId: task.id, otherName: otherPartyName ?? "User", fromInbox: true },
                });
              }, 100);
            }}
            style={{
              backgroundColor: COLORS.red,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MaterialCommunityIcons name="chat-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Message</Text>
          </Pressable>
        )}

        {/* Complete button */}
        {task.status === "in_progress" && isOwner && (
          <Pressable
            onPress={handleComplete}
            style={{ backgroundColor: "#22C55E", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Mark as completed</Text>
          </Pressable>
        )}

        {/* Review prompt for completed tasks */}
        {task.status === "completed" && reviewStatus && otherPartyInfo && (
          reviewStatus.canReview ? (
            <Pressable
              onPress={() =>
                navigation.navigate("ReviewSubmit", {
                  taskId: task.id,
                  revieweeId: otherPartyInfo.id,
                  revieweeName: otherPartyInfo.name,
                  taskTitle: task.title,
                })
              }
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 14,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <MaterialCommunityIcons name="star-outline" size={24} color={COLORS.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#000", fontSize: 15 }}>Leave a Review</Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                  How was your experience with {otherPartyInfo.name}?
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>
          ) : (
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 14,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
              <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
                You've reviewed {otherPartyInfo.name}
              </Text>
            </View>
          )
        )}

        {/* Offers list (visible to task owner) */}
        {isOwner && offers.length > 0 && (
          <View style={{ gap: 10, marginTop: 4 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#000" }}>
              Offers ({offers.length})
            </Text>
            {offers.map((offer) => (
              <View
                key={offer.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: "#FAFAFA",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>€{offer.amount}</Text>
                  {offer.message && (
                    <Text style={{ color: "#71717A", marginTop: 2, fontSize: 13 }} numberOfLines={2}>
                      {offer.message}
                    </Text>
                  )}
                </View>
                {task.status === "open" && (
                  <Pressable
                    onPress={() => handleAcceptOffer(offer.id)}
                    style={{ backgroundColor: COLORS.red, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Accept</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Show offer count for non-owners */}
        {!isOwner && offers.length > 0 && (
          <Text style={{ fontSize: 13, color: "#A1A1AA" }}>
            {offers.length} offer{offers.length !== 1 ? "s" : ""} on this task
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
