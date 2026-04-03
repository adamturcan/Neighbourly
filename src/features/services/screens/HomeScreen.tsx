import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  useWindowDimensions,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listServices, listTasks } from "../../../shared/lib/api";
import { TAB_BAR_HEIGHT } from "../../../navigation/RootNavigator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ServiceCard from "../components/ServiceCard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import JobCard from "../../tasks/components/JobCard";
import LocationBar from "../../../shared/components/LocationBar";
import LocationPickerSheet from "../../../shared/components/LocationPickerSheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../../shared/lib/constants";

const CARD_W = Math.min(240, Dimensions.get("window").width * 0.72);

type Mode = "providers" | "requests";

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>("providers");
  const [locSheet, setLocSheet] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_CHANGE_DISTANCE = 64;
  const TOGGLE_FREEZE_UNTIL = 10;

  const PROG = scrollY.interpolate({
    inputRange: [0, HEADER_CHANGE_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerBg = PROG.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#ffeaea"],
  });

  const segHeight = PROG.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });
  const segOpacity = PROG.interpolate({
    inputRange: [0, 0.15, 0.5, 1],
    outputRange: [1, 1, 0.2, 0],
  });

  const still = TOGGLE_FREEZE_UNTIL / HEADER_CHANGE_DISTANCE;
  const segTranslateX = PROG.interpolate({
    inputRange: [0, still, 1],
    outputRange: [0, 0, 0.35 * width],
  });
  const segTranslateY = PROG.interpolate({
    inputRange: [0, still, 1],
    outputRange: [0, 0, -18],
  });
  const segScale = PROG.interpolate({
    inputRange: [0, still, 1],
    outputRange: [1, 1, 0.6],
  });

  const circleOpacity = PROG.interpolate({ inputRange: [0, still, 1], outputRange: [0, 0, 1] });
  const circleScale = PROG.interpolate({ inputRange: [0, still, 1], outputRange: [0.8, 0.8, 1] });

  const [showCircle, setShowCircle] = useState(false);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setShowCircle(value > TOGGLE_FREEZE_UNTIL));
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const {
    data: services = [],
    isLoading: loadingServices,
    refetch: refetchServices,
  } = useQuery({ queryKey: ["services", "nearby"], queryFn: () => listServices() });

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({ queryKey: ["tasks", "open"], queryFn: () => listTasks() });

  // Refetch when tab is focused
  const qc = useQueryClient();
  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["tasks", "open"] });
    }, [qc]),
  );

  const BASIC_SECTIONS: Array<{ key: string; label: string; cat: string }> = [
    { key: "cleaning", label: "Upratovanie & dom", cat: "chores" },
    { key: "garden", label: "Záhrada & exteriér", cat: "gardening" },
    { key: "moving", label: "Sťahovanie & transport", cat: "moving" },
    { key: "tutoring", label: "Doučovanie & štúdium", cat: "tutoring" },
  ];

  const providerCategorySections = useMemo(() => {
    const byCat = (c: string) => services.filter((s: any) => (s.categories ?? []).includes(c));
    return BASIC_SECTIONS
      .map((s) => ({ key: s.key, title: s.label, data: [byCat(s.cat)] }))
      .filter((section) => section.data[0].length > 0);
  }, [services]);

  const requestSections = useMemo(() => {
    if (!tasks.length) return [];
    const groups: Record<string, typeof tasks> = {};
    tasks.forEach((t: any) => {
      const cat = (t.category ?? "other") as string;
      groups[cat] = groups[cat] ? [...groups[cat], t] : [t];
    });
    return Object.entries(groups).map(([cat, list]) => ({
      title: cat[0].toUpperCase() + cat.slice(1),
      data: [list],
    }));
  }, [tasks]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const toggleMode = () => {
    const next: Mode = mode === "providers" ? "requests" : "providers";
    setMode(next);
    if (next === "providers") refetchServices();
    else refetchTasks();
  };

  const CircleToggle = showCircle ? (
    <Animated.View style={{ opacity: circleOpacity as any, transform: [{ scale: circleScale as any }] }}>
      <Pressable
        onPress={toggleMode}
        className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center"
      >
        <MaterialCommunityIcons
          name={mode === "providers" ? "hand-extended-outline" : "briefcase-outline"}
          size={18}
          color={COLORS.red}
        />
      </Pressable>
    </Animated.View>
  ) : undefined;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View
        style={{
          backgroundColor: headerBg as any,
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <LocationBar
          onPress={() => setLocSheet(true)}
          animatedStyle={{}}
          rightSlot={CircleToggle}
          showChevron={!showCircle}
        />

        <Animated.View
          style={{
            height: segHeight as any,
            opacity: segOpacity as any,
            transform: [
              { translateX: segTranslateX as any },
              { translateY: segTranslateY as any },
              { scale: segScale as any },
            ],
            overflow: "hidden",
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => { setMode("providers"); refetchServices(); }}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${mode === "providers" ? "bg-brand-red border-brand-red" : "bg-white border-brand-red"}`}
          >
            <MaterialCommunityIcons name="hand-extended-outline" size={18} color={mode === "providers" ? "#fff" : COLORS.red} />
            <Text className={mode === "providers" ? "text-white font-bold" : "text-brand-red font-bold"}>
              Hire help
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setMode("requests"); refetchTasks(); }}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${mode === "requests" ? "bg-brand-red border-brand-red" : "bg-white border-brand-red"}`}
          >
            <MaterialCommunityIcons name="briefcase-outline" size={18} color={mode === "requests" ? "#fff" : COLORS.red} />
            <Text className={mode === "requests" ? "text-white font-bold" : "text-brand-red font-bold"}>
              Jobs near you
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <View className="flex-1 bg-white">
        {mode === "providers" ? (
          loadingServices ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-muted">Loading…</Text>
            </View>
          ) : (
            <Animated.ScrollView
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={refetchServices} tintColor={COLORS.red} />}
            >
              {providerCategorySections.map((section) => (
                <View key={section.key} className="mt-3">
                  <Text className="text-xl font-extrabold text-black px-4 mb-2.5">
                    {section.title}
                  </Text>
                  <FlatList
                    data={section.data[0]}
                    keyExtractor={(s: any) => s.id}
                    horizontal
                    renderItem={({ item }) => (
                      <View style={{ width: CARD_W, marginLeft: 16, marginRight: 8 }}>
                        <ServiceCard
                          service={item}
                          onPress={() => nav.navigate("ServiceDetail", { serviceId: item.id })}
                        />
                      </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ))}
            </Animated.ScrollView>
          )
        ) : loadingTasks ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading…</Text>
          </View>
        ) : (
          <Animated.SectionList
            onScroll={onScroll}
            scrollEventThrottle={16}
            sections={requestSections}
            keyExtractor={(_, index) => `req-section-${index}`}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchTasks} tintColor={COLORS.red} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text className="text-xl font-extrabold text-black px-4 mt-3.5 mb-2">
                {title}
              </Text>
            )}
            renderItem={({ item }) => (
              <FlatList
                data={item}
                keyExtractor={(t: any) => t.id}
                ItemSeparatorComponent={() => <View className="h-3" />}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item: task }) => (
                  <JobCard task={task} onPress={() => nav.navigate("TaskDetail", { taskId: task.id })} />
                )}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              />
            )}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
          />
        )}
      </View>

      <LocationPickerSheet
        visible={locSheet}
        onDismiss={() => setLocSheet(false)}
        onAddAddress={() => setLocSheet(false)}
        onShowAll={() => setLocSheet(false)}
        onShowMap={() => {
          setLocSheet(false);
          nav.navigate("FullMap");
        }}
      />
    </SafeAreaView>
  );
}
