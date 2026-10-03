const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  latitudeOne: number,
  longitudeOne: number,
  latitudeTwo: number,
  longitudeTwo: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeTwo - latitudeOne);
  const longitudeDelta = toRadians(longitudeTwo - longitudeOne);
  const latitudeOneRadians = toRadians(latitudeOne);
  const latitudeTwoRadians = toRadians(latitudeTwo);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeOneRadians) *
      Math.cos(latitudeTwoRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}