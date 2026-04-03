import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import PostTaskScreen from "../features/tasks/screens/PostTaskScreen";
import InboxScreen from "../features/chat/screens/InboxScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import SearchScreen from "../features/services/screens/SearchScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../shared/lib/constants";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.red,
          tabBarInactiveTintColor: COLORS.black,
          tabBarStyle: { backgroundColor: COLORS.white },
        }}
      >
        <Tab.Screen
          name="Discover"
          component={HomeStack}
          options={{
            tabBarIcon: ({ size }) => (
              <MaterialCommunityIcons name="compass-outline" size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ size }) => (
              <MaterialCommunityIcons name="magnify" size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Post"
          component={PostTaskScreen}
          options={{
            tabBarIcon: ({ size }) => (
              <MaterialCommunityIcons name="plus-circle-outline" size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={{
            tabBarIcon: ({ size }) => (
              <MaterialCommunityIcons name="message-text-outline" size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ size }) => (
              <MaterialCommunityIcons name="account-circle-outline" size={size} />
            ),
          }}
        />
      </Tab.Navigator>
  );
}
