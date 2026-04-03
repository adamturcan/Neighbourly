import React from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Repo } from "../../../shared/lib/repo";

export default function TaskDetailScreen() {
  const route = useRoute<any>();
  const taskId = route.params?.taskId as string;

  const [task, setTask] = React.useState<any>(null);
  const [offers, setOffers] = React.useState<any[]>([]);

  React.useEffect(() => {
    Repo.getTask(taskId).then(setTask);
    Repo.listOffers(taskId).then(setOffers);
  }, [taskId]);

  if (!task) return null;

  return (
    <View className="flex-1 p-4 gap-3 bg-white">
      <Text className="text-[22px] font-bold">{task.title}</Text>
      <Text className="text-text-subtle">{task.description}</Text>
      <Text className="font-semibold">
        {task.budget ? `Budget: €${task.budget}` : "Budget TBD"}
      </Text>

      <Text className="mt-3 text-lg font-bold">Offers</Text>
      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <View className="p-3 rounded-xl bg-white shadow-sm flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <Text className="font-semibold">€{item.amount}</Text>
              <Text numberOfLines={2} className="text-text-subtle">
                {item.message}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                await Repo.acceptOffer({ taskId, offerId: item.id });
                Alert.alert("Offer accepted!");
              }}
              className="bg-brand-red py-2.5 px-3.5 rounded-xl"
            >
              <Text className="text-white font-bold">Accept</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
