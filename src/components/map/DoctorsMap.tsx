import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Blue marker for patient location
const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green marker for doctors
const doctorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface DoctorMapPin {
  id: string;
  name: string;
  specialty?: string;
  clinicLocation?: string;
  lat: number;
  lng: number;
  distance?: number; // km
}

interface DoctorsMapProps {
  doctors: DoctorMapPin[];
  patientLat?: number;
  patientLng?: number;
  onSelectDoctor?: (doctorId: string) => void;
  selectedDoctorId?: string;
}

// Auto-fit bounds when doctors change
const FitBounds = ({ doctors, patientLat, patientLng }: { doctors: DoctorMapPin[]; patientLat?: number; patientLng?: number }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = doctors.map(d => [d.lat, d.lng]);
    if (patientLat && patientLng) points.push([patientLat, patientLng]);
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [doctors, patientLat, patientLng, map]);

  return null;
};

export const DoctorsMap = ({ doctors, patientLat, patientLng, onSelectDoctor, selectedDoctorId }: DoctorsMapProps) => {
  const defaultCenter: [number, number] = patientLat && patientLng
    ? [patientLat, patientLng]
    : doctors.length > 0
      ? [doctors[0].lat, doctors[0].lng]
      : [36.8065, 10.1815]; // Default: Tunis

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds doctors={doctors} patientLat={patientLat} patientLng={patientLng} />

      {/* Patient location */}
      {patientLat && patientLng && (
        <Marker position={[patientLat, patientLng]} icon={patientIcon}>
          <Popup>
            <div className="text-sm font-medium">📍 Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Doctor pins */}
      {doctors.map(doctor => (
        <Marker
          key={doctor.id}
          position={[doctor.lat, doctor.lng]}
          icon={doctorIcon}
          eventHandlers={{
            click: () => onSelectDoctor?.(doctor.id),
          }}
        >
          <Popup>
            <div className="space-y-1 min-w-[160px]">
              <p className="font-semibold text-sm">{doctor.name}</p>
              {doctor.specialty && <p className="text-xs text-gray-500">{doctor.specialty}</p>}
              {doctor.clinicLocation && <p className="text-xs">📍 {doctor.clinicLocation}</p>}
              {doctor.distance !== undefined && (
                <p className="text-xs font-medium text-green-600">
                  🚗 {doctor.distance < 1
                    ? `${Math.round(doctor.distance * 1000)} m away`
                    : `${doctor.distance.toFixed(1)} km away`}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
