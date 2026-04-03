import React, { useState } from "react";
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";
import PhoneEntryScreen from "../features/auth/screens/PhoneEntryScreen";
import OTPScreen from "../features/auth/screens/OTPScreen";

type Step = "welcome" | "phone" | "otp";

export default function AuthStack() {
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_up");

  if (step === "welcome") {
    return (
      <WelcomeScreen
        onSignUp={() => {
          setMode("sign_up");
          setStep("phone");
        }}
        onSignIn={() => {
          setMode("sign_in");
          setStep("phone");
        }}
      />
    );
  }

  if (step === "phone") {
    return (
      <PhoneEntryScreen
        mode={mode}
        onOtpSent={(p) => {
          setPhone(p);
          setStep("otp");
        }}
        onBack={() => setStep("welcome")}
      />
    );
  }

  return (
    <OTPScreen
      phone={phone}
      onVerified={() => {
        // Auth state change will be picked up by useAuth listener
      }}
      onBack={() => setStep("phone")}
    />
  );
}
