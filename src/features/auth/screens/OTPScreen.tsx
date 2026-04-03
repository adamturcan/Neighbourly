import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../shared/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type Props = {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
};

export default function OTPScreen({ phone, onVerified, onBack }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Verification failed", error.message);
    } else {
      onVerified();
    }
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Code resent", "Check your messages.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable onPress={onBack} className="px-4 py-3">
        <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
      </Pressable>

      <View className="flex-1 px-6 pt-8 gap-4">
        <Text className="text-3xl font-extrabold text-black">
          Enter the code
        </Text>
        <Text className="text-text-muted text-base">
          We sent a 6-digit code to {phone}
        </Text>

        <TextInput
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          className="bg-surface-dim rounded-2xl px-4 py-4 text-2xl text-center tracking-[12px] mt-4"
          placeholderTextColor="#6B7280"
        />

        <Pressable
          onPress={handleVerify}
          disabled={loading || code.length < 6}
          className={`rounded-2xl py-4 items-center mt-2 ${
            code.length >= 6 ? "bg-brand-red" : "bg-gray-300"
          }`}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Verifying…" : "Verify"}
          </Text>
        </Pressable>

        <Pressable onPress={handleResend} className="items-center mt-4">
          <Text className="text-brand-red font-bold">Resend code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
