import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface ClickHandlerProps {
  onPick: (lat: number, lng: number) => void;
}

const ClickHandler = ({ onPick }: ClickHandlerProps) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const FlyTo = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15); }, [lat, lng]);
  return null;
};

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  address?: string;
  onChange: (lat: number, lng: number, address: string) => void;
  disabled?: boolean;
}

export const LocationPicker = ({ lat, lng, address, onChange, disabled }: LocationPickerProps) => {
  const [pinLat, setPinLat] = useState<number | undefined>(lat);
  const [pinLng, setPinLng] = useState<number | undefined>(lng);
  const [searchQuery, setSearchQuery] = useState(address || '');
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const defaultCenter: [number, number] = pinLat && pinLng
    ? [pinLat, pinLng]
    : [36.8065, 10.1815]; // Default: Tunis

  const handlePick = async (lat: number, lng: number) => {
    if (disabled) return;
    setPinLat(lat);
    setPinLng(lng);

    // Reverse geocode to get address
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchQuery(addr);
      onChange(lat, lng, addr);
    } catch {
      const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchQuery(addr);
      onChange(lat, lng, addr);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const addr = data[0].display_name?.split(',').slice(0, 3).join(', ') || searchQuery;
        setPinLat(lat);
        setPinLng(lng);
        setSearchQuery(addr);
        setFlyTarget({ lat, lng });
        onChange(lat, lng, addr);
      }
    } catch {}
    setSearching(false);
  };

  return (
    <div className="space-y-2">
      {/* Search bar */}
      {!disabled && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search address or click on map..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {pinLat && pinLng && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>{searchQuery || `${pinLat.toFixed(5)}, ${pinLng.toFixed(5)}`}</span>
        </div>
      )}

      {/* Map */}
      <div className="h-64 rounded-lg border overflow-hidden">
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!disabled && <ClickHandler onPick={handlePick} />}
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {pinLat && pinLng && (
            <Marker position={[pinLat, pinLng]} icon={redIcon} />
          )}
        </MapContainer>
      </div>

      {!disabled && (
        <p className="text-xs text-muted-foreground">
          Click anywhere on the map to set your clinic location, or search by address above.
        </p>
      )}
    </div>
  );
};
