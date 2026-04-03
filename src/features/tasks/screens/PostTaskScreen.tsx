import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { createTask } from "../../../shared/lib/api";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../../shared/lib/constants";
import { z } from "zod";

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning", icon: "broom" as const },
  { key: "gardening", label: "Garden", icon: "flower" as const },
  { key: "moving", label: "Moving", icon: "truck" as const },
  { key: "tutoring", label: "Tutoring", icon: "school" as const },
  { key: "plumbing", label: "Plumbing", icon: "pipe-wrench" as const },
  { key: "electrical", label: "Electrical", icon: "lightning-bolt" as const },
  { key: "painting", label: "Painting", icon: "format-paint" as const },
  { key: "car", label: "Car help", icon: "car" as const },
  { key: "other", label: "Other", icon: "dots-horizontal" as const },
];

const PAYMENT_TYPES = [
  { key: "cash", label: "Cash" },
  { key: "digital", label: "Digital" },
];

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Please add a short description"),
  budget: z.number().min(1, "Budget must be at least €1"),
});

type Step = 1 | 2 | 3;

export default function PostTaskScreen() {
  const nav = useNavigation<any>();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [category, setCategory] = useState("");
  // Step 2
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Step 3
  const [budget, setBudget] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && !category) {
      Alert.alert("Pick a category");
      return;
    }
    if (step === 2) {
      const result = taskSchema.safeParse({
        title,
        description,
        budget: Number(budget) || 0,
      });
      if (!result.success) {
        Alert.alert("Check your input", result.error.issues[0].message);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const handleBack = () => {
    if (step === 1) return;
    setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
    const parsed = taskSchema.safeParse({
      title,
      description,
      budget: Number(budget),
    });
    if (!parsed.success) {
      Alert.alert("Check your input", parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        title: parsed.data.title,
        description: parsed.data.description,
        category,
        budget: parsed.data.budget,
        payment_type: paymentType,
        lat: 48.1482,
        lng: 17.1067,
      });
      Alert.alert("Task posted!", "Helpers nearby will see your task.");
      // Reset form
      setStep(1);
      setCategory("");
      setTitle("");
      setDescription("");
      setBudget("");
      setPaymentType("cash");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center gap-3">
          {step > 1 && (
            <Pressable onPress={handleBack}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
            </Pressable>
          )}
          <Text className="text-2xl font-extrabold text-black flex-1">
            Post a task
          </Text>
          <Text className="text-text-muted text-sm">Step {step}/3</Text>
        </View>

        {/* Progress bar */}
        <View className="mx-4 h-1 bg-gray-200 rounded-full mb-4">
          <View
            className="h-1 bg-brand-red rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Category */}
          {step === 1 && (
            <View className="gap-4">
              <Text className="text-lg font-bold text-black">
                What do you need help with?
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    className={`w-[30%] aspect-square rounded-2xl items-center justify-center gap-2 border-2 ${
                      category === cat.key
                        ? "border-brand-red bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={28}
                      color={category === cat.key ? COLORS.red : "#6B7280"}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        category === cat.key ? "text-brand-red" : "text-text-muted"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <View className="gap-4">
              <Text className="text-lg font-bold text-black">
                Describe your task
              </Text>
              <View className="gap-2">
                <Text className="text-sm font-bold text-black">Title</Text>
                <TextInput
                  placeholder="e.g. Help me move a desk"
                  value={title}
                  onChangeText={setTitle}
                  className="bg-surface-dim rounded-2xl px-4 py-4 text-base"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-bold text-black">Description</Text>
                <TextInput
                  placeholder="Add details — when, where, what's needed…"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  className="bg-surface-dim rounded-2xl px-4 py-4 text-base min-h-[120px]"
                  placeholderTextColor="#6B7280"
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Step 3: Budget & Payment */}
          {step === 3 && (
            <View className="gap-4">
              <Text className="text-lg font-bold text-black">
                Budget & payment
              </Text>
              <View className="gap-2">
                <Text className="text-sm font-bold text-black">Budget (€)</Text>
                <TextInput
                  placeholder="40"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  className="bg-surface-dim rounded-2xl px-4 py-4 text-base"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-bold text-black">Payment type</Text>
                <View className="flex-row gap-3">
                  {PAYMENT_TYPES.map((pt) => (
                    <Pressable
                      key={pt.key}
                      onPress={() => setPaymentType(pt.key)}
                      className={`flex-1 py-4 rounded-2xl items-center border-2 ${
                        paymentType === pt.key
                          ? "border-brand-red bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          paymentType === pt.key ? "text-brand-red" : "text-text-muted"
                        }`}
                      >
                        {pt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom button */}
        <View className="px-4 pb-4">
          <Pressable
            onPress={step < 3 ? handleNext : handleSubmit}
            disabled={submitting || (step === 1 && !category)}
            className={`rounded-2xl py-4 items-center ${
              (step === 1 && !category) ? "bg-gray-300" : "bg-brand-red"
            }`}
          >
            <Text className="text-white font-bold text-base">
              {submitting ? "Posting…" : step < 3 ? "Next" : "Post task"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
