# API ADR 007: Geolocation for Proximity Search

## Status

Accepted

## Context

End customers find barbershops near their current location.

## Decision

### Data Storage
- `Barbershop` table has `latitude` and `longitude` columns (Float, nullable)
- Populated during barbershop **creation** by Super Admin (CEP + address) and editable by **Barbershop Admin** thereafter
- On address change, API re-geocodes automatically

### Geocoding Provider
- **Nominatim (OpenStreetMap)** for MVP — free, no API key required
- Respect Nominatim usage policy and rate limits
- If geocoding fails ↓ save barbershop with null coordinates; barbershop appears in text search only until admin corrects address or triggers re-geocode
- Manual coordinate override available as a fallback


### Customer Flow
1. Browser requests geolocation permission
2. Coordinates sent to `GET /barbershops/search?q=&lat=-23.5&lng=-46.6&radiusKm=5`
3. API uses PostgreSQL `earthdistance` extension (built on `cube`)
4. Returns active barbershops within the radius that have non-null coordinates, ordered by distance

### Query
```sql
SELECT * FROM barbershops
WHERE earth_box(ll_to_earth(:lat, :lng), :radius_meters) @> ll_to_earth(lat, lng)
  AND earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(lat, lng)) <= :radius_meters
  AND active = true
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
```

### Fallback
- If geolocation permission denied → text search by name/city/neighborhood (mesmo endpoint, sem `lat`/`lng`/`radiusKm`)
- Requires `cube` and `earthdistance` PostgreSQL extensions
- GiST index on `ll_to_earth(lat, lng)`

## Consequences
- Requires PostgreSQL extensions enabled in Neon
- Barbershops without coordinates are discoverable via text search only
- Barbershop Admin owns address/coordinate updates post-creation (Super Admin does not edit barbershops after creation ℔ see ADS 002)
- Radius-based search, no map visualization in MVP
