import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../shared/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type Props = {
  onOtpSent: (phone: string) => void;
  onBack: () => void;
  mode: "sign_in" | "sign_up";
};

export default function PhoneEntryScreen({ onOtpSent, onBack, mode }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleaned = phone.trim();
    if (cleaned.length < 8) {
      Alert.alert("Invalid phone", "Please enter a valid phone number with country code.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      onOtpSent(cleaned);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable onPress={onBack} className="px-4 py-3">
        <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
      </Pressable>

      <View className="flex-1 px-6 pt-8 gap-4">
        <Text className="text-3xl font-extrabold text-black">
          {mode === "sign_up" ? "Create account" : "Welcome back"}
        </Text>
        <Text className="text-text-muted text-base">
          Enter your phone number and we'll send you a verification code.
        </Text>

        <TextInput
          placeholder="+421 900 000 000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoFocus
          className="bg-surface-dim rounded-2xl px-4 py-4 text-lg mt-4"
          placeholderTextColor="#6B7280"
        />

        <Pressable
          onPress={handleSendOtp}
          disabled={loading || phone.trim().length < 8}
          className={`rounded-2xl py-4 items-center mt-2 ${
            phone.trim().length >= 8 ? "bg-brand-red" : "bg-gray-300"
          }`}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Sending…" : "Send code"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
