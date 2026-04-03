import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTask,
  listOffers,
  acceptOffer,
  createOffer,
  completeTask,
} from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../../shared/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  matched: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#6B7280",
  disputed: "#EF4444",
};

export default function TaskDetailScreen() {
  const route = useRoute<any>();
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

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const isOwner = task.requesterId === user?.id;
  const isHelper = task.helperId === user?.id;

  const handleMakeOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      Alert.alert("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await createOffer({
        taskId,
        amount: Number(offerAmount),
        message: offerMessage || undefined,
      });
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
          Alert.alert("Task completed!");
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="pb-8">
      <View className="p-4 gap-4">
        {/* Status badge */}
        <View className="flex-row items-center gap-2">
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: (STATUS_COLORS[task.status] ?? "#6B7280") + "20" }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: STATUS_COLORS[task.status] ?? "#6B7280" }}
            >
              {task.status.replace("_", " ")}
            </Text>
          </View>
          <Text className="text-text-muted text-sm">{task.category}</Text>
        </View>

        {/* Title & description */}
        <Text className="text-2xl font-extrabold text-black">{task.title}</Text>
        <Text className="text-base text-text-subtle leading-6">
          {task.description}
        </Text>

        {/* Budget */}
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="cash" size={20} color={COLORS.red} />
          <Text className="text-lg font-bold text-black">
            {task.budget ? `€${task.budget}` : "Budget TBD"}
          </Text>
        </View>

        {/* Action buttons based on role & status */}
        {task.status === "open" && !isOwner && (
          <View className="gap-3">
            {!showOfferForm ? (
              <Pressable
                onPress={() => setShowOfferForm(true)}
                className="bg-brand-red rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">
                  Make an offer
                </Text>
              </Pressable>
            ) : (
              <View className="bg-surface-dim rounded-2xl p-4 gap-3">
                <Text className="font-bold text-black">Your offer</Text>
                <TextInput
                  placeholder="Amount (€)"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                  className="bg-white rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#6B7280"
                />
                <TextInput
                  placeholder="Message (optional)"
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  multiline
                  className="bg-white rounded-xl px-4 py-3 text-base min-h-[80px]"
                  placeholderTextColor="#6B7280"
                  textAlignVertical="top"
                />
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowOfferForm(false)}
                    className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
                  >
                    <Text className="font-bold text-text-muted">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleMakeOffer}
                    disabled={submitting}
                    className="flex-1 bg-brand-red rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-bold">
                      {submitting ? "Sending…" : "Send"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {task.status === "in_progress" && isOwner && (
          <Pressable
            onPress={handleComplete}
            className="bg-green-600 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">
              Mark as completed
            </Text>
          </Pressable>
        )}

        {/* Offers section (visible to task owner) */}
        {isOwner && offers.length > 0 && (
          <View className="gap-3 mt-2">
            <Text className="text-lg font-bold text-black">
              Offers ({offers.length})
            </Text>
            {offers.map((offer) => (
              <View
                key={offer.id}
                className="p-4 rounded-2xl bg-surface-dim flex-row justify-between items-center"
              >
                <View className="flex-1 pr-3">
                  <Text className="font-bold text-base">€{offer.amount}</Text>
                  {offer.message && (
                    <Text className="text-text-subtle mt-1" numberOfLines={2}>
                      {offer.message}
                    </Text>
                  )}
                </View>
                {task.status === "open" && (
                  <Pressable
                    onPress={() => handleAcceptOffer(offer.id)}
                    className="bg-brand-red py-2.5 px-4 rounded-xl"
                  >
                    <Text className="text-white font-bold">Accept</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
