import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import type { Service } from '../models/types';

function km(a: {lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R = 6371;
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat)/2) * Math.PI/180);
  const y = (b.lat - a.lat);
  return Math.sqrt(x*x + y*y) * Math.PI/180 * R;
}

export default function ServiceCard({
  service,
  origin = { lat: 48.1482, lng: 17.1067 },
  onPress,
}: {
  service: Service;
  origin?: { lat: number; lng: number };
  onPress?: () => void;
}) {
  const distance = km(origin, { lat: service.lat, lng: service.lng });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card
        mode="elevated"
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
          backgroundColor: '#fff',
          width: 220,        // fixed width
          height: 260,       // fixed height
        }}
      >
        {/* Image */}
        <View style={{ height: 120, backgroundColor: '#eee' }}>
          <Image
            source={{ uri: service.photoUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
          />
        </View>

        {/* Content */}
        <Card.Content style={{ flex: 1, paddingVertical: 10, justifyContent: 'space-between' }}>
          {/* Title */}
          <Text
            variant="titleMedium"
            style={{ fontWeight: '700', color: '#000' }}
            numberOfLines={2}
          >
            {service.title}
          </Text>

          {/* Categories row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 6 }}
            contentContainerStyle={{ gap: 6 }}
          >
            {service.categories.map(c => (
              <Chip
                key={c}
                compact
                style={{ backgroundColor: '#FFE5E5', borderRadius: 9999, height: 28 }}
                textStyle={{ color: '#E10600', fontWeight: '700', fontSize: 12 }}
              >
                {c}
              </Chip>
            ))}
          </ScrollView>

          {/* Footer (price + meta) */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: '#000', fontWeight: '700' }}>from €{service.priceFrom}</Text>
            <Text style={{ color: '#000', opacity: 0.75, fontSize: 12 }}>
              ⭐ {service.rating.toFixed(1)} · {service.jobsDone} jobs · {distance.toFixed(1)} km
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}
