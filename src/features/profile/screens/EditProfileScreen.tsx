import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../auth/store/useAuth";
import { COLORS } from "../../../shared/lib/constants";

const ALL_SKILLS = [
  "gardening", "cleaning", "handyman", "moving", "painting",
  "plumbing", "electrical", "cooking", "tutoring", "pet care",
  "delivery", "assembly",
];

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        bio: bio.trim() || null,
        skills,
      });
      Alert.alert("Profile updated!", "", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself..."
          placeholderTextColor="#9CA3AF"
          multiline
        />

        <Text style={styles.label}>Skills</Text>
        <View style={styles.skillsWrap}>
          {ALL_SKILLS.map((skill) => {
            const selected = skills.includes(skill);
            return (
              <Pressable
                key={skill}
                onPress={() => toggleSkill(skill)}
                style={[styles.skillChip, selected && styles.skillChipActive]}
              >
                <Text
                  style={[styles.skillText, selected && styles.skillTextActive]}
                >
                  {skill}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 40, gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#000",
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  skillChipActive: {
    borderColor: COLORS.red,
    backgroundColor: "#FEF2F2",
  },
  skillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    textTransform: "capitalize",
  },
  skillTextActive: {
    color: COLORS.red,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
