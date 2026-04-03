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
import { COLORS } from "../../../shared/lib/constants";

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning", icon: "broom" as const, color: "#E31B23" },
  { key: "gardening", label: "Garden", icon: "flower-outline" as const, color: "#16A34A" },
  { key: "moving", label: "Moving", icon: "truck-outline" as const, color: "#2563EB" },
  { key: "tutoring", label: "Tutoring", icon: "school-outline" as const, color: "#7C3AED" },
  { key: "plumbing", label: "Plumbing", icon: "pipe-wrench" as const, color: "#0891B2" },
  { key: "electrical", label: "Electrical", icon: "flash-outline" as const, color: "#D97706" },
  { key: "painting", label: "Painting", icon: "format-paint" as const, color: "#EA580C" },
  { key: "car", label: "Car help", icon: "car-outline" as const, color: "#E11D48" },
];

const PRICE_PRESETS = [20, 45, 60, 80, 100];

type Step = 1 | 2 | 3;

export default function PostTaskScreen() {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.key === category);

  const handleNext = () => {
    if (step === 1 && !category) {
      Alert.alert("Pick a category");
      return;
    }
    if (step === 2) {
      if (title.trim().length < 3) {
        Alert.alert("Title too short", "At least 3 characters");
        return;
      }
      if (description.trim().length < 5) {
        Alert.alert("Add a description", "At least 5 characters");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const handleSubmit = async () => {
    if (!Number(budget) || Number(budget) < 1) {
      Alert.alert("Set a budget", "At least €1");
      return;
    }
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        payment_type: paymentType,
        lat: 48.1482,
        lng: 17.1067,
      });
      Alert.alert("Task posted!", "Helpers nearby will see your task.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Nav bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            height: 44,
          }}
        >
          {step > 1 ? (
            <Pressable onPress={() => setStep((s) => (s - 1) as Step)} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#000" />
            </Pressable>
          ) : (
            <View style={{ width: 28 }} />
          )}
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 17,
              fontWeight: "600",
              color: "#000",
            }}
          >
            New Task
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== STEP 1: Category grid ===== */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#000", marginTop: 8 }}>
                Category
              </Text>
              <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 2, marginBottom: 20 }}>
                What kind of help do you need?
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {CATEGORIES.map((cat) => {
                  const selected = category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      style={{
                        width: "22%",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 16,
                          backgroundColor: "#fff",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOpacity: 0.06,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                          borderWidth: selected ? 2 : 0,
                          borderColor: selected ? COLORS.red : "transparent",
                        }}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={26}
                          color={selected ? COLORS.red : cat.color}
                        />
                        {selected && (
                          <View
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -4,
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: COLORS.red,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MaterialCommunityIcons name="check" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          color: selected ? COLORS.red : "#000",
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ===== STEP 2: Details ===== */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#000", marginTop: 8 }}>
                Details
              </Text>
              <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 2, marginBottom: 20 }}>
                Tell helpers what you need
              </Text>

              {/* Grouped card */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                  marginBottom: 16,
                }}
              >
                <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#e5e5ea" }}>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#8E8E93", marginBottom: 2 }}>
                    TITLE
                  </Text>
                  <TextInput
                    placeholder="e.g. Deep clean my apartment"
                    value={title}
                    onChangeText={setTitle}
                    style={{ fontSize: 15, fontWeight: "500", color: "#000", paddingVertical: 4 }}
                    placeholderTextColor="#C7C7CC"
                  />
                </View>
                <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#8E8E93", marginBottom: 2 }}>
                    DESCRIPTION
                  </Text>
                  <TextInput
                    placeholder="Add details — when, where, what's needed…"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    style={{ fontSize: 15, color: "#000", minHeight: 100, textAlignVertical: "top", paddingVertical: 4, lineHeight: 22 }}
                    placeholderTextColor="#C7C7CC"
                  />
                </View>
              </View>

              {/* Photos */}
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#8E8E93", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>
                Photos
              </Text>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                }}
              >
                <Pressable
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    backgroundColor: "#f2f2f7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#8E8E93" />
                  <Text style={{ fontSize: 9, color: "#8E8E93", fontWeight: "500", marginTop: 2 }}>
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ===== STEP 3: Budget ===== */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#000", marginTop: 8 }}>
                Budget
              </Text>
              <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 2, marginBottom: 20 }}>
                Set your price and preferences
              </Text>

              {/* Budget input card */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#C7C7CC" }}>€</Text>
                <TextInput
                  placeholder="0"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  style={{ fontSize: 22, fontWeight: "700", color: "#000", flex: 1 }}
                  placeholderTextColor="#C7C7CC"
                />
              </View>

              {/* Price presets */}
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
                {PRICE_PRESETS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setBudget(String(p))}
                    style={{
                      height: 30,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: Number(budget) === p ? COLORS.red : "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOpacity: Number(budget) === p ? 0 : 0.04,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: Number(budget) === p ? 0 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: Number(budget) === p ? "#fff" : "#8E8E93",
                      }}
                    >
                      €{p}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Preferences grouped table */}
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#8E8E93", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>
                Preferences
              </Text>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                  marginBottom: 20,
                }}
              >
                <Pressable
                  onPress={() => setPaymentType(paymentType === "cash" ? "digital" : "cash")}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: "#e5e5ea" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color="#8E8E93" />
                    <Text style={{ fontSize: 15, color: "#000" }}>Payment</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                      {paymentType === "cash" ? "Cash" : "Digital"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#C7C7CC" />
                  </View>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: "#e5e5ea" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
                    <Text style={{ fontSize: 15, color: "#000" }}>When</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 14, color: "#8E8E93" }}>ASAP</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#C7C7CC" />
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#8E8E93" />
                    <Text style={{ fontSize: 15, color: "#000" }}>Location</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 14, color: "#8E8E93" }}>Current</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#C7C7CC" />
                  </View>
                </View>
              </View>

              {/* Review card */}
              {selectedCat && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#8E8E93", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>
                    Review
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: COLORS.red,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons name={selectedCat.icon} size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#000" }} numberOfLines={1}>
                        {title || "Your task"}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>
                        {selectedCat.label} · {paymentType === "cash" ? "Cash" : "Digital"} · ASAP
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom button */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8, backgroundColor: "#f2f2f7" }}>
          <Pressable
            onPress={step < 3 ? handleNext : handleSubmit}
            disabled={submitting || (step === 1 && !category)}
            style={{
              backgroundColor: (step === 1 && !category) ? "#C7C7CC" : COLORS.red,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              {submitting
                ? "Posting…"
                : step < 3
                  ? "Continue"
                  : budget
                    ? `Post task — €${budget}`
                    : "Post task"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
