import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { createService, updateService, getService } from "../../../shared/lib/api";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";

const { width: SCREEN_W } = Dimensions.get("window");

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning", color: "#E31B23" },
  { key: "gardening", label: "Gardening", color: "#16A34A" },
  { key: "moving", label: "Moving", color: "#2563EB" },
  { key: "chores", label: "Handyman", color: "#D97706" },
  { key: "tutoring", label: "Tutoring", color: "#7C3AED" },
  { key: "plumbing", label: "Plumbing", color: "#0891B2" },
  { key: "painting", label: "Painting", color: "#EA580C" },
  { key: "electrical", label: "Electrical", color: "#4B5563" },
];

export default function CreateServiceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const editId = route.params?.editId;
  const isEditing = !!editId;

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceType, setPriceType] = useState<"service" | "hourly">("service");

  // Load existing service data when editing
  useQuery({
    queryKey: ["service", editId],
    queryFn: async () => {
      const svc = await getService(editId!);
      if (svc) {
        setTitle(svc.title);
        setCategory(svc.categories[0] ?? null);
        setPriceFrom(String(svc.priceFrom));
        setLoaded(true);
      }
      return svc;
    },
    enabled: isEditing && !loaded,
  });

  const totalSteps = 3;

  const animateTo = (nextStep: number) => {
    const direction = nextStep > step ? -1 : 1;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction * SCREEN_W,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -direction * SCREEN_W,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  };

  const selectCategory = (key: string) => {
    setCategory((prev) => (prev === key ? null : key));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!title.trim()) { Alert.alert("Please enter a service title"); return false; }
      return true;
    }
    if (step === 1) {
      if (!category) { Alert.alert("Select a category"); return false; }
      if (!priceFrom || Number(priceFrom) <= 0) { Alert.alert("Enter a valid starting price"); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < totalSteps - 1) {
      animateTo(step + 1);
    } else {
      handlePublish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTo(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateService(editId!, {
          title: title.trim(),
          categories: category ? [category] : [],
          priceFrom: Number(priceFrom),
        });
      } else {
        await createService({
          title: title.trim(),
          description: description.trim() || undefined,
          categories: category ? [category] : [],
          priceFrom: Number(priceFrom),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setStep(3);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSubmitting(false);
  };

  // Success screen
  if (step === 3) {
    return (
      <SafeAreaView style={s.container} edges={["top", "bottom"]}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <MaterialCommunityIcons name="check" size={48} color="#fff" />
          </View>
          <Text style={s.successTitle}>{isEditing ? "Service Updated!" : "Service Published!"}</Text>
          <Text style={s.successSub}>Your service is now visible to seekers nearby</Text>
          <Pressable
            style={s.successBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.successBtnText}>View My Services</Text>
          </Pressable>
          <Pressable
            style={s.successSecondary}
            onPress={() => {
              setStep(0);
              setTitle("");
              setDescription("");
              setCategory(null);
              setPriceFrom("");
            }}
          >
            <Text style={s.successSecondaryText}>Add Another Service</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </Pressable>
        <Text style={s.stepText}>Step {step + 1} of {totalSteps}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>

      {/* Step Content */}
      <Animated.View style={[s.stepContent, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <>
              <Text style={s.stepTitle}>Tell us about your service</Text>
              <Text style={s.stepSub}>Give your service a clear title and description so seekers know what you offer.</Text>

              <View style={s.formGroup}>
                <Text style={s.label}>Service Title</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Garden Maintenance & Cleanup"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>Description (optional)</Text>
                <TextInput
                  style={[s.input, s.textarea]}
                  placeholder="Describe what you offer, your experience, what's included..."
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={s.stepTitle}>What do you offer?</Text>
              <Text style={s.stepSub}>Select categories and set your starting price.</Text>

              <Text style={[s.label, { marginBottom: 12 }]}>Category</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      style={[s.catOpt, selected && s.catOptSelected]}
                      onPress={() => selectCategory(cat.key)}
                    >
                      <View style={[s.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[s.catName, selected && { color: COLORS.red }]}>{cat.label}</Text>
                      {selected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.red} style={{ marginLeft: "auto" }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View style={[s.formGroup, { marginTop: 24 }]}>
                <Text style={s.label}>Starting Price (€)</Text>
                <View style={s.priceRow}>
                  <View style={s.priceInput}>
                    <Text style={s.euro}>€</Text>
                    <TextInput
                      style={s.priceField}
                      placeholder="0"
                      placeholderTextColor="#D1D5DB"
                      value={priceFrom}
                      onChangeText={setPriceFrom}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={s.priceTypeRow}>
                  <Pressable
                    style={[s.priceTypeBtn, priceType === "service" && s.priceTypeBtnActive]}
                    onPress={() => setPriceType("service")}
                  >
                    <Text style={[s.priceTypeText, priceType === "service" && s.priceTypeTextActive]}>Per service</Text>
                  </Pressable>
                  <Pressable
                    style={[s.priceTypeBtn, priceType === "hourly" && s.priceTypeBtnActive]}
                    onPress={() => setPriceType("hourly")}
                  >
                    <Text style={[s.priceTypeText, priceType === "hourly" && s.priceTypeTextActive]}>Per hour</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={s.stepTitle}>Review & Publish</Text>
              <Text style={s.stepSub}>Review your service before publishing.</Text>

              <View style={s.previewCard}>
                <View style={s.previewHeader}>
                  <Text style={s.previewTitle}>{title}</Text>
                  <Text style={s.previewPrice}>From €{priceFrom}{priceType === "hourly" ? "/hr" : ""}</Text>
                </View>
                {description ? (
                  <Text style={s.previewDesc}>{description}</Text>
                ) : null}
                {category && (
                  <View style={s.previewCats}>
                    <View style={[s.previewCat, { backgroundColor: (CATEGORY_COLORS[category] ?? "#6B7280") + "18" }]}>
                      <Text style={[s.previewCatText, { color: CATEGORY_COLORS[category] ?? "#6B7280" }]}>{category}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={s.checkList}>
                <CheckItem label="Service title" done={!!title.trim()} />
                <CheckItem label="Category selected" done={!!category} />
                <CheckItem label="Price set" done={!!priceFrom && Number(priceFrom) > 0} />
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom Button */}
      <View style={s.bottomBar}>
        <Pressable
          style={[s.nextBtn, submitting && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={submitting}
        >
          <Text style={s.nextBtnText}>
            {submitting
              ? "Publishing..."
              : step === totalSteps - 1
              ? "Publish Service"
              : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={s.checkItem}>
      <MaterialCommunityIcons
        name={done ? "check-circle" : "circle-outline"}
        size={20}
        color={done ? "#22C55E" : "#D1D5DB"}
      />
      <Text style={[s.checkLabel, done && { color: "#000" }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  stepText: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  progressBar: {
    height: 3,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 24,
  },
  progressFill: { height: "100%", backgroundColor: COLORS.red, borderRadius: 2 },
  stepContent: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: "800", color: "#000", marginBottom: 8 },
  stepSub: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 24 },
  // Form
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#000",
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  // Categories
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    width: "48%",
  },
  catOptSelected: { borderColor: COLORS.red, backgroundColor: "#FEF2F2" },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catName: { fontSize: 14, fontWeight: "600", color: "#374151" },
  // Price
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  priceInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  euro: { fontSize: 18, fontWeight: "700", color: "#374151", marginRight: 8 },
  priceField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  priceTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  priceTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  priceTypeBtnActive: {
    borderColor: COLORS.red,
    backgroundColor: "#FEF2F2",
  },
  priceTypeText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  priceTypeTextActive: { color: COLORS.red },
  // Preview
  previewCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  previewTitle: { fontSize: 17, fontWeight: "700", color: "#000", flex: 1, marginRight: 12 },
  previewPrice: { fontSize: 15, fontWeight: "700", color: COLORS.red },
  previewDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 10 },
  previewCats: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewCat: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  previewCatText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  // Checklist
  checkList: { gap: 12 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkLabel: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
  // Bottom
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  nextBtn: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Success
  successScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#000" },
  successSub: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  successBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
    marginTop: 20,
  },
  successBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successSecondary: { padding: 12 },
  successSecondaryText: { color: "#6B7280", fontSize: 14, fontWeight: "500" },
});
