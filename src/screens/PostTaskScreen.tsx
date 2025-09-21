import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { Repo } from '../services/repo';

export default function PostTaskScreen() {
  const [title, setTitle] = useState('Help me move a desk');
  const [budget, setBudget] = useState('40');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    await Repo.createTask({
      title,
      description: 'Short description…',
      category: 'moving',
      budget: Number(budget),
      requesterId: 'me',
      lat: 48.1482, lng: 17.1067,
      when: new Date().toISOString(),
      photos: [],
      status: 'open', createdAt: new Date().toISOString(), // ignored by repo
    } as any);
    setSubmitting(false);
    alert('Task posted (mock)!');
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">Post a task</Text>
      <TextInput label="Title" value={title} onChangeText={setTitle} />
      <TextInput label="Budget (€)" value={budget} onChangeText={setBudget} keyboardType="numeric" />
      <Button mode="contained" onPress={onSubmit} loading={submitting}>Post</Button>
    </View>
  );
}
