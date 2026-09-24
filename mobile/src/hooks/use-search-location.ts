import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type SearchLocation =
  | { status: 'locating' }
  | { status: 'none'; reason: string }
  | { status: 'ready'; source: 'gps' | 'typed'; label: string; lat: number; lng: number };

function placeLabel(place: Location.LocationGeocodedAddress | undefined) {
  if (!place) return 'Sua localização';
  const area = place.district ?? place.subregion ?? place.street;
  return [area, place.city].filter(Boolean).join(', ') || 'Sua localização';
}

async function resolveGpsLocation(): Promise<SearchLocation> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { status: 'none', reason: 'Localização desativada' };
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude: lat, longitude: lng } = position.coords;
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).catch(() => []);
    return { status: 'ready', source: 'gps', label: placeLabel(place), lat, lng };
  } catch {
    return { status: 'none', reason: 'Não foi possível obter sua localização' };
  }
}

/** Where to search from: device GPS by default, or an address the user typed. */
export function useSearchLocation() {
  const [location, setLocation] = useState<SearchLocation>({ status: 'locating' });

  useEffect(() => {
    let active = true;
    resolveGpsLocation().then((next) => active && setLocation(next));
    return () => {
      active = false;
    };
  }, []);

  const locateWithGps = useCallback(() => {
    setLocation({ status: 'locating' });
    resolveGpsLocation().then(setLocation);
  }, []);

  /** Returns false when the address could not be found. */
  const locateAddress = useCallback(async (query: string) => {
    try {
      const [result] = await Location.geocodeAsync(query);
      if (!result) return false;
      setLocation({ status: 'ready', source: 'typed', label: query, lat: result.latitude, lng: result.longitude });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { location, locateWithGps, locateAddress };
}
