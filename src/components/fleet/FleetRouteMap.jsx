import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const DEFAULT_CENTER = [25.2048, 55.2708];

const forwardGeocode = (q) =>
  fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}`, {
    headers: { 'Accept-Language': 'en' },
  })
    .then((r) => r.json())
    .then((d) => (d[0] ? [parseFloat(d[0].lat), parseFloat(d[0].lon)] : null))
    .catch(() => null);

function MapReady({ points }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => { try { map.invalidateSize(); } catch {} });
    ro.observe(map.getContainer());
    requestAnimationFrame(() => requestAnimationFrame(() => { try { map.invalidateSize(); } catch {} }));
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length >= 2) map.fitBounds(valid, { padding: [40, 40], maxZoom: 13 });
    else if (valid.length === 1) map.setView(valid[0], 12);
  }, [points, map]);
  return null;
}

export default function FleetRouteMap({ from, to, fromTime, toTime }) {
  const [coords, setCoords] = useState([null, null]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!from && !to) { setCoords([null, null]); return; }
    setLoading(true);
    Promise.all([
      from ? forwardGeocode(from) : Promise.resolve(null),
      to ? forwardGeocode(to) : Promise.resolve(null),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setCoords([a, b]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [from, to]);

  const [fromCoord, toCoord] = coords;
  const hasCoords = fromCoord || toCoord;

  const timeline = [
    { type: 'start', time: fromTime, location: from },
    { type: 'finish', time: toTime, location: to },
  ].filter((p) => p.location);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Map */}
      <div className="glass-card overflow-hidden lg:col-span-3">
        <div className="p-3 border-b border-white/10 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Route Map</span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
        </div>
        <div className="relative" style={{ height: 340 }}>
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
              <MapReady points={coords} />
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

      {/* Timeline */}
      <div className="glass-card p-4 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trip Timeline</h3>
        </div>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
          {timeline.length === 0 && <p className="text-xs text-muted-foreground">No trip data</p>}
          {timeline.map((p, idx) => (
            <div key={idx} className={`relative ${idx < timeline.length - 1 ? 'mb-5' : ''}`}>
              <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-2 ${p.type === 'start' ? 'bg-primary ring-primary/20' : 'bg-emerald-500 ring-emerald-500/20'}`} />
              <p className="text-[11px] text-muted-foreground">{p.time || '—'}</p>
              <p className="text-sm font-semibold text-foreground">{p.type === 'start' ? 'Start Point' : 'Finish Point'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}