import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';

const DEFAULT_CENTER = [25.2048, 55.2708]; // Dubai

const forwardGeocode = (q) =>
  fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}`, {
    headers: { 'Accept-Language': 'en' },
  })
    .then((r) => r.json())
    .then((d) => (d[0] ? [parseFloat(d[0].lat), parseFloat(d[0].lon)] : null))
    .catch(() => null);

function MapReady({ fromCoord, toCoord }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => { try { map.invalidateSize(); } catch {} });
    ro.observe(map.getContainer());
    requestAnimationFrame(() => requestAnimationFrame(() => { try { map.invalidateSize(); } catch {} }));
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    if (fromCoord && toCoord) map.fitBounds([fromCoord, toCoord], { padding: [40, 40], maxZoom: 13 });
    else if (fromCoord || toCoord) map.setView(fromCoord || toCoord, 12);
  }, [fromCoord, toCoord, map]);
  return null;
}

export default function DriverTripMap({ from, to }) {
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!from && !to) { setFromCoord(null); setToCoord(null); return; }
    setLoading(true);
    Promise.all([
      from ? forwardGeocode(from) : Promise.resolve(null),
      to ? forwardGeocode(to) : Promise.resolve(null),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setFromCoord(a);
      setToCoord(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [from, to]);

  const hasCoords = fromCoord || toCoord;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Latest Trip Route</span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
      </div>
      <div className="relative" style={{ height: 320 }}>
        {hasCoords ? (
          <MapContainer center={fromCoord || toCoord || DEFAULT_CENTER} zoom={11} className="w-full h-full" zoomControl>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri, Maxar"
              maxZoom={19}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution=""
              maxZoom={19}
            />
            <MapReady fromCoord={fromCoord} toCoord={toCoord} />
            {fromCoord && (
              <CircleMarker center={fromCoord} radius={9} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 2 }}>
                <Tooltip sticky>Start: {from}</Tooltip>
              </CircleMarker>
            )}
            {toCoord && (
              <CircleMarker center={toCoord} radius={9} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8, weight: 2 }}>
                <Tooltip sticky>Finish: {to}</Tooltip>
              </CircleMarker>
            )}
            {fromCoord && toCoord && (
              <Polyline positions={[fromCoord, toCoord]} pathOptions={{ color: '#60a5fa', weight: 2.5, dashArray: '6 8' }} />
            )}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <MapPin className="w-6 h-6 opacity-50" />
            <p className="text-xs">{loading ? 'Loading route…' : 'No recent trip to display'}</p>
          </div>
        )}
      </div>
    </div>
  );
}