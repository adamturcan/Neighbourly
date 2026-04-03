import React, { useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "../../../shared/lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });
        if (error) Alert.alert("Sign in error", error.message);
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Error", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Google sign-in via Supabase OAuth redirect
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "neighbourly://auth/callback",
      },
    });
    setLoading(false);
    if (error) Alert.alert("Sign in error", error.message);
  };

  const handleEmailSignIn = async () => {
    // For dev/testing: magic link via email
    Alert.prompt(
      "Sign in with email",
      "Enter your email to receive a magic link",
      async (email) => {
        if (!email?.trim()) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });
        setLoading(false);
        if (error) {
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Check your email", "We sent you a magic link to sign in.");
        }
      },
    );
  };

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

        {/* Sign-in buttons */}
        <View className="w-full gap-3 mt-8">
          {/* Apple Sign In */}
          {Platform.OS === "ios" && (
            <Pressable
              onPress={handleAppleSignIn}
              disabled={loading}
              className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3"
            >
              <MaterialCommunityIcons name="apple" size={22} color="#000" />
              <Text className="text-black font-bold text-base">
                Continue with Apple
              </Text>
            </Pressable>
          )}

          {/* Google Sign In */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3"
          >
            <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
            <Text className="text-black font-bold text-base">
              Continue with Google
            </Text>
          </Pressable>

          {/* Email magic link (for testing) */}
          <Pressable
            onPress={handleEmailSignIn}
            disabled={loading}
            className="border border-gray-600 rounded-2xl py-4 flex-row items-center justify-center gap-3"
          >
            <MaterialCommunityIcons name="email-outline" size={22} color="#fff" />
            <Text className="text-white font-bold text-base">
              Continue with Email
            </Text>
          </Pressable>
        </View>

        {loading && (
          <Text className="text-gray-500 text-sm mt-2">Signing in…</Text>
        )}
      </View>

      <Text className="text-gray-600 text-xs text-center pb-4 px-8">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
}
