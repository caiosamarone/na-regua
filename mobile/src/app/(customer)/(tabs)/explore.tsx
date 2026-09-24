import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyText, ErrorState, LoadingState, PhotoPlaceholder } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershopSearch, type BarbershopSearchParams } from '@/hooks/use-barbershops';
import { useSearchLocation } from '@/hooks/use-search-location';
import { errorMessage } from '@/lib/api';
import { km } from '@/lib/format';
import type { BarbershopListItem } from '@/types/api';

const DISTANCES = [
  { value: 1, label: 'Até 1 km' },
  { value: 3, label: 'Até 3 km' },
  { value: 5, label: 'Até 5 km' },
  { value: 0, label: 'Todas' },
];
// "Todas" still sends a radius so results keep their distance; 100 km is the API maximum.
const ALL_RADIUS_KM = 100;

export default function ExploreScreen() {
  const { location, locateWithGps, locateAddress } = useSearchLocation();
  const [distance, setDistance] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [addressError, setAddressError] = useState('');

  const ready = location.status === 'ready';
  const params: BarbershopSearchParams = ready
    ? { lat: location.lat, lng: location.lng, radiusKm: distance || ALL_RADIUS_KM }
    : {};
  const search = useBarbershopSearch(params, location.status !== 'locating');
  const shops = [...(search.data ?? [])].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

  const submitAddress = async () => {
    const q = query.trim();
    if (!q) return;
    setAddressError('');
    if (await locateAddress(q)) setPickerOpen(false);
    else setAddressError('Endereço não encontrado.');
  };

  const nextDistance = DISTANCES[Math.min(DISTANCES.findIndex((d) => d.value === distance) + 1, DISTANCES.length - 1)];
  const sourceLabel =
    location.status === 'locating'
      ? 'Localizando…'
      : location.status === 'none'
        ? location.reason
        : location.source === 'gps'
          ? 'Localização atual'
          : 'Endereço digitado';
  const placeLabel = ready ? location.label : location.status === 'locating' ? '—' : 'Todas as barbearias';

  return (
    <Screen
      contentStyle={styles.content}
      refreshing={search.isRefetching}
      onRefresh={() => void search.refetch()}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Local da busca: ${placeLabel}. Alterar`}
          onPress={() => setPickerOpen((v) => !v)}
          style={{ gap: 2 }}>
          <AppText style={Type.eyebrow}>{`${sourceLabel} ▾`}</AppText>
          <AppText style={styles.place}>{placeLabel}</AppText>
        </Pressable>

        {pickerOpen && (
          <View style={styles.picker}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPickerOpen(false);
                setQuery('');
                locateWithGps();
              }}
              style={styles.gpsRow}>
              <View style={styles.gpsDot} />
              <AppText style={{ fontFamily: Fonts.semibold, fontSize: 14 }}>Usar minha localização atual</AppText>
            </Pressable>
            <View style={styles.addressRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={query}
                  onChangeText={(v) => {
                    setQuery(v);
                    setAddressError('');
                  }}
                  onSubmitEditing={submitAddress}
                  placeholder="Endereço, bairro ou CEP"
                  returnKeyType="search"
                  height={44}
                  style={{ fontSize: 14 }}
                  invalid={!!addressError}
                />
              </View>
              <Button label="Buscar" onPress={submitAddress} height={44} style={{ borderRadius: 10 }} />
            </View>
            {addressError ? <AppText style={styles.error}>{addressError}</AppText> : null}
          </View>
        )}

        {ready && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DISTANCES.map((d) => (
              <Chip key={d.value} label={d.label} selected={d.value === distance} onPress={() => setDistance(d.value)} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.list}>
        {search.isLoading || location.status === 'locating' ? (
          <LoadingState />
        ) : search.error ? (
          <ErrorState message={errorMessage(search.error)} onRetry={() => void search.refetch()} />
        ) : (
          <>
            <AppText style={[Type.eyebrow, { marginBottom: 6 }]}>
              {`${shops.length} barbearia${shops.length === 1 ? '' : 's'}${ready && distance ? ` até ${distance} km` : ''}`}
            </AppText>
            {shops.map((shop) => (
              <ShopRow key={shop.id} shop={shop} />
            ))}
            {shops.length === 0 &&
              (ready && distance ? (
                <View style={styles.empty}>
                  <AppText style={{ fontFamily: Fonts.bold, fontSize: 18 }}>Nenhuma barbearia nesse raio</AppText>
                  <Button
                    label={nextDistance.value ? `Ampliar para ${nextDistance.value} km` : 'Ver todas'}
                    onPress={() => setDistance(nextDistance.value)}
                    height={44}
                    style={{ borderRadius: 22 }}
                  />
                </View>
              ) : (
                <EmptyText>Nenhuma barbearia encontrada.</EmptyText>
              ))}
          </>
        )}
      </View>
    </Screen>
  );
}

function ShopRow({ shop }: { shop: BarbershopListItem }) {
  const distance = shop.distanceKm != null ? km(shop.distanceKm) : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/book/[shopId]', params: { shopId: shop.id, distance } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <PhotoPlaceholder uri={shop.logoUrl} style={styles.thumb} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <AppText style={[Type.rowTitle, { flexShrink: 1 }]} numberOfLines={1}>
            {shop.name}
          </AppText>
          {distance ? <AppText style={[Type.mono12, { color: Colors.ink }]}>{distance}</AppText> : null}
        </View>
        <AppText style={Type.small} numberOfLines={1}>
          {shop.address}
        </AppText>
        <AppText style={Type.small} numberOfLines={1}>
          {`${shop.neighborhood} · ${shop.city}`}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0, gap: 0 },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lineStrong,
  },
  place: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 25, letterSpacing: -0.22 },
  picker: {
    gap: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
  },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  gpsDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  addressRow: { flexDirection: 'row', gap: 8 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  thumb: { width: 72, height: 72 },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  empty: { paddingVertical: 40, paddingHorizontal: 8, gap: 12, alignItems: 'flex-start' },
});
