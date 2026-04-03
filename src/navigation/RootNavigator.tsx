import React, { useRef, useEffect } from "react";
import { View, Pressable, Text, StyleSheet, Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import PostTaskScreen from "../features/tasks/screens/PostTaskScreen";
import InboxScreen from "../features/chat/screens/InboxScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import SearchScreen from "../features/services/screens/SearchScreen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../shared/lib/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Discover", icon: "compass-outline", iconFilled: "compass", label: "Discover" },
  { name: "Search", icon: "magnify", iconFilled: "magnify", label: "Search" },
  { name: "Post", icon: "plus", iconFilled: "plus", label: "Post" },
  { name: "Inbox", icon: "chat-outline", iconFilled: "chat", label: "Inbox" },
  { name: "Profile", icon: "account-outline", iconFilled: "account", label: "Profile" },
] as const;

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  // Animate indicator to active tab
  useEffect(() => {
    // Each tab is roughly 1/5 of the pill width, center button is different
    // We'll position based on index (skip center)
    const positions = [0, 1, -1, 3, 4]; // -1 = center (no indicator)
    const pos = positions[state.index];
    if (pos >= 0) {
      Animated.spring(indicatorX, {
        toValue: pos,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }).start();
    }

    // Bounce animation on the active icon
    const anim = scaleAnims[state.index];
    anim.setValue(0.8);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 300 }).start();
  }, [state.index]);

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
                <Animated.View style={[tb.centerBtn, { transform: [{ scale: scaleAnims[index] }] }]}>
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </Animated.View>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={[tb.tab, focused && tb.tabActive]}>
              <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
                <MaterialCommunityIcons
                  name={focused ? tab.iconFilled : tab.icon}
                  size={22}
                  color={focused ? COLORS.red : "#9CA3AF"}
                />
              </Animated.View>
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
      screenOptions={{
        headerShown: false,
        animation: "shift",
      }}
    >
      <Tab.Screen name="Discover" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Post" component={PostTaskScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
