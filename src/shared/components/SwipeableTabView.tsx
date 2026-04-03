import React, { useRef } from "react";
import { PanResponder, View } from "react-native";
import { useNavigation, useNavigationState } from "@react-navigation/native";

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.3;

const TAB_ORDER = ["Discover", "Search", "Post", "Inbox", "Profile"];

/**
 * Wraps a tab screen to allow horizontal swipe between tabs.
 * Only triggers on horizontal swipes that start near the edges.
 */
export default function SwipeableTabView({ children }: { children: React.ReactNode }) {
  const nav = useNavigation<any>();
  const currentIndex = useNavigationState((s) => s.index);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // Only capture horizontal swipes with enough velocity
        return Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.vx) > VELOCITY_THRESHOLD;
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < SWIPE_THRESHOLD) return;

        if (g.dx < 0 && currentIndex < TAB_ORDER.length - 1) {
          // Swipe left → next tab
          nav.navigate(TAB_ORDER[currentIndex + 1]);
        } else if (g.dx > 0 && currentIndex > 0) {
          // Swipe right → previous tab
          nav.navigate(TAB_ORDER[currentIndex - 1]);
        }
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
