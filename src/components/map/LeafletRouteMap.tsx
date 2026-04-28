import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const doctorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface Props {
  docLat: number;
  docLng: number;
  patientLat?: number;
  patientLng?: number;
  doctorName: string;
  doctorAddress?: string;
}

// Draw route using OSRM (free, no API key)
const RouteLayer = ({ patientLat, patientLng, docLat, docLng }: {
  patientLat: number; patientLng: number; docLat: number; docLng: number;
}) => {
  const map = useMap();
  const routeRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${patientLng},${patientLat};${docLng},${docLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          // Remove old route
          if (routeRef.current) {
            routeRef.current.remove();
          }

          // Draw new route
          routeRef.current = L.polyline(coords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }).addTo(map);

          // Fit map to route
          map.fitBounds(routeRef.current.getBounds(), { padding: [30, 30] });
        }
      } catch {
        // If routing fails, just fit bounds to both markers
        map.fitBounds(
          L.latLngBounds([[patientLat, patientLng], [docLat, docLng]]),
          { padding: [40, 40] }
        );
      }
    };

    fetchRoute();

    return () => {
      if (routeRef.current) {
        routeRef.current.remove();
        routeRef.current = null;
      }
    };
  }, [patientLat, patientLng, docLat, docLng, map]);

  return null;
};

// Fit to doctor marker when no patient location
const FitToDoctor = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
};

const LeafletRouteMap = ({ docLat, docLng, patientLat, patientLng, doctorName, doctorAddress }: Props) => {
  return (
    <MapContainer
      center={[docLat, docLng]}
      zoom={14}
      style={{ height: '300px', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Doctor marker */}
      <Marker position={[docLat, docLng]} icon={doctorIcon}>
        <Popup>
          <div className="space-y-0.5">
            <p className="font-semibold text-sm">🏥 {doctorName}</p>
            {doctorAddress && <p className="text-xs text-gray-500">{doctorAddress}</p>}
          </div>
        </Popup>
      </Marker>

      {/* Patient marker + route */}
      {patientLat && patientLng ? (
        <>
          <Marker position={[patientLat, patientLng]} icon={patientIcon}>
            <Popup><p className="text-sm font-medium">📍 Your Location</p></Popup>
          </Marker>
          <RouteLayer
            patientLat={patientLat}
            patientLng={patientLng}
            docLat={docLat}
            docLng={docLng}
          />
        </>
      ) : (
        <FitToDoctor lat={docLat} lng={docLng} />
      )}
    </MapContainer>
  );
};

export default LeafletRouteMap;
