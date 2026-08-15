import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function MapComponent({ location, nearbyUsers }: { location: [number, number], nearbyUsers: any[] }) {
  return (
    <MapContainer 
      center={location} 
      zoom={13} 
      scrollWheelZoom={true} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={location}>
        <Popup>
          You are here!
        </Popup>
      </Marker>
      <Circle center={location} radius={5000} pathOptions={{ color: 'hsl(var(--brand))', fillColor: 'hsl(var(--brand))', fillOpacity: 0.1 }} />
      
      {nearbyUsers.map(user => (
        <Marker key={user.id} position={[user.lat, user.lng]}>
          <Popup>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.skill}</div>
            <div className="text-xs font-semibold mt-1">{user.rate} • ⭐ {user.rating}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
