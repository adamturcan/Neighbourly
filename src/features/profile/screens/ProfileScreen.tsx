import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store/useAuth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-8 gap-6">
        {/* Profile header */}
        <View className="items-center gap-3">
          <View className="w-20 h-20 rounded-full bg-surface-dim items-center justify-center">
            <MaterialCommunityIcons name="account" size={40} color="#6B7280" />
          </View>
          <Text className="text-2xl font-extrabold text-black">
            {profile?.full_name ?? "User"}
          </Text>
          <Text className="text-text-muted capitalize">
            {profile?.role ?? "member"}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-center gap-8">
          <View className="items-center">
            <Text className="text-xl font-bold">{profile?.rating?.toFixed(1) ?? "–"}</Text>
            <Text className="text-xs text-text-muted">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold">{profile?.jobs_done ?? 0}</Text>
            <Text className="text-xs text-text-muted">Jobs</Text>
          </View>
        </View>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold text-black">Skills</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.skills.map((s) => (
                <View key={s} className="bg-red-100 rounded-full px-3 py-1.5">
                  <Text className="text-brand-red font-bold text-sm">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="flex-1" />

        {/* Logout */}
        <Pressable
          onPress={signOut}
          className="border border-gray-300 rounded-2xl py-4 items-center mb-8"
        >
          <Text className="text-brand-red font-bold text-base">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
