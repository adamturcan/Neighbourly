import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { listServices } from '../services/repo';

const ORIGIN = { latitude: 48.1482, longitude: 17.1067 };

export default function FullMapScreen() {
  const { data } = useQuery({
    queryKey: ['services', 'map'],
    queryFn: () => listServices({ near: { lat: ORIGIN.latitude, lng: ORIGIN.longitude } }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: ORIGIN.latitude,
          longitude: ORIGIN.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        {data?.map(s => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={s.title}
            description={`from €${s.priceFrom} • ⭐ ${s.rating.toFixed(1)}`}
          />
        ))}
      </MapView>
    </View>
  );
}
