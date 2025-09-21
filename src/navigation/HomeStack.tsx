import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import FullMapScreen from '../screens/FullMapScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  TaskDetail: { taskId: string };
  FullMap: undefined;
  ServiceDetail: { serviceId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ headerShown: true, title: 'Service' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ headerShown: true, title: 'Task' }}
      />
      <Stack.Screen
        name="FullMap"
        component={FullMapScreen}
        options={{ headerShown: true, title: 'Map' }}
      />
    </Stack.Navigator>
  );
}
