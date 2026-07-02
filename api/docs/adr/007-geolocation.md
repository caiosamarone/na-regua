# API ADR 007: Geolocation for Proximity Search

## Status

Accepted

## Context

End customers find barbershops near their current location.

## Decision

### Data Storage
- `Barbershop` table has `latitude` and `longitude` columns (Float, nullable)
- Populated during barbershop onboarding: Super Admin enters CEP + address → API calls public CEP API → resolves to coordinates via geocoding

### Customer Flow
1. Browser requests geolocation permission
2. Coordinates sent to `GET /barbershops/nearby?lat=-23.5&lng=-46.6&radius=5000`
3. API uses PostgreSQL `earthdistance` extension (built on `cube`)
4. Returns barbershops within the radius

### Query
```sql
SELECT * FROM barbershops
WHERE earth_box(ll_to_earth(:lat, :lng), :radius_meters) @> ll_to_earth(lat, lng)
  AND earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(lat, lng)) <= :radius_meters
  AND active = true
```

### Fallback
- If geolocation permission denied → text search by city/neighborhood
- Requires `cube` and `earthdistance` PostgreSQL extensions
- GiST index on `ll_to_earth(lat, lng)`

## Consequences
- Requires PostgreSQL extensions enabled in Neon
- Manual coordinate entry via CEP + geocoding (Google Maps or Nominatim)
- Radius-based search, no map visualization in MVP
