# WebApp ADR 002: Geolocation UX

## Status

Accepted

## Context

End customers need to find nearby barbershops. The browser must request location permission and display results.

## Decision

### Flow
1. Customer visits "Find Barbershops" page
2. Browser prompts for geolocation permission
3. If granted → GPS coordinates sent to `GET /barbershops/search?q=&lat={lat}&lng={lng}&radiusKm=5`
4. Results displayed as a list with distance indicator
5. If denied → text search input appears (CEP, city, or neighborhood)
6. Customer selects a barbershop → sees services → books

### UX Considerations
- Clear explanation of **why** location is needed (not just "allow?")
- Test with `Denied` permission state — geolocation is optional
- Loading state while fetching position
- Error state if GPS times out or is unavailable
- Distance shown in km (e.g., "1.2 km")
- Empty state: "No barbershops found nearby"

### Implementation
- Browser Geolocation API via a custom React hook (`useGeolocation`)
- TanStack Query to manage the API call with the coordinates as query key
- No map component in MVP — simple list view

## Consequences
- Privacy-first: permission request explains the value
- Users who deny geolocation can still search by location name
- No map rendering keeps the MVP simple
