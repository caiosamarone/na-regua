const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "NaRegua/1.0" },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;

  if (data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
