import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Search, Loader2, X, LocateFixed } from 'lucide-react';

const DEFAULT_CENTER = [25.2048, 55.2708]; // Dubai

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

function ClickHandler({ onPick, busy }) {
  useMapEvents({
    click(e) {
      if (!busy) onPick(e.latlng);
    },
  });
  return null;
}

// Re-measures the map once it's laid out (handles Dialog open animation)
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

export default function TripMapPanel({ from, to, onSelectFrom, onSelectTo }) {
  const [active, setActive] = useState('from');
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [map, setMap] = useState(null);

  const applyPick = useCallback(
    (lat, lon, name) => {
      if (active === 'from') {
        setFromCoord([lat, lon]);
        onSelectFrom?.(name);
      } else {
        setToCoord([lat, lon]);
        onSelectTo?.(name);
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
      map?.panTo([res ? res.lat : 0, res ? res.lon : 0]);
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setFromCoord(null);
    setToCoord(null);
    setSearch('');
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

  const refCb = (m) => setMap(m);

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-3 border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location Picker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActive('from')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                active === 'from'
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              From
            </button>
            <button
              onClick={() => setActive('to')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                active === 'to'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              To
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

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
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
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching address...
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3" /> Click map to set{' '}
              <span className={active === 'from' ? 'text-primary font-semibold' : 'text-emerald-300 font-semibold'}>
                {active}
              </span>{' '}
              location
            </>
          )}
        </p>
      </div>

      <div className="relative" style={{ height: 300 }}>
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
          {fromCoord && toCoord && (
            <Polyline positions={[fromCoord, toCoord]} pathOptions={{ color: '#4ADE80', weight: 2, dashArray: '6 8' }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}