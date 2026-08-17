import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Search, Loader2, X, LocateFixed, Plus, AlertTriangle, Flag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_CENTER = [25.2048, 55.2708]; // Dubai
const ROUTE_COLOR = '#0A84FF';

// Free geocoding via OpenStreetMap Nominatim (no API key needed)
const reverseGeocode = (lat, lon) =>
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
    headers: { 'Accept-Language': 'en' },
  })
    .then((r) => r.json())
    .then((d) => d.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);

const forwardGeocode = (q) =>
  fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}`, {
    headers: { 'Accept-Language': 'en' },
  })
    .then((r) => r.json())
    .then((d) => (d[0] ? { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: d[0].display_name } : null));

// Free routing via OSRM public demo server (no API key)
async function fetchRoute(coords) {
  if (!coords || coords.length < 2) return null;
  const coordStr = coords.map(([lat, lon]) => `${lon},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Route not found');
  const route = data.routes[0];
  const latLngs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  return {
    coordinates: latLngs,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

// Haversine straight-line distance (fallback)
function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ClickHandler({ onPick, busy }) {
  useMapEvents({
    click(e) {
      if (!busy) onPick(e.latlng);
    },
  });
  return null;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      try { map.invalidateSize(); } catch {}
    });
    ro.observe(container);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => { try { map.invalidateSize(); } catch {} }));
    return () => { ro.disconnect(); cancelAnimationFrame(id); };
  }, [map]);
  return null;
}

// Auto-fit bounds when pins or route change
function FitBounds({ fitCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!fitCoords || fitCoords.length < 2) return;
    try {
      map.fitBounds(fitCoords, { padding: [40, 40], maxZoom: 15, animate: true });
    } catch {}
  }, [fitCoords, map]);
  return null;
}

