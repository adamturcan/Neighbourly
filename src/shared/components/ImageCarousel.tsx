import React from "react";
import { ScrollView, View, Dimensions } from "react-native";
import { Image } from "expo-image";

const { width } = Dimensions.get("window");

export default function ImageCarousel({ images }: { images: string[] }) {
  const slides = images.length
    ? images
    : ["https://images.unsplash.com/photo-1503602642458-232111445657"];
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {slides.map((uri, i) => (
        <View key={i} style={{ width, height: 240 }} className="bg-black">
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      ))}
    </ScrollView>
  );
}
