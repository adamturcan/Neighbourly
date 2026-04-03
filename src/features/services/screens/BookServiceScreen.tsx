import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getService, getPublicProfile, createTask } from "../../../shared/lib/api";
import { useAuth } from "../../auth/store/useAuth";
import { COLORS, CATEGORY_COLORS } from "../../../shared/lib/constants";
import StarRating from "../../../shared/components/StarRating";

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function getNextDays(count: number) {
  const days: { label: string; date: Date; dateStr: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({
      label: dayName,
      date: d,
      dateStr: d.toISOString().split("T")[0],
    });
  }
  return days;
}

export default function BookServiceScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const serviceId = route.params?.serviceId as string;

  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });

  const { data: provider } = useQuery({
    queryKey: ["publicProfile", service?.providerId],
    queryFn: () => getPublicProfile(service!.providerId),
    enabled: !!service?.providerId,
  });

  const days = useMemo(() => getNextDays(7), []);
  const [selectedDay, setSelectedDay] = useState(1); // default tomorrow
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (!service) return;
    setSubmitting(true);
    try {
      // Create a task as a booking request linked to this service
      const scheduledDate = new Date(`${days[selectedDay].dateStr}T${selectedTime}:00`);
      await createTask({
        title: `Booking: ${service.title}`,
        description: note.trim() || `Booking request for ${service.title}`,
        category: service.categories[0] ?? "other",
        budget: service.priceFrom,
        lat: service.lat || profile?.lat || 0,
        lng: service.lng || profile?.lng || 0,
        scheduled_at: scheduledDate.toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      Alert.alert(
        "Request Sent!",
        `${provider?.name ?? "The provider"} will review your booking request and accept or decline.`,
        [{ text: "OK", onPress: () => nav.goBack() }],
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSubmitting(false);
  };

  if (!service) return null;

  const avatarColor = "#2563EB";
  const initial = (provider?.name ?? "S").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.topBar}>
          <Pressable onPress={() => nav.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </Pressable>
          <Text style={s.topTitle}>Request Booking</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Provider + Service info */}
        <View style={s.providerCard}>
          <View style={[s.provAvatar, { backgroundColor: avatarColor }]}>
            <Text style={s.provAvatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.provServiceName}>{service.title}</Text>
            <Text style={s.provMeta}>
              by {provider?.name ?? "Provider"} · ★ {service.rating.toFixed(1)} · {service.jobsDone} jobs
            </Text>
          </View>
        </View>

        {/* Date Picker */}
        <Text style={s.sectionLabel}>Select a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.daysScroll}>
          {days.map((day, i) => (
            <Pressable
              key={day.dateStr}
              style={[s.dayOpt, selectedDay === i && s.dayOptActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[s.dayLabel, selectedDay === i && s.dayLabelActive]}>{day.label}</Text>
              <Text style={[s.dayNum, selectedDay === i && s.dayNumActive]}>{day.date.getDate()}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Time Slots */}
        <Text style={s.sectionLabel}>Preferred time</Text>
        <View style={s.timeSlotsWrap}>
          {TIME_SLOTS.map((time) => (
            <Pressable
              key={time}
              style={[s.timeSlot, selectedTime === time && s.timeSlotActive]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[s.timeSlotText, selectedTime === time && s.timeSlotTextActive]}>{time}</Text>
            </Pressable>
          ))}
        </View>

        {/* Note */}
        <Text style={s.sectionLabel}>Add a note (optional)</Text>
        <TextInput
          style={s.noteInput}
          placeholder="Describe what you need, any details for the provider..."
          placeholderTextColor="#9CA3AF"
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        {/* Price Summary */}
        <View style={s.priceSummary}>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Service starting price</Text>
            <Text style={s.priceVal}>€{service.priceFrom}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Date</Text>
            <Text style={s.priceVal}>
              {days[selectedDay].date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Time</Text>
            <Text style={s.priceVal}>{selectedTime}</Text>
          </View>
          <View style={[s.priceRow, s.priceTotal]}>
            <Text style={s.priceTotalLabel}>Estimated Total</Text>
            <Text style={s.priceTotalVal}>€{service.priceFrom}</Text>
          </View>
        </View>

        {/* Info note */}
        <View style={s.infoNote}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#2563EB" />
          <Text style={s.infoNoteText}>
            This sends a request to the provider. They'll review and accept or decline. You'll be notified.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          style={[s.submitBtn, submitting && { opacity: 0.5 }]}
          onPress={handleRequest}
          disabled={submitting}
        >
          <Text style={s.submitBtnText}>{submitting ? "Sending..." : "Send Booking Request"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  // Provider
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 0,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
  },
  provAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  provAvatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  provServiceName: { fontSize: 16, fontWeight: "700", color: "#000" },
  provMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  // Section
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  // Days
  daysScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  dayOpt: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  dayOptActive: { borderColor: COLORS.red, backgroundColor: "#FEF2F2" },
  dayLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  dayLabelActive: { color: COLORS.red },
  dayNum: { fontSize: 20, fontWeight: "800", color: "#000", marginTop: 2 },
  dayNumActive: { color: COLORS.red },
  // Time
  timeSlotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  timeSlotActive: { borderColor: COLORS.red, backgroundColor: "#FEF2F2" },
  timeSlotText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  timeSlotTextActive: { color: COLORS.red },
  // Note
  noteInput: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#000",
    minHeight: 80,
    marginBottom: 20,
  },
  // Price
  priceSummary: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 13, color: "#6B7280" },
  priceVal: { fontSize: 13, fontWeight: "600", color: "#000" },
  priceTotal: {
    borderTopWidth: 1.5,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 10,
  },
  priceTotalLabel: { fontSize: 14, fontWeight: "700", color: "#000" },
  priceTotalVal: { fontSize: 18, fontWeight: "800", color: COLORS.red },
  // Info
  infoNote: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    marginBottom: 20,
  },
  infoNoteText: { flex: 1, fontSize: 12, color: "#1E40AF", lineHeight: 18 },
  // Submit
  submitBtn: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
