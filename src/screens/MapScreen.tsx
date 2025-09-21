import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Repo } from '../services/repo';
import { useQuery } from '@tanstack/react-query';

export default function MapScreen() {
  const center = { latitude: 48.1482, longitude: 17.1067 };
  const { data: helpers } = useQuery({
    queryKey: ['helpers', center],
    queryFn: () => Repo.getNearbyHelpers({ lat: center.latitude, lng: center.longitude }),
  });

  return (
    <MapView style={{ flex: 1 }} initialRegion={{
      latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05,
    }}>
      {helpers?.map(h => (
        <Marker key={h.id} coordinate={{ latitude: h.lat, longitude: h.lng }} title={h.name} />
      ))}
    </MapView>
  );
}
