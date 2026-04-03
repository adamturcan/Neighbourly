import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store/useAuth";
import { useQuery } from "@tanstack/react-query";
import { listMyTasks } from "../../../shared/lib/api";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Task } from "../../../shared/types";

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  matched: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#6B7280",
  disputed: "#EF4444",
};

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const nav = useNavigation<any>();

  const { data: myTasks = [] } = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: listMyTasks,
    enabled: !!user,
  });

  const postedTasks = myTasks.filter((t) => t.requesterId === user?.id);
  const helperTasks = myTasks.filter((t) => t.helperId === user?.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-8 pb-12 gap-6">
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
            <Text className="text-xl font-bold">
              {profile?.rating?.toFixed(1) ?? "–"}
            </Text>
            <Text className="text-xs text-text-muted">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold">{profile?.jobs_done ?? 0}</Text>
            <Text className="text-xs text-text-muted">Jobs</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold">{postedTasks.length}</Text>
            <Text className="text-xs text-text-muted">Posted</Text>
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

        {/* My Tasks (posted) */}
        {postedTasks.length > 0 && (
          <TaskSection
            title="My tasks"
            tasks={postedTasks}
            onPress={(t) =>
              nav.getParent()?.navigate("Discover", {
                screen: "TaskDetail",
                params: { taskId: t.id },
              })
            }
          />
        )}

        {/* Helping on */}
        {helperTasks.length > 0 && (
          <TaskSection
            title="Helping on"
            tasks={helperTasks}
            onPress={(t) =>
              nav.getParent()?.navigate("Discover", {
                screen: "TaskDetail",
                params: { taskId: t.id },
              })
            }
          />
        )}

        {/* Logout */}
        <Pressable
          onPress={signOut}
          className="border border-gray-300 rounded-2xl py-4 items-center mt-4"
        >
          <Text className="text-brand-red font-bold text-base">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskSection({
  title,
  tasks,
  onPress,
}: {
  title: string;
  tasks: Task[];
  onPress: (t: Task) => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-black">{title}</Text>
      {tasks.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => onPress(t)}
          className="p-4 rounded-2xl bg-surface-dim flex-row items-center gap-3"
        >
          <View className="flex-1">
            <Text className="font-bold text-black" numberOfLines={1}>
              {t.title}
            </Text>
            <Text className="text-sm text-text-muted mt-0.5">
              €{t.budget} · {t.category}
            </Text>
          </View>
          <View
            className="px-2.5 py-1 rounded-full"
            style={{
              backgroundColor:
                (STATUS_COLORS[t.status] ?? "#6B7280") + "20",
            }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: STATUS_COLORS[t.status] ?? "#6B7280" }}
            >
              {t.status.replace("_", " ")}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
