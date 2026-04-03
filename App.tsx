import "./global.css";
import "react-native-gesture-handler";
import "react-native-get-random-values";
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "./src/features/auth/store/useAuth";
import AuthStack from "./src/navigation/AuthStack";
import MainTabs from "./src/navigation/RootNavigator";
import OnboardingScreen from "./src/features/auth/screens/OnboardingScreen";

const queryClient = new QueryClient();

function AppContent() {
  const { session, profile, loading, initialized, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E31B23" />
      </View>
    );
  }

  // Not logged in → auth flow
  if (!session) {
    return <AuthStack />;
  }

  // Logged in but no profile name → onboarding
  if (!profile?.full_name) {
    return <OnboardingScreen />;
  }

  // Fully authenticated → main app
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
