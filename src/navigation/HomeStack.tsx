import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../features/services/screens/HomeScreen";
import TaskDetailScreen from "../features/tasks/screens/TaskDetailScreen";
import FullMapScreen from "../features/map/screens/FullMapScreen";
import ServiceDetailScreen from "../features/services/screens/ServiceDetailScreen";
import LocationPickerScreen from "../features/map/screens/LocationPickerScreen";

export type HomeStackParamList = {
  HomeMain: undefined;
  TaskDetail: { taskId: string };
  FullMap: undefined;
  ServiceDetail: { serviceId: string };
  LocationPicker: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ headerShown: true, title: "Service" }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Task",
        }}
      />
      <Stack.Screen
        name="FullMap"
        component={FullMapScreen}
        options={{ headerShown: true, title: "Map" }}
      />
    </Stack.Navigator>
  );
}
