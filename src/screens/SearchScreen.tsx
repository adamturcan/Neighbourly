import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { listServices } from '../services/repo';
import { useQuery } from '@tanstack/react-query';
import ServiceCard from '../components/ServiceCard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value as any);
  React.useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v as T;
}

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const qd = useDebounced(q, 300);
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['search', qd],
    queryFn: async () => {
      const all = await listServices({ near: { lat: 48.1482, lng: 17.1067 } });
      if (!qd.trim()) return all;
      const s = qd.toLowerCase();
      return all.filter(item =>
        item.title.toLowerCase().includes(s) ||
        item.categories.some(c => c.toLowerCase().includes(s))
      );
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      
      <View  />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Searchbar
          placeholder="Search services, e.g. cleaning, tutoring…"
          value={q}
          onChangeText={setQ}
          iconColor="#E10600"
          inputStyle={{ fontSize: 16 }}
          style={{ backgroundColor: '#F9F0F2' }}
        />
      </View>

      {isLoading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator />
        </View>
      ) : data?.length ? (
        <FlatList
          data={data}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <ServiceCard service={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 12 }}
          showsVerticalScrollIndicator={false}    // hide scrollbar
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <Text>No results. Try another term.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
