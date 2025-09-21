import React, { useMemo, useState } from 'react';
import { View, FlatList, Dimensions, ScrollView, SectionList } from 'react-native';
import { ActivityIndicator, Card, Text, IconButton, SegmentedButtons } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { listServices, Repo } from '../services/repo';
import { useQuery } from '@tanstack/react-query';
import ServiceCard from '../components/ServiceCard';
import { useNavigation } from '@react-navigation/native';

const ORIGIN = { latitude: 48.1482, longitude: 17.1067 };
const MAP_PREVIEW_HEIGHT = 140; // a bit taller for better context
const gap = 12;
const CARD_W = Math.min(240, Dimensions.get('window').width * 0.72);

type Mode = 'providers' | 'requests';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [mode, setMode] = useState<Mode>('providers');

  // Providers feed (recommended near you)
  const {
    data: services = [],
    isLoading: loadingServices,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['services', 'nearby'],
    queryFn: () => listServices({ near: { lat: ORIGIN.latitude, lng: ORIGIN.longitude } }),
  });

  // Open requests
  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => Repo.listTasks(),
  });

  const markers = useMemo(() => services, [services]);

  // ---- PROVIDER sections (Wolt-style carousels) ----
  const providersSections = useMemo(() => {
    if (!services.length) return [];
    const byCat = (c: string) => services.filter(s => s.categories.includes(c));
    const popular = [...services].sort((a, b) => (b.rating * b.jobsDone) - (a.rating * a.jobsDone)).slice(0, 10);
    const cheap = services.filter(s => s.priceFrom <= 25);
    const favorites = services.slice(0, 2); // mock “Your favorites”

    return [
      { key: 'favorites', title: 'Your favorites', data: [favorites] },
      { key: 'popular', title: 'Popular near you', data: [popular] },
      { key: 'cheap', title: 'Quick & affordable (≤ €25)', data: [cheap] },
      { key: 'garden', title: 'Gardening & Outdoors', data: [byCat('gardening')] },
      { key: 'cleaning', title: 'Cleaning & Home', data: [byCat('chores')] },
      { key: 'tutoring', title: 'Tutoring & Study', data: [byCat('tutoring')] },
      { key: 'moving', title: 'Moving & Transport', data: [byCat('moving')] },
    ].filter(section => section.data[0].length > 0);
  }, [services]);

  // ---- REQUEST sections (group by category) ----
  const requestSections = useMemo(() => {
    if (!tasks.length) return [];
    const groups: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      groups[t.category] = groups[t.category] ? [...groups[t.category], t] : [t];
    });
    return Object.entries(groups).map(([cat, list]) => ({
      title: cat[0].toUpperCase() + cat.slice(1),
      data: [list],
    }));
  }, [tasks]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Map preview */}
      <View
        style={{
          height: MAP_PREVIEW_HEIGHT,
          width: '100%',
          backgroundColor: '#f2f2f2',
          borderBottomColor: '#eee',
          borderBottomWidth: 1,
        }}
      >
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: ORIGIN.latitude,
            longitude: ORIGIN.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          pointerEvents="none"
          showsPointsOfInterest={false}
          showsBuildings={false}
        >
          {markers.map(s => (
            <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} title={s.title} />
          ))}
        </MapView>

        {/* Open full-screen interactive map */}
        <IconButton
          icon="map"
          mode="contained-tonal"
          style={{ position: 'absolute', right: 12, bottom: 12, backgroundColor: '#fff' }}
          onPress={() => nav.navigate('FullMap')}
        />
      </View>

      {/* Toggle with premium wording */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
        <SegmentedButtons
          value={mode}
          onValueChange={(v) => {
            const m = v as Mode;
            setMode(m);
            if (m === 'providers') refetchServices();
            else refetchTasks();
          }}
          buttons={[
            { value: 'providers', label: 'Hire help', icon: 'hand-extended-outline' },
            { value: 'requests', label: 'Jobs near you', icon: 'briefcase-outline' },
          ]}
        />
      </View>

      {/* CONTENT */}
      {mode === 'providers' ? (
        loadingServices ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {providersSections.map(section => (
              <View key={section.key} style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', paddingHorizontal: 16, marginBottom: 10 }}>
                  {section.title}
                </Text>
                <FlatList
                  data={section.data[0]}
                  keyExtractor={(s) => s.id}
                  horizontal
                  renderItem={({ item }) => (
                    <View style={{ width: CARD_W, marginLeft: 16, marginRight: 8 }}>
                      <ServiceCard
                        service={item}
                        onPress={() => nav.navigate('ServiceDetail', { serviceId: item.id })}
                      />
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ))}
          </ScrollView>
        )
      ) : loadingTasks ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <SectionList
          sections={requestSections}
          keyExtractor={(item, index) => `${item[0]?.id ?? 'sec'}-${index}`}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', paddingHorizontal: 16, marginTop: 14, marginBottom: 8 }}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <FlatList
              data={item}
              keyExtractor={(t) => t.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item: t }) => (
                <Card style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' }}>
                  <Card.Title title={t.title} subtitle={`${t.category} • €${t.budget}`} />
                  <Card.Content>
                    <Text style={{ color: '#000' }}>{t.description}</Text>
                    <Text style={{ color: '#000', opacity: 0.6, marginTop: 6 }}>
                      When: {new Date(t.when).toLocaleString()}
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Text style={{ marginLeft: 'auto', color: '#E10600', fontWeight: '700' }}>View</Text>
                  </Card.Actions>
                </Card>
              )}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}
