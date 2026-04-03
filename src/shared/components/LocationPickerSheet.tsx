import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  Text,
  Dimensions,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  PanResponder,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocation } from "../lib/store/useLocation";
import { COLORS } from "../lib/constants";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onAddAddress?: () => void;
  onShowAll?: () => void;
  onShowMap?: () => void;
};

export default function LocationPickerSheet({
  visible,
  onDismiss,
  onAddAddress,
  onShowAll,
  onShowMap,
}: Props) {
  const { recent, setCurrent, current } = useLocation();
  const HEIGHT = Math.round(Dimensions.get("window").height * 0.6);
  const [mounted, setMounted] = useState(visible);

  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dragY.setValue(0);
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });
  const baseTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [HEIGHT, 0],
  });
  const translateY = Animated.add(baseTranslate, dragY);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        dragY.setValue(g.dy > 0 ? g.dy : g.dy * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.vy > 1 || g.dy > HEIGHT * 0.25;
        if (shouldClose) {
          Animated.timing(progress, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            dragY.setValue(0);
            onDismiss();
          });
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () =>
        Animated.spring(dragY, {
          toValue: 0,
          bounciness: 6,
          useNativeDriver: true,
        }).start(),
    }),
  ).current;

  const top3 = useMemo(() => recent.slice(0, 3), [recent]);
  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", opacity: backdropOpacity },
        ]}
        pointerEvents={visible ? "auto" : "none"}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        pointerEvents={visible ? "auto" : "none"}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            height: HEIGHT,
            transform: [{ translateY }],
            paddingBottom: Platform.OS === "ios" ? 24 : 12,
          },
        ]}
        pointerEvents="auto"
      >
        <View className="px-4 mb-2" {...panResponder.panHandlers}>
          <View className="self-center w-12 h-1.5 rounded-full bg-gray-200 mb-3" />
          <Text className="text-[22px] font-extrabold text-black">
            Vybrať polohu
          </Text>
        </View>

        <View>
          {top3.map((a) => (
            <AddressRow
              key={a.id}
              label={a.label}
              line2={[a.line1, a.city].filter(Boolean).join(", ")}
              selected={current?.id === a.id}
              onPress={() => {
                setCurrent(a);
                onDismiss();
              }}
              leftIcon="map-marker"
              accent={current?.id === a.id}
            />
          ))}
        </View>

        <View className="h-px bg-gray-200 my-2" />

        <View>
          <ActionRow
            title="Pridať adresu"
            icon="plus"
            onPress={() => {
              onDismiss();
              onAddAddress?.();
            }}
          />
          <ActionRow
            title="Moje adresy"
            icon="home-city"
            onPress={() => {
              onDismiss();
              onShowAll?.();
            }}
          />
          <ActionRow
            title="Zobraziť mapu"
            icon="map"
            onPress={() => {
              onDismiss();
              onShowMap?.();
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function AddressRow({
  label,
  line2,
  selected,
  onPress,
  leftIcon = "map-marker",
  accent = false,
}: {
  label: string;
  line2?: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: string;
  accent?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="px-4 py-3 flex-row items-center gap-3">
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${accent ? "bg-brand-red" : "bg-surface-dim"}`}
      >
        <MaterialCommunityIcons
          name={leftIcon as any}
          size={20}
          color={accent ? "#fff" : "#475569"}
        />
      </View>

      <View className="flex-1">
        <Text className="text-base font-bold text-black" numberOfLines={1}>
          {label}
        </Text>
        {!!line2 && (
          <Text className="mt-0.5 text-[13px] text-text-muted" numberOfLines={1}>
            {line2}
          </Text>
        )}
      </View>

      {selected && (
        <MaterialCommunityIcons
          name="check"
          size={22}
          color={COLORS.checkGreen}
        />
      )}
    </Pressable>
  );
}

function ActionRow({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="px-4 py-3 flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center">
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={COLORS.red}
        />
      </View>
      <Text className="text-base font-bold text-black">{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
});
