import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import PostTaskScreen from '../screens/PostTaskScreen';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E10600',
          tabBarInactiveTintColor: '#000',
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ tabBarIcon: ({ size }) => <MaterialCommunityIcons name="home-variant-outline" size={size} /> }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ tabBarIcon: ({ size }) => <MaterialCommunityIcons name="magnify" size={size} /> }}
        />
        <Tab.Screen
          name="Post"
          component={PostTaskScreen}
          options={{ tabBarIcon: ({ size }) => <MaterialCommunityIcons name="plus-circle-outline" size={size} /> }}
        />
        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={{ tabBarIcon: ({ size }) => <MaterialCommunityIcons name="message-text-outline" size={size} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ size }) => <MaterialCommunityIcons name="account-circle-outline" size={size} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
