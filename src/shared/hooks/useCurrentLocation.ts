import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { ORIGIN } from "../lib/constants";

export function useCurrentLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(ORIGIN);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      setGranted(true);

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  return { location, granted };
}
