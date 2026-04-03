import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../features/services/screens/HomeScreen";
import TaskDetailScreen from "../features/tasks/screens/TaskDetailScreen";
import FullMapScreen from "../features/map/screens/FullMapScreen";
import ServiceDetailScreen from "../features/services/screens/ServiceDetailScreen";
import LocationPickerScreen from "../features/map/screens/LocationPickerScreen";
import ChatScreen from "../features/chat/screens/ChatScreen";
import ReviewSubmitScreen from "../features/profile/screens/ReviewSubmitScreen";
import EditProfileScreen from "../features/profile/screens/EditProfileScreen";
import PublicProfileScreen from "../features/profile/screens/PublicProfileScreen";
import MyServicesScreen from "../features/services/screens/MyServicesScreen";
import CreateServiceScreen from "../features/services/screens/CreateServiceScreen";

export type HomeStackParamList = {
  HomeMain: undefined;
  TaskDetail: { taskId: string };
  FullMap: undefined;
  ServiceDetail: { serviceId: string };
  LocationPicker: undefined;
  ChatScreen: { taskId: string; otherName: string; fromInbox?: boolean };
  ReviewSubmit: { taskId: string; revieweeId: string; revieweeName: string; taskTitle: string };
  EditProfile: undefined;
  PublicProfile: { userId: string };
  MyServices: undefined;
  CreateService: { editId?: string } | undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#fff" } }}>
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
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReviewSubmit"
        component={ReviewSubmitScreen}
        options={{ presentation: "modal", headerShown: true, title: "Review" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: "modal", headerShown: true, title: "Edit Profile" }}
      />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ headerShown: true, title: "Profile" }}
      />
      <Stack.Screen
        name="MyServices"
        component={MyServicesScreen}
        options={{ headerShown: true, title: "My Services" }}
      />
      <Stack.Screen
        name="CreateService"
        component={CreateServiceScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
