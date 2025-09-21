import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Repo } from '../services/repo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeStack';
import EscrowBanner from '../components/EscrowBanner';

type Props = NativeStackScreenProps<HomeStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({ route }: Props) {
  const { taskId } = route.params;
  const qc = useQueryClient();

  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => Repo.getTask(taskId),
  });

  const { data: offers } = useQuery({
    queryKey: ['offers', taskId],
    queryFn: () => Repo.listOffers(taskId),
  });

  const holdEscrow = useMutation({
    mutationFn: (offerId: string) => Repo.acceptOffer({ taskId, offerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['offers', taskId] });
    },
  });

  const releaseEscrow = useMutation({
    mutationFn: () => Repo.completeTask({ taskId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  if (!task) return null;

  const escrowStatus =
    task.status === 'in_progress' ? 'held' :
    task.status === 'completed'    ? 'released' : 'none';

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <EscrowBanner status={escrowStatus as any} />

      <Card>
        <Card.Title title={task.title} subtitle={`${task.category} • €${task.budget}`} />
        <Card.Content>
          <Text>{task.description}</Text>
          <Text style={{ marginTop: 8, opacity: 0.7 }}>When: {new Date(task.when).toLocaleString()}</Text>
          <Text style={{ opacity: 0.7 }}>Status: {task.status}</Text>
        </Card.Content>
      </Card>

      {task.status === 'open' && (
        <View style={{ gap: 8 }}>
          <Text variant="titleMedium" style={{ marginTop: 8 }}>Offers</Text>
          {offers?.length ? offers.map(o => (
            <Card key={o.id}>
              <Card.Title title={`Offer €${o.amount}`} subtitle={`Helper ${o.helperId.slice(0, 6)}…`} />
              <Card.Content><Text>{o.message || '—'}</Text></Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => holdEscrow.mutate(o.id)}
                  loading={holdEscrow.isPending}
                >
                  Accept & Hold Escrow
                </Button>
              </Card.Actions>
            </Card>
          )) : <Text>No offers yet (seeded on first task; new tasks auto-seed 1 offer).</Text>}
        </View>
      )}

      {task.status === 'in_progress' && (
        <Button mode="contained" onPress={() => releaseEscrow.mutate()} loading={releaseEscrow.isPending}>
          Mark Complete & Release
        </Button>
      )}
    </View>
  );
}
