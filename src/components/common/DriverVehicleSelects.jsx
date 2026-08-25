import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, Wallet } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import { fetchDriverWalletBalance } from '@/lib/driverWallet';
import { formatCurrency } from '@/lib/formatters';

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/**
 * Shared avatar-style Driver + Vehicle searchable dropdowns.
 * Used by Fuel and Maintenance forms to match the Trip form's look.
 *
 * Props:
 *  - driverValue, vehicleValue: current selected names
 *  - onDriverChange(name, driverObj), onVehicleChange(plate, vehicleObj)
 *  - driverError, vehicleError: optional error class strings
 */
export default function DriverVehicleSelects({
  driverValue,
  vehicleValue,
  onDriverChange,
  onVehicleChange,
  driverError = '',
  vehicleError = '',
}) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    base44.entities.Driver.list('-created_date', 200).catch(() => []).then((d) => setDrivers((d || []).filter((x) => !x.vendor_name)));
    base44.entities.Vehicle.list('-created_date', 200).catch(() => []).then((v) => setVehicles((v || []).filter((x) => !x.vendor_name)));
  }, []);

  const selectedDriver = drivers.find((d) => d.name === driverValue);
  const selectedVehicle = vehicles.find((v) => v.plate_number === vehicleValue);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Driver */}
      <div>
        <SearchableSelect
          value={driverValue || ''}
          onChange={(v, item) => onDriverChange(v, item?.raw)}
          placeholder="Select driver"
          className={driverError}
          renderLabel={(it) => (
            <span className="flex items-center gap-2 truncate">
              {selectedDriver?.image_url ? (
                <img src={selectedDriver.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
                  {initials(it.label)}
                </span>
              )}
              <span className="truncate">{it.label}</span>
            </span>
          )}
          items={drivers.map((d) => ({
            value: d.name,
            label: d.name,
            search: d.phone ? ` ${d.phone}` : '',
            raw: d,
            content: (
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                  {d.image_url ? (
                    <img src={d.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials(d.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {d.phone || 'No phone'} · ID: {(d.id || '').slice(0, 8)}
                  </p>
                </div>
                {d.status && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    d.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {d.status}
                  </span>
                )}
              </div>
            ),
          }))}
        />
      </div>

      {/* Vehicle */}
      <div>
        <SearchableSelect
          value={vehicleValue || ''}
          onChange={(v, item) => onVehicleChange(v, item?.raw)}
          placeholder="Select vehicle"
          className={vehicleError}
          renderLabel={(it) => (
            <span className="flex items-center gap-2 truncate">
              {selectedVehicle?.image_url ? (
                <img src={selectedVehicle.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-3 h-3" />
                </span>
              )}
              <span className="truncate">{it.label}</span>
            </span>
          )}
          items={vehicles.map((v) => ({
            value: v.plate_number,
            label: v.plate_number,
            search: v.make && v.model ? ` ${v.make} ${v.model}` : (v.make ? ` ${v.make}` : ''),
            raw: v,
            content: (
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                  {v.image_url ? (
                    <img src={v.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Truck className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{v.plate_number}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {[v.make, v.model].filter(Boolean).join(' ') || 'No model'} · ID: {(v.id || '').slice(0, 8)}
                  </p>
                </div>
                {v.status && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {v.status}
                  </span>
                )}
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}

/**
 * PettyWalletBadge — shows the selected driver's current petty cash balance.
 * Displays a wallet icon + formatted balance, color-coded (green = positive, red = negative).
 *
 * Props:
 *  - driverId: string (the selected driver's entity ID)
 */
export function PettyWalletBadge({ driverId }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!driverId) { setBalance(null); return; }
    let cancelled = false;
    fetchDriverWalletBalance(driverId).then((b) => { if (!cancelled) setBalance(b); });
    return () => { cancelled = true; };
  }, [driverId]);

  if (!driverId || balance === null) return null;

  const positive = balance >= 0;
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
      positive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
    }`}>
      <Wallet className="w-3 h-3" />
      Petty Wallet Balance: {formatCurrency(Math.abs(balance))}
      {balance < 0 && ' (overdrawn)'}
    </div>
  );
}