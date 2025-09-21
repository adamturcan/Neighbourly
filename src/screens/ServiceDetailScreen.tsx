import React from 'react';
import { View } from 'react-native';
import { Text, Button, Chip, Card } from 'react-native-paper';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getService } from '../services/repo';

type RouteParams = { serviceId: string };

export default function ServiceDetailScreen() {
  const route = useRoute();
  const { serviceId } = (route.params ?? {}) as RouteParams;

  const { data: service } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });

  if (!service) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Hero image */}
      <View style={{ height: 240, backgroundColor: '#eee' }}>
        <Image
          source={{ uri: service.photoUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#000' }}>{service.title}</Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {service.categories.map(c => (
            <Chip
              key={c}
              compact
              style={{ backgroundColor: '#FFE5E5', borderRadius: 9999 }}
              textStyle={{ color: '#E10600', fontWeight: '700' }}
            >
              {c}
            </Chip>
          ))}
        </View>

        <Text style={{ color: '#000', fontSize: 16 }}>
          from <Text style={{ fontWeight: '800' }}>€{service.priceFrom}</Text> · ⭐ {service.rating.toFixed(1)} · {service.jobsDone} jobs
        </Text>

        {/* Mini map */}
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ height: 160 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: service.lat,
                longitude: service.lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
            >
              <Marker coordinate={{ latitude: service.lat, longitude: service.lng }} title={service.title} />
            </MapView>
          </View>
        </Card>

        <Button mode="contained" style={{ marginTop: 6, backgroundColor: '#E10600' }} onPress={() => alert('Request sent (mock).')}>
          Hire now
        </Button>
      </View>
    </View>
  );
}
