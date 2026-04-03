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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { createTask } from "../../../shared/lib/api";
import { COLORS } from "../../../shared/lib/constants";

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning", desc: "Home, office, deep clean", icon: "broom" as const, bg: "#FEF2F2", fg: "#E31B23" },
  { key: "gardening", label: "Garden", desc: "Mowing, trimming, planting", icon: "flower-outline" as const, bg: "#F0FDF4", fg: "#16A34A" },
  { key: "moving", label: "Moving", desc: "Furniture, boxes, transport", icon: "truck-outline" as const, bg: "#EFF6FF", fg: "#2563EB" },
  { key: "tutoring", label: "Tutoring", desc: "Math, languages, music", icon: "school-outline" as const, bg: "#F5F3FF", fg: "#7C3AED" },
  { key: "plumbing", label: "Plumbing", desc: "Leaks, pipes, installation", icon: "pipe-wrench" as const, bg: "#ECFEFF", fg: "#0891B2" },
  { key: "electrical", label: "Electrical", desc: "Wiring, outlets, fixtures", icon: "flash-outline" as const, bg: "#FFFBEB", fg: "#D97706" },
  { key: "painting", label: "Painting", desc: "Walls, furniture, exterior", icon: "format-paint" as const, bg: "#FFF7ED", fg: "#EA580C" },
  { key: "car", label: "Car help", desc: "Jump start, wash, tyre", icon: "car-outline" as const, bg: "#FFF1F2", fg: "#E11D48" },
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
    if (step === 1 && !category) { Alert.alert("Pick a category"); return; }
    if (step === 2) {
      if (title.trim().length < 3) { Alert.alert("Title too short", "At least 3 characters"); return; }
      if (description.trim().length < 5) { Alert.alert("Add a description", "At least 5 characters"); return; }
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const handleSubmit = async () => {
    if (!Number(budget) || Number(budget) < 1) { Alert.alert("Set a budget", "At least €1"); return; }
    setSubmitting(true);
    try {
      await createTask({ title: title.trim(), description: description.trim(), category, budget: Number(budget), payment_type: paymentType, lat: 48.1482, lng: 17.1067 });
      Alert.alert("Task posted!", "Helpers nearby will see your task.");
      setStep(1); setCategory(""); setTitle(""); setDescription(""); setBudget(""); setPaymentType("cash");
    } catch (e: any) { Alert.alert("Error", e.message); }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Nav */}
        <View style={s.nav}>
          {step > 1 ? (
            <Pressable onPress={() => setStep((prev) => (prev - 1) as Step)} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={26} color="#000" />
            </Pressable>
          ) : <View style={{ width: 26 }} />}
          <Text style={s.navTitle}>New Task</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Progress */}
        <View style={s.progressRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[s.progressSeg, { backgroundColor: i <= step ? COLORS.red : "#E5E5EA" }]} />
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">

          {/* ========== STEP 1 ========== */}
          {step === 1 && (
            <View>
              <Text style={s.heading}>What do you{"\n"}need help with?</Text>
              <Text style={s.sub}>Choose a category</Text>
              <View style={{ gap: 6 }}>
                {CATEGORIES.map((cat) => {
                  const on = category === cat.key;
                  return (
                    <Pressable key={cat.key} onPress={() => setCategory(cat.key)}
                      style={[s.catRow, on && { backgroundColor: "#FEF2F2", borderColor: COLORS.red }]}>
                      <View style={[s.catIcon, { backgroundColor: on ? COLORS.red : cat.bg }]}>
                        <MaterialCommunityIcons name={cat.icon} size={20} color={on ? "#fff" : cat.fg} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.catLabel, on && { color: COLORS.red }]}>{cat.label}</Text>
                        <Text style={s.catDesc}>{cat.desc}</Text>
                      </View>
                      {on && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.red} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ========== STEP 2 ========== */}
          {step === 2 && (
            <View>
              {/* Category chip */}
              {selectedCat && (
                <View style={s.chip}>
                  <MaterialCommunityIcons name={selectedCat.icon} size={14} color={COLORS.red} />
                  <Text style={s.chipText}>{selectedCat.label}</Text>
                </View>
              )}
              <Text style={s.heading}>Describe your task</Text>
              <View style={{ gap: 16, marginTop: 20 }}>
                <View>
                  <Text style={s.inputLabel}>Title</Text>
                  <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Deep clean my apartment"
                    style={s.input} placeholderTextColor="#C7C7CC" />
                </View>
                <View>
                  <Text style={s.inputLabel}>Description</Text>
                  <TextInput value={description} onChangeText={setDescription} placeholder="Add details — when, where, what's needed…"
                    multiline numberOfLines={4} style={[s.input, { minHeight: 110, textAlignVertical: "top", lineHeight: 22 }]} placeholderTextColor="#C7C7CC" />
                </View>
                <View>
                  <Text style={s.inputLabel}>Photos <Text style={{ color: "#C7C7CC", fontWeight: "400" }}>(optional)</Text></Text>
                  <Pressable style={s.photoAdd}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#A1A1AA" />
                    <Text style={{ fontSize: 9, color: "#A1A1AA", fontWeight: "500" }}>Add</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ========== STEP 3 ========== */}
          {step === 3 && (
            <View>
              {/* Summary */}
              {selectedCat && (
                <View style={s.summary}>
                  <View style={s.summaryIcon}>
                    <MaterialCommunityIcons name={selectedCat.icon} size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#000" }} numberOfLines={1}>{title || "Your task"}</Text>
                    <Text style={{ fontSize: 11, color: "#A1A1AA" }}>{selectedCat.label}</Text>
                  </View>
                </View>
              )}

              <Text style={s.heading}>Budget & details</Text>

              {/* Budget input */}
              <View style={{ marginTop: 20 }}>
                <Text style={s.inputLabel}>Your budget</Text>
                <View style={s.budgetRow}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#C7C7CC" }}>€</Text>
                  <TextInput value={budget} onChangeText={setBudget} placeholder="0" keyboardType="numeric"
                    style={{ fontSize: 20, fontWeight: "700", color: "#000", flex: 1 }} placeholderTextColor="#C7C7CC" />
                </View>
              </View>

              {/* Presets */}
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 20 }}>
                {PRICE_PRESETS.map((p) => {
                  const on = Number(budget) === p;
                  return (
                    <Pressable key={p} onPress={() => setBudget(String(p))}
                      style={[s.preset, on && { borderColor: COLORS.red, backgroundColor: "#FEF2F2" }]}>
                      <Text style={[s.presetText, on && { color: COLORS.red }]}>€{p}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Settings group */}
              <View style={s.settingsGroup}>
                <Pressable onPress={() => setPaymentType(paymentType === "cash" ? "digital" : "cash")} style={[s.settingsRow, s.settingsBorder]}>
                  <View style={s.settingsLeft}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color="#A1A1AA" />
                    <Text style={s.settingsLabel}>Payment</Text>
                  </View>
                  <View style={s.settingsRight}>
                    <Text style={s.settingsValue}>{paymentType === "cash" ? "Cash" : "Digital"}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                  </View>
                </Pressable>
                <View style={[s.settingsRow, s.settingsBorder]}>
                  <View style={s.settingsLeft}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#A1A1AA" />
                    <Text style={s.settingsLabel}>When</Text>
                  </View>
                  <View style={s.settingsRight}>
                    <Text style={s.settingsValue}>As soon as possible</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                  </View>
                </View>
                <View style={s.settingsRow}>
                  <View style={s.settingsLeft}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#A1A1AA" />
                    <Text style={s.settingsLabel}>Location</Text>
                  </View>
                  <View style={s.settingsRight}>
                    <Text style={s.settingsValue}>Current location</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.bottomBar}>
          <Pressable onPress={step < 3 ? handleNext : handleSubmit} disabled={submitting || (step === 1 && !category)}
            style={[s.cta, (step === 1 && !category) && { backgroundColor: "#D1D1D6" }]}>
            <Text style={s.ctaText}>
              {submitting ? "Posting…" : step < 3 ? "Continue" : budget ? `Post task` : "Post task"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  nav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44 },
  navTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "600", color: "#000" },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2 },
  heading: { fontSize: 22, fontWeight: "700", color: "#000", lineHeight: 28, marginTop: 4 },
  sub: { fontSize: 13, color: "#A1A1AA", marginTop: 2, marginBottom: 16 },

  // Category list
  catRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E5EA", backgroundColor: "#fff" },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catLabel: { fontSize: 14, fontWeight: "600", color: "#000" },
  catDesc: { fontSize: 11, color: "#A1A1AA", marginTop: 1 },

  // Chip
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.red },

  // Inputs
  inputLabel: { fontSize: 12, fontWeight: "500", color: "#71717A", marginBottom: 6 },
  input: { backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#000", fontWeight: "500" },

  // Photo
  photoAdd: { width: 68, height: 68, borderRadius: 12, borderWidth: 1, borderStyle: "dashed" as const, borderColor: "#D1D1D6", backgroundColor: "#FAFAFA", alignItems: "center", justifyContent: "center", gap: 2 },

  // Summary
  summary: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FAFAFA", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  summaryIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center" },

  // Budget
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  preset: { height: 32, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#E5E5EA", alignItems: "center", justifyContent: "center" },
  presetText: { fontSize: 12, fontWeight: "600", color: "#71717A" },

  // Settings
  settingsGroup: { backgroundColor: "#F5F5F5", borderRadius: 12, overflow: "hidden" as const },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12 },
  settingsBorder: { borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA" },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  settingsLabel: { fontSize: 14, fontWeight: "500", color: "#000" },
  settingsValue: { fontSize: 13, fontWeight: "500", color: "#A1A1AA" },

  // Bottom
  bottomBar: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: "#F0F0F0", backgroundColor: "#fff" },
  cta: { backgroundColor: COLORS.red, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
