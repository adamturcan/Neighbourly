import React from "react";
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";

export default function AuthStack() {
  // Auth state changes are picked up by useAuth listener in App.tsx
  // Apple/Google sign-in completes in one step from WelcomeScreen
  return <WelcomeScreen />;
}
