import "./global.css";
import "react-native-gesture-handler";
import "react-native-get-random-values";
import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
