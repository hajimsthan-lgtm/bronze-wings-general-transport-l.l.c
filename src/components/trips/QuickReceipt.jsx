import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Printer } from 'lucide-react';

export default function QuickReceipt({ trip, open, onOpenChange }) {
  if (!trip) return null;

  const handlePrint = () => {
    const html = `<html><head><title>Receipt ${trip.trip_number || ''}</title>
      <style>
        body{font-family:monospace;color:#000;background:#fff;padding:40px;max-width:400px;margin:0 auto}
        h2{text-align:center;margin:0}
        .sub{text-align:center;color:#666;font-size:12px;margin:4px 0 12px}
        .div{border-top:1px solid #000;margin:12px 0}
        .row{display:flex;justify-content:space-between;margin:4px 0;font-size:14px}
        .total{font-size:18px;font-weight:bold}
        .ft{text-align:center;color:#666;font-size:11px;margin-top:24px}
      </style></head><body>
        <h2>BRONZE WINGS GT</h2>
        <p class="sub">Transportation &amp; Logistics</p>
        <div class="div"></div>
        <div class="row"><span>Receipt #</span><strong>${trip.trip_number || `#${trip.id?.slice(-6)}`}</strong></div>
        <div class="row"><span>Date</span><span>${formatDate(trip.trip_date)}</span></div>
        <div class="div"></div>
        <div class="row"><span>From</span><span>${trip.from_location || '—'}</span></div>
        <div class="row"><span>To</span><span>${trip.to_location || '—'}</span></div>
        <div class="row"><span>Client</span><span>${trip.client_name || '—'}</span></div>
        <div class="row"><span>Vehicle</span><span>${trip.vehicle_plate || '—'}</span></div>
        <div class="row"><span>Driver</span><span>${trip.driver_name || '—'}</span></div>
        <div class="div"></div>
        <div class="row"><span>Trip Type</span><span>${(trip.trip_type || 'one_way').replace(/_/g, ' ')}</span></div>
        ${trip.hours > 0 ? `<div class="row"><span>Hours</span><span>${trip.hours}</span></div>` : ''}
        ${trip.distance_km > 0 ? `<div class="row"><span>Distance</span><span>${trip.distance_km} km</span></div>` : ''}
        ${trip.delivery_note_number ? `<div class="row"><span>Delivery Note</span><span>${trip.delivery_note_number}</span></div>` : ''}
        <div class="div"></div>
        <div class="row total"><span>TOTAL</span><span>${formatCurrency(trip.revenue)}</span></div>
        <div class="row"><span>Payment</span><span>${(trip.payment_status || 'corporate_credit').replace(/_/g, ' ')}</span></div>
        <div class="ft"><p>Thank you for your business</p><p>${formatDate(trip.trip_date)}</p></div>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-black max-w-sm max-h-[90vh] overflow-y-auto p-0 rounded-lg">
        <DialogTitle className="sr-only">Receipt</DialogTitle>
        <div className="p-8" style={{ fontFamily: 'monospace' }}>
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">BRONZE WINGS GT</h2>
            <p className="text-xs text-gray-500">Transportation &amp; Logistics</p>
            <div className="border-t border-black mt-2" />
          </div>
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between"><span>Receipt #</span><span className="font-bold">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{formatDate(trip.trip_date)}</span></div>
          </div>
          <div className="border-t border-black pt-3 mb-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>From</span><span>{trip.from_location || '—'}</span></div>
            <div className="flex justify-between"><span>To</span><span>{trip.to_location || '—'}</span></div>
            <div className="flex justify-between"><span>Client</span><span>{trip.client_name || '—'}</span></div>
            <div className="flex justify-between"><span>Vehicle</span><span>{trip.vehicle_plate || '—'}</span></div>
            <div className="flex justify-between"><span>Driver</span><span>{trip.driver_name || '—'}</span></div>
          </div>
          <div className="border-t border-black pt-3 mb-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Trip Type</span><span className="capitalize">{(trip.trip_type || 'one_way').replace(/_/g, ' ')}</span></div>
            {trip.hours > 0 && <div className="flex justify-between"><span>Hours</span><span>{trip.hours}</span></div>}
            {trip.distance_km > 0 && <div className="flex justify-between"><span>Distance</span><span>{trip.distance_km} km</span></div>}
            {trip.delivery_note_number && <div className="flex justify-between"><span>Delivery Note</span><span>{trip.delivery_note_number}</span></div>}
          </div>
          <div className="border-t border-black pt-3">
            <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span>{formatCurrency(trip.revenue)}</span></div>
            <div className="flex justify-between text-xs mt-2"><span>Payment</span><span className="capitalize">{(trip.payment_status || 'corporate_credit').replace(/_/g, ' ')}</span></div>
          </div>
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Thank you for your business</p>
            <p className="mt-1">{formatDate(trip.trip_date)}</p>
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1 border-gray-300 text-black hover:bg-gray-100">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1 bg-black text-white hover:bg-gray-800">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}