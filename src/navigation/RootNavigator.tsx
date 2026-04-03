import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import PostTaskScreen from "../features/tasks/screens/PostTaskScreen";
import InboxScreen from "../features/chat/screens/InboxScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import SearchScreen from "../features/services/screens/SearchScreen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../shared/lib/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SwipeableTabView from "../shared/components/SwipeableTabView";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Discover", icon: "compass-outline", iconFilled: "compass", label: "Discover" },
  { name: "Search", icon: "magnify", iconFilled: "magnify", label: "Search" },
  { name: "Post", icon: "plus", iconFilled: "plus", label: "Post" },
  { name: "Inbox", icon: "chat-outline", iconFilled: "chat", label: "Inbox" },
  { name: "Profile", icon: "account-outline", iconFilled: "account", label: "Profile" },
] as const;

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tb.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={tb.pill}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const tab = TABS[index];
          const isCenter = index === 2;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <Pressable key={route.key} onPress={onPress} style={tb.centerWrap}>
                <View style={tb.centerBtn}>
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={[tb.tab, focused && tb.tabActive]}>
              <MaterialCommunityIcons
                name={focused ? tab.iconFilled : tab.icon}
                size={22}
                color={focused ? COLORS.red : "#9CA3AF"}
              />
              <Text style={[tb.label, focused && tb.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Discover">{() => <SwipeableTabView><HomeStack /></SwipeableTabView>}</Tab.Screen>
      <Tab.Screen name="Search">{() => <SwipeableTabView><SearchScreen /></SwipeableTabView>}</Tab.Screen>
      <Tab.Screen name="Post">{() => <SwipeableTabView><PostTaskScreen /></SwipeableTabView>}</Tab.Screen>
      <Tab.Screen name="Inbox">{() => <SwipeableTabView><InboxScreen /></SwipeableTabView>}</Tab.Screen>
      <Tab.Screen name="Profile">{() => <SwipeableTabView><ProfileScreen /></SwipeableTabView>}</Tab.Screen>
    </Tab.Navigator>
  );
}

// Export tab bar height so screens can add bottom padding
export const TAB_BAR_HEIGHT = 80;

const tb = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: "#FEF2F2",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  labelActive: {
    color: COLORS.red,
    fontWeight: "600",
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.red,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
