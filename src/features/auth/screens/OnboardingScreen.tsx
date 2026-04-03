import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../store/useAuth";
import { COLORS } from "../../../shared/lib/constants";

const ROLES = [
  { key: "seeker" as const, label: "I need help", icon: "hand-wave" as const, desc: "Find local helpers for your tasks" },
  { key: "helper" as const, label: "I want to help", icon: "hammer-wrench" as const, desc: "Earn money helping neighbours" },
  { key: "both" as const, label: "Both", icon: "swap-horizontal" as const, desc: "Help others and get help too" },
];

const SKILL_OPTIONS = [
  "cleaning", "gardening", "moving", "tutoring",
  "plumbing", "electrical", "painting", "car help",
];

export default function OnboardingScreen() {
  const { updateProfile, fetchProfile } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"seeker" | "helper" | "both">("both");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill],
    );
  };

  const handleFinish = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateProfile({
      full_name: name.trim(),
      role,
      skills: role !== "seeker" ? selectedSkills : [],
    });
    await fetchProfile();
    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-8 pb-12 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-extrabold text-black">
          Set up your profile
        </Text>

        {/* Name */}
        <View className="gap-2">
          <Text className="text-base font-bold text-black">Your name</Text>
          <TextInput
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            className="bg-surface-dim rounded-2xl px-4 py-4 text-base"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Role selection */}
        <View className="gap-2">
          <Text className="text-base font-bold text-black">
            What brings you here?
          </Text>
          <View className="gap-3">
            {ROLES.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => setRole(r.key)}
                className={`flex-row items-center gap-4 p-4 rounded-2xl border-2 ${
                  role === r.key
                    ? "border-brand-red bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    role === r.key ? "bg-brand-red" : "bg-surface-dim"
                  }`}
                >
                  <MaterialCommunityIcons
                    name={r.icon}
                    size={24}
                    color={role === r.key ? "#fff" : "#475569"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-black">
                    {r.label}
                  </Text>
                  <Text className="text-sm text-text-muted">{r.desc}</Text>
                </View>
                {role === r.key && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={COLORS.red}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Skills (only for helpers) */}
        {role !== "seeker" && (
          <View className="gap-2">
            <Text className="text-base font-bold text-black">
              Your skills (pick all that apply)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <Pressable
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`px-4 py-2.5 rounded-full border ${
                    selectedSkills.includes(skill)
                      ? "bg-brand-red border-brand-red"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      selectedSkills.includes(skill)
                        ? "text-white"
                        : "text-black"
                    }`}
                  >
                    {skill}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Submit */}
        <Pressable
          onPress={handleFinish}
          disabled={saving || !name.trim()}
          className={`rounded-2xl py-4 items-center mt-4 ${
            name.trim() ? "bg-brand-red" : "bg-gray-300"
          }`}
        >
          <Text className="text-white font-bold text-base">
            {saving ? "Saving…" : "Let's go"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
