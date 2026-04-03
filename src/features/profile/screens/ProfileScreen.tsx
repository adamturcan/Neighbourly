import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyTasks, listMyOffers } from "../../../shared/lib/api";
import { useNavigation, useFocusEffect, CommonActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Task } from "../../../shared/types";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { COLORS } from "../../../shared/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  matched: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#6B7280",
  disputed: "#EF4444",
  pending: "#F59E0B",
  accepted: "#22C55E",
  rejected: "#EF4444",
};

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const nav = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: myTasks = [] } = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: listMyTasks,
    enabled: !!user,
  });

  const { data: myOffers = [] } = useQuery({
    queryKey: ["offers", "mine"],
    queryFn: listMyOffers,
    enabled: !!user,
  });

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["offers", "mine"] });
    }, [queryClient]),
  );

  const postedTasks = myTasks.filter((t) => t.requesterId === user?.id);
  const helperTasks = myTasks.filter((t) => t.helperId === user?.id);

  const goToTask = (taskId: string) => {
    nav.dispatch(
      CommonActions.navigate({
        name: "Discover",
        params: { screen: "TaskDetail", params: { taskId } },
      }),
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: TAB_BAR_HEIGHT + 24, gap: 24 }}>
        {/* Profile header */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="account" size={40} color="#6B7280" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#000" }}>
            {profile?.full_name ?? "User"}
          </Text>
          <Text style={{ fontSize: 14, color: "#A1A1AA", textTransform: "capitalize" }}>
            {profile?.role ?? "member"}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 32 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{profile?.rating?.toFixed(1) ?? "–"}</Text>
            <Text style={{ fontSize: 11, color: "#A1A1AA" }}>Rating</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{profile?.jobs_done ?? 0}</Text>
            <Text style={{ fontSize: 11, color: "#A1A1AA" }}>Jobs</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{postedTasks.length}</Text>
            <Text style={{ fontSize: 11, color: "#A1A1AA" }}>Posted</Text>
          </View>
        </View>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", color: "#000" }}>Skills</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {profile.skills.map((s) => (
                <View key={s} style={{ backgroundColor: "#FEF2F2", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: COLORS.red, fontWeight: "600", fontSize: 13 }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* My Tasks (posted) */}
        {postedTasks.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#000" }}>My tasks</Text>
            {postedTasks.map((t) => (
              <TaskRow key={t.id} task={t} onPress={() => goToTask(t.id)} />
            ))}
          </View>
        )}

        {/* My Offers */}
        {myOffers.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#000" }}>My offers</Text>
            {myOffers.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => goToTask(o.taskId)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: "#FAFAFA",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#000", fontSize: 14 }} numberOfLines={1}>
                    {(o as any).task_title ?? "Task"}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>
                    €{o.amount} · {(o as any).task_category ?? ""}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: (STATUS_COLORS[(o as any).status ?? "pending"] ?? "#6B7280") + "18",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: STATUS_COLORS[(o as any).status ?? "pending"] ?? "#6B7280",
                      textTransform: "capitalize",
                    }}
                  >
                    {(o as any).status ?? "pending"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Helping on */}
        {helperTasks.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#000" }}>Helping on</Text>
            {helperTasks.map((t) => (
              <TaskRow key={t.id} task={t} onPress={() => goToTask(t.id)} />
            ))}
          </View>
        )}

        {/* Logout */}
        <Pressable
          onPress={signOut}
          style={{ borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
        >
          <Text style={{ color: COLORS.red, fontWeight: "600", fontSize: 15 }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#FAFAFA",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", color: "#000", fontSize: 14 }} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>
          €{task.budget} · {task.category}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: (STATUS_COLORS[task.status] ?? "#6B7280") + "18",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: STATUS_COLORS[task.status] ?? "#6B7280",
            textTransform: "capitalize",
          }}
        >
          {task.status.replace("_", " ")}
        </Text>
      </View>
    </Pressable>
  );
}