function TripMapPanel({ from, to, onSelectFrom, onSelectTo, onRouteInfo, tripType, collapsed = false, onToggleCollapse }) {
  const [active, setActive] = useState('from');
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [map, setMap] = useState(null);

  const applyPick = useCallback(
    (lat, lon, name) => {
      if (active === 'from') {
        setFromCoord([lat, lon]);
        onSelectFrom?.(name);
      } else if (active === 'to') {
        setToCoord([lat, lon]);
        onSelectTo?.(name);
      } else if (active === 'waypoint') {
        setWaypoints((prev) => [...prev, { coord: [lat, lon], name }]);
      }
    },
    [active, onSelectFrom, onSelectTo]
  );

  const handlePick = useCallback(
    async (latlng) => {
      setPicking(true);
      try {
        const name = await reverseGeocode(latlng.lat, latlng.lng);
        applyPick(latlng.lat, latlng.lng, name);
      } finally {
        setPicking(false);
      }
    },
    [applyPick]
  );

  const runSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await forwardGeocode(search.trim());
      if (res) applyPick(res.lat, res.lon, res.name);
      if (map && res) map.panTo([res.lat, res.lon]);
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setFromCoord(null);
    setToCoord(null);
    setWaypoints([]);
    setSearch('');
    setRouteCoords(null);
    setRouteInfo(null);
    setRouteError(false);
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setPicking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const name = await reverseGeocode(latitude, longitude);
          applyPick(latitude, longitude, name);
          map?.panTo([latitude, longitude]);
        } finally { setPicking(false); }
      },
      () => setPicking(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const removeWaypoint = (idx) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== idx));
  };

  // Route calculation effect
  useEffect(() => {
    if (!fromCoord || !toCoord) {
      setRouteCoords(null);
      setRouteInfo(null);
      setRouteError(false);
      return;
    }

    let cancelled = false;
    const allCoords = [fromCoord, ...waypoints.map((w) => w.coord), toCoord];

    const calc = async () => {
      setRouteLoading(true);
      setRouteError(false);
      try {
        const route = await fetchRoute(allCoords);
        if (cancelled) return;
        if (route) {
          setRouteCoords(route.coordinates);
          setRouteInfo({
            distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
            durationHours: Math.round((route.durationSeconds / 3600) * 100) / 100,
            durationLabel: formatDuration(route.durationSeconds),
            isStraightLine: false,
          });
        }
      } catch (err) {
        if (cancelled) return;
        // Fallback: straight-line distance
        setRouteCoords([fromCoord, ...waypoints.map((w) => w.coord), toCoord]);
        let totalMeters = 0;
        for (let i = 0; i < allCoords.length - 1; i++) {
          totalMeters += haversineMeters(allCoords[i], allCoords[i + 1]);
        }
        setRouteInfo({
          distanceKm: Math.round((totalMeters / 1000) * 10) / 10,
          durationHours: null,
          durationLabel: null,
          isStraightLine: true,
        });
        setRouteError(true);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    const debounce = setTimeout(calc, 300);
    return () => { cancelled = true; clearTimeout(debounce); };
  }, [fromCoord, toCoord, waypoints]);

  // Notify parent of route info changes
  useEffect(() => {
    if (onRouteInfo && routeInfo) {
      onRouteInfo(routeInfo);
    }
  }, [routeInfo, onRouteInfo]);

  // Compute fit coordinates for auto-fit
  const fitCoords = routeCoords
    ? routeCoords
    : [fromCoord, ...waypoints.map((w) => w.coord), toCoord].filter(Boolean);

  const refCb = (m) => setMap(m);

  return (
    <div className="glass-card overflow-hidden">
      <div className={cn("p-3 space-y-2.5", !collapsed && "border-b border-white/10")}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button type="button" onClick={onToggleCollapse} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location Picker</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", !collapsed && "rotate-180")} />
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActive('from')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                active === 'from'
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="w-3 h-3" /> From
            </button>
            <button
              onClick={() => setActive('to')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                active === 'to'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flag className="w-3 h-3" /> To
            </button>
            <button
              onClick={() => setActive('waypoint')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                active === 'waypoint'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
              title="Add intermediate waypoint"
            >
              <Plus className="w-3 h-3" /> WP
            </button>
            <button
              onClick={locate}
              title="Use current location"
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-primary hover:text-primary flex items-center justify-center"
            >
              <LocateFixed className="w-3 h-3" />
            </button>
            <button
              onClick={reset}
              title="Clear markers"
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!collapsed && (
        <>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              placeholder={`Search ${active} location...`}
              className="w-full h-8 pl-8 pr-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={searching}
            className="h-8 px-3 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          {picking ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Fetching address...</>
          ) : (
            <>
              <MapPin className="w-3 h-3" /> Click map to set{' '}
              <span className={
                active === 'from' ? 'text-primary font-semibold' :
                active === 'to' ? 'text-emerald-300 font-semibold' :
                'text-amber-300 font-semibold'
              }>
                {active === 'waypoint' ? 'waypoint' : active}
              </span>{' '}
              location
            </>
          )}
        </p>

        {/* Waypoint list */}
        {waypoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {waypoints.map((wp, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full px-2 py-0.5">
                WP{i + 1}: {wp.name?.split(',')[0] || `${wp.coord[0].toFixed(3)}, ${wp.coord[1].toFixed(3)}`}
                <button onClick={() => removeWaypoint(i)} className="hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      {/* Map stays mounted to avoid expensive Leaflet re-init on every expand/collapse.
           Height transitions smoothly instead of conditional mount/unmount.
           When collapsed, inert prevents Leaflet's tabindex=0 container from
           stealing focus and freezing the Radix Dialog's close buttons. */}
      <div
        className={cn("relative overflow-hidden transition-[height] duration-200", collapsed ? "h-0 pointer-events-none" : "h-[300px]")}
        {...(collapsed ? { inert: '' } : {})}
        aria-hidden={collapsed || undefined}
      >
        <MapContainer center={DEFAULT_CENTER} zoom={11} className="w-full h-full" ref={refCb} zoomControl>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri, Maxar, Earthstar Geographics'
            maxZoom={19}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={19}
          />
          <MapResizeFix />
          <FitBounds fitCoords={fitCoords} />
          <ClickHandler onPick={handlePick} busy={picking} />
          {fromCoord && (
            <CircleMarker center={fromCoord} radius={9} pathOptions={{ color: '#1ED760', fillColor: '#1ED760', fillOpacity: 0.7, weight: 2 }}>
              <Tooltip sticky>From: {from}</Tooltip>
            </CircleMarker>
          )}
          {toCoord && (
            <CircleMarker center={toCoord} radius={9} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.7, weight: 2 }}>
              <Tooltip sticky>To: {to}</Tooltip>
            </CircleMarker>
          )}
          {waypoints.map((wp, i) => (
            <CircleMarker key={i} center={wp.coord} radius={7} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.7, weight: 2 }}>
              <Tooltip sticky>WP{i + 1}: {wp.name}</Tooltip>
            </CircleMarker>
          ))}
          {routeCoords && routeCoords.length >= 2 && (
            <>
              {/* Glow layer */}
              <Polyline positions={routeCoords} pathOptions={{ color: ROUTE_COLOR, weight: 10, opacity: 0.2 }} />
              {/* White outline */}
              <Polyline positions={routeCoords} pathOptions={{ color: '#ffffff', weight: 5, opacity: 0.6 }} />
              {/* Main route line */}
              <Polyline positions={routeCoords} pathOptions={{ color: ROUTE_COLOR, weight: 3.5, opacity: 0.9 }} />
            </>
          )}
        </MapContainer>

        {/* Route info overlay */}
        {routeInfo && (
          <div className="absolute bottom-2 left-2 z-[1000] glass-card !rounded-lg px-3 py-2 space-y-1 max-w-[220px]">
            {routeLoading ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Calculating route...
              </div>
            ) : routeInfo.isStraightLine ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> Route unavailable — straight-line estimate
                </div>
                <div className="text-[11px] text-foreground">
                  <span className="text-muted-foreground">Distance: </span>
                  <span className="font-bold tabular-nums">{routeInfo.distanceKm} km</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-foreground">
                  <span className="text-muted-foreground">Distance: </span>
                  <span className="font-bold tabular-nums">{routeInfo.distanceKm} km</span>
                </div>
                {routeInfo.durationLabel && (
                  <div className="text-[11px] text-foreground">
                    <span className="text-muted-foreground">Drive time: </span>
                    <span className="font-bold tabular-nums">{routeInfo.durationLabel}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TripMapPanel);