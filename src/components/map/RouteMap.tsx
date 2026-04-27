import { useEffect, useState, lazy, Suspense } from 'react';
import { MapPin, LocateFixed, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load Leaflet to avoid SSR issues
const LeafletRouteMap = lazy(() => import('./LeafletRouteMap'));

interface RouteMapProps {
  doctorAddress: string;
  doctorLat?: number;
  doctorLng?: number;
  doctorName: string;
}

const geocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
};

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const RouteMap = ({ doctorAddress, doctorLat, doctorLng, doctorName }: RouteMapProps) => {
  const [patientCoords, setPatientCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [docCoords, setDocCoords] = useState<{ lat: number; lng: number } | null>(
    doctorLat && doctorLng ? { lat: doctorLat, lng: doctorLng } : null
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Geocode doctor address if no coords
  useEffect(() => {
    if (!docCoords && doctorAddress) {
      setGeocoding(true);
      geocode(doctorAddress).then(coords => {
        setDocCoords(coords);
        setGeocoding(false);
      });
    }
  }, [doctorAddress, doctorLat, doctorLng]);

  // Calculate distance when both coords available
  useEffect(() => {
    if (patientCoords && docCoords) {
      setDistance(haversine(patientCoords.lat, patientCoords.lng, docCoords.lat, docCoords.lng));
    }
  }, [patientCoords, docCoords]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPatientCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  if (!doctorAddress && !doctorLat) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">Clinic Location</span>
          {doctorAddress && <span className="text-muted-foreground">— {doctorAddress}</span>}
        </div>
        {distance !== null && (
          <span className="text-sm font-medium text-green-600 flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5" />
            {distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="h-64 rounded-lg border overflow-hidden bg-muted">
        {geocoding ? (
          <div className="h-full flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map...
          </div>
        ) : docCoords ? (
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <LeafletRouteMap
              docLat={docCoords.lat}
              docLng={docCoords.lng}
              patientLat={patientCoords?.lat}
              patientLng={patientCoords?.lng}
              doctorName={doctorName}
              doctorAddress={doctorAddress}
            />
          </Suspense>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Could not find clinic location on map
          </div>
        )}
      </div>

      {/* Locate me button */}
      {!patientCoords && docCoords && (
        <Button variant="outline" size="sm" onClick={handleLocate} disabled={locating} className="w-full">
          <LocateFixed className={`h-4 w-4 mr-2 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Getting your location...' : 'Show route from my location'}
        </Button>
      )}
      {patientCoords && (
        <Button variant="outline" size="sm" onClick={handleLocate} disabled={locating} className="w-full">
          <LocateFixed className="h-4 w-4 mr-2" />
          Update my location
        </Button>
      )}
    </div>
  );
};
