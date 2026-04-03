import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../../shared/lib/constants";

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export default function WelcomeScreen({ onSignIn, onSignUp }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 justify-center items-center px-8 gap-6">
        {/* Logo / Branding */}
        <View className="w-20 h-20 rounded-full bg-brand-red items-center justify-center mb-4">
          <MaterialCommunityIcons name="handshake" size={44} color="#fff" />
        </View>

        <Text className="text-4xl font-extrabold text-white text-center">
          Neighbourly
        </Text>
        <Text className="text-base text-gray-400 text-center leading-6">
          Hyper-local help from your neighbours.{"\n"}
          Find help or earn by helping others.
        </Text>

        {/* CTA Buttons */}
        <View className="w-full gap-3 mt-8">
          <Pressable
            onPress={onSignUp}
            className="bg-brand-red rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Get started</Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            className="border border-gray-600 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>

      <Text className="text-gray-600 text-xs text-center pb-4 px-8">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
}
