import React, { useRef, useState } from "react";
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
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { createTask } from "../../../shared/lib/api";
import { COLORS } from "../../../shared/lib/constants";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";

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
const TOTAL_STEPS = 3;

export default function PostTaskScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnims = useRef([0, 1, 2].map((i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const selectedCat = CATEGORIES.find((c) => c.key === category);

  const animateStep = (to: number) => {
    const from = step;
    const dir = to > from ? 1 : -1;

    // Animate progress bars
    progressAnims.forEach((anim, i) => {
      Animated.timing(anim, { toValue: i < to ? 1 : i === to ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    });

    // Slide out
    Animated.timing(slideAnim, { toValue: -dir * 300, duration: 180, useNativeDriver: true }).start(() => {
      setStep(to);
      slideAnim.setValue(dir * 300);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
    });
  };

  const handleNext = () => {
    if (step === 0 && !category) { Alert.alert("Pick a category"); return; }
    if (step === 1) {
      if (title.trim().length < 3) { Alert.alert("Title too short", "At least 3 characters"); return; }
      if (description.trim().length < 5) { Alert.alert("Add a description", "At least 5 characters"); return; }
    }
    animateStep(step + 1);
  };

  const handleBack = () => {
    if (step <= 0) return;
    animateStep(step - 1);
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(successOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setShowSuccess(false);
          setCategory(""); setTitle(""); setDescription(""); setBudget(""); setPaymentType("cash");
          setStep(0);
          slideAnim.setValue(0);
          progressAnims.forEach((a, i) => a.setValue(i === 0 ? 1 : 0));
          nav.navigate("Discover");
        });
      }, 1500);
    });
  };

  const handleSubmit = async () => {
    if (!Number(budget) || Number(budget) < 1) { Alert.alert("Set a budget", "At least €1"); return; }
    setSubmitting(true);
    try {
      await createTask({ title: title.trim(), description: description.trim(), category, budget: Number(budget), payment_type: paymentType, lat: 48.1482, lng: 17.1067 });
      setSubmitting(false);
      showSuccessAnimation();
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Nav */}
        <View style={st.nav}>
          {step > 0 ? (
            <Pressable onPress={handleBack} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={26} color="#000" />
            </Pressable>
          ) : <View style={{ width: 26 }} />}
          <Text style={st.navTitle}>New Task</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Progress bar */}
        <View style={st.progressRow}>
          {progressAnims.map((anim, i) => (
            <View key={i} style={st.progressTrack}>
              <Animated.View style={[st.progressFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
            </View>
          ))}
        </View>

        {/* Animated step content (no swipe) */}
        <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              <View>
                <Text style={st.heading}>What do you{"\n"}need help with?</Text>
                <Text style={st.sub}>Choose a category</Text>
                <View style={{ gap: 6 }}>
                  {CATEGORIES.map((cat) => {
                    const on = category === cat.key;
                    return (
                      <Pressable key={cat.key} onPress={() => setCategory(cat.key)}
                        style={[st.catRow, on && { backgroundColor: "#FEF2F2", borderColor: COLORS.red }]}>
                        <View style={[st.catIcon, { backgroundColor: on ? COLORS.red : cat.bg }]}>
                          <MaterialCommunityIcons name={cat.icon} size={20} color={on ? "#fff" : cat.fg} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[st.catLabel, on && { color: COLORS.red }]}>{cat.label}</Text>
                          <Text style={st.catDesc}>{cat.desc}</Text>
                        </View>
                        {on && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.red} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 1 && (
              <View>
                {selectedCat && (
                  <View style={st.chip}>
                    <MaterialCommunityIcons name={selectedCat.icon} size={14} color={COLORS.red} />
                    <Text style={st.chipText}>{selectedCat.label}</Text>
                  </View>
                )}
                <Text style={st.heading}>Describe your task</Text>
                <View style={{ gap: 16, marginTop: 20 }}>
                  <View>
                    <Text style={st.inputLabel}>Title</Text>
                    <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Deep clean my apartment"
                      style={st.input} placeholderTextColor="#C7C7CC" />
                  </View>
                  <View>
                    <Text style={st.inputLabel}>Description</Text>
                    <TextInput value={description} onChangeText={setDescription} placeholder="Add details — when, where, what's needed…"
                      multiline numberOfLines={4} style={[st.input, { minHeight: 110, textAlignVertical: "top", lineHeight: 22 }]} placeholderTextColor="#C7C7CC" />
                  </View>
                  <View>
                    <Text style={st.inputLabel}>Photos <Text style={{ color: "#C7C7CC", fontWeight: "400" }}>(optional)</Text></Text>
                    <Pressable style={st.photoAdd}>
                      <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#A1A1AA" />
                      <Text style={{ fontSize: 9, color: "#A1A1AA", fontWeight: "500" }}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                {selectedCat && (
                  <View style={st.summary}>
                    <View style={st.summaryIcon}>
                      <MaterialCommunityIcons name={selectedCat.icon} size={16} color="#fff" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#000" }} numberOfLines={1}>{title || "Your task"}</Text>
                      <Text style={{ fontSize: 11, color: "#A1A1AA" }}>{selectedCat.label}</Text>
                    </View>
                  </View>
                )}
                <Text style={st.heading}>Budget & details</Text>
                <View style={{ marginTop: 20 }}>
                  <Text style={st.inputLabel}>Your budget</Text>
                  <View style={st.budgetRow}>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: "#C7C7CC" }}>€</Text>
                    <TextInput value={budget} onChangeText={setBudget} placeholder="0" keyboardType="numeric"
                      style={{ fontSize: 20, fontWeight: "700", color: "#000", flex: 1 }} placeholderTextColor="#C7C7CC" />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 20 }}>
                  {PRICE_PRESETS.map((p) => {
                    const on = Number(budget) === p;
                    return (
                      <Pressable key={p} onPress={() => setBudget(String(p))}
                        style={[st.preset, on && { borderColor: COLORS.red, backgroundColor: "#FEF2F2" }]}>
                        <Text style={[st.presetText, on && { color: COLORS.red }]}>€{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={st.settingsGroup}>
                  <Pressable onPress={() => setPaymentType(paymentType === "cash" ? "digital" : "cash")} style={[st.settingsRow, st.settingsBorder]}>
                    <View style={st.settingsLeft}>
                      <MaterialCommunityIcons name="cash-multiple" size={20} color="#A1A1AA" />
                      <Text style={st.settingsLabel}>Payment</Text>
                    </View>
                    <View style={st.settingsRight}>
                      <Text style={st.settingsValue}>{paymentType === "cash" ? "Cash" : "Digital"}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                    </View>
                  </Pressable>
                  <View style={[st.settingsRow, st.settingsBorder]}>
                    <View style={st.settingsLeft}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#A1A1AA" />
                      <Text style={st.settingsLabel}>When</Text>
                    </View>
                    <View style={st.settingsRight}>
                      <Text style={st.settingsValue}>As soon as possible</Text>
                      <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                    </View>
                  </View>
                  <View style={st.settingsRow}>
                    <View style={st.settingsLeft}>
                      <MaterialCommunityIcons name="map-marker-outline" size={20} color="#A1A1AA" />
                      <Text style={st.settingsLabel}>Location</Text>
                    </View>
                    <View style={st.settingsRight}>
                      <Text style={st.settingsValue}>Current location</Text>
                      <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D1D6" />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}>
          <Pressable onPress={step < 2 ? handleNext : handleSubmit} disabled={submitting || (step === 0 && !category)}
            style={[st.cta, (step === 0 && !category) && { backgroundColor: "#D1D1D6" }]}>
            <Text style={st.ctaText}>
              {submitting ? "Posting…" : step < 2 ? "Continue" : "Post task"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      <Modal visible={showSuccess} transparent animationType="none">
        <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", opacity: successOpacity }}>
          <Animated.View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", gap: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 10, transform: [{ scale: successScale }] }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="check" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>Task posted!</Text>
            <Text style={{ fontSize: 14, color: "#71717A", textAlign: "center" }}>Helpers nearby will be notified</Text>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  nav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44 },
  navTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "600", color: "#000" },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "#E5E5EA", overflow: "hidden" as const },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: COLORS.red },
  heading: { fontSize: 22, fontWeight: "700", color: "#000", lineHeight: 28, marginTop: 4 },
  sub: { fontSize: 13, color: "#A1A1AA", marginTop: 2, marginBottom: 16 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E5EA", backgroundColor: "#fff" },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catLabel: { fontSize: 14, fontWeight: "600", color: "#000" },
  catDesc: { fontSize: 11, color: "#A1A1AA", marginTop: 1 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.red },
  inputLabel: { fontSize: 12, fontWeight: "500", color: "#71717A", marginBottom: 6 },
  input: { backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#000", fontWeight: "500" },
  photoAdd: { width: 68, height: 68, borderRadius: 12, borderWidth: 1, borderStyle: "dashed" as const, borderColor: "#D1D1D6", backgroundColor: "#FAFAFA", alignItems: "center", justifyContent: "center", gap: 2 },
  summary: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FAFAFA", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  summaryIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center" },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  preset: { height: 32, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#E5E5EA", alignItems: "center", justifyContent: "center" },
  presetText: { fontSize: 12, fontWeight: "600", color: "#71717A" },
  settingsGroup: { backgroundColor: "#F5F5F5", borderRadius: 12, overflow: "hidden" as const },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12 },
  settingsBorder: { borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA" },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  settingsLabel: { fontSize: 14, fontWeight: "500", color: "#000" },
  settingsValue: { fontSize: 13, fontWeight: "500", color: "#A1A1AA" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: "#F0F0F0", backgroundColor: "#fff" },
  cta: { backgroundColor: COLORS.red, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
