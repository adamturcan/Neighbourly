import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Repo } from "../../../shared/lib/repo";

export default function PostTaskScreen() {
  const [title, setTitle] = useState("Help me move a desk");
  const [budget, setBudget] = useState("40");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    await Repo.createTask({
      title,
      description: "Short description…",
      category: "moving",
      budget: Number(budget),
      requesterId: "me",
      lat: 48.1482,
      lng: 17.1067,
      when: new Date().toISOString(),
      photos: [],
    } as any);
    setSubmitting(false);
    Alert.alert("Task posted (mock)!");
  };

  return (
    <View className="flex-1 p-4 gap-3 bg-white">
      <Text className="text-2xl font-extrabold text-black">Post a task</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        className="bg-surface-dim rounded-2xl px-4 py-3 text-base"
      />
      <TextInput
        placeholder="Budget (€)"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        className="bg-surface-dim rounded-2xl px-4 py-3 text-base"
      />
      <Pressable
        onPress={onSubmit}
        disabled={submitting}
        className="bg-brand-red rounded-2xl py-4 items-center"
      >
        <Text className="text-white font-bold text-base">
          {submitting ? "Posting…" : "Post"}
        </Text>
      </Pressable>
    </View>
  );
}
