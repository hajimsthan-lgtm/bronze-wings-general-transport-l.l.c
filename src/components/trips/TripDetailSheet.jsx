import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Pencil, Trash2, MapPin, User, Truck, FileText, Calendar, Clock, RotateCcw, Paperclip, DollarSign, Receipt, Mail, Phone } from 'lucide-react';
import TripProfitSummary from './TripProfitSummary';
import QuickReceipt from './QuickReceipt';

export default function TripDetailSheet({ trip, onClose, onEdit, onDelete, contactPersons }) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (!trip) return null;

  const contactInfo = contactPersons?.find(cp => cp.name === trip.contact_person);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(trip);
    setDeleting(false);
  };

  return (
    <>
    <Sheet open={!!trip} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-foreground">{t('trip_details')}</SheetTitle>
            <StatusBadge status={trip.status} />
          </div>
        </SheetHeader>

        {/* Route */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-0.5 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="w-px h-6 bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{trip.from_location}</p>
              <p className="text-sm font-medium text-foreground mt-3">{trip.to_location}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <DetailRow icon={User} label={t('driver')} value={trip.driver_name} />
          <DetailRow icon={Truck} label={t('vehicle')} value={trip.vehicle_plate} />
          <DetailRow icon={FileText} label="Delivery Note #" value={trip.delivery_note_number || '—'} />
          <DetailRow icon={Clock} label="Trip Type" value={(trip.trip_type || 'one_way').replace(/_/g, ' ')} />
          {trip.trip_type === 'hourly' && trip.hours > 0 && (
            <DetailRow icon={Clock} label="Hours" value={trip.hours} />
          )}
          {trip.trip_type === 'return' && trip.return_trip_number && (
            <DetailRow icon={RotateCcw} label="Return Of" value={trip.return_trip_number} />
          )}
          <DetailRow icon={Calendar} label={t('date')} value={formatDate(trip.trip_date)} />
          <DetailRow icon={MapPin} label={t('distance')} value={trip.distance_km ? `${trip.distance_km} km` : '—'} />
          <DetailRow icon={DollarSign} label={t('payment_status')} value={(trip.payment_status || 'corporate_credit').replace(/_/g, ' ')} />
        </div>

        {/* Contact Person */}
        {trip.contact_person && (
          <div className="glass-card p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Person</h3>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{trip.contact_person}</p>
                {contactInfo?.department && <p className="text-[10px] text-primary">{contactInfo.department}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {contactInfo?.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{contactInfo.email}</span>}
                  {contactInfo?.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{contactInfo.phone}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profit Summary */}
        <TripProfitSummary trip={trip} />

        {trip.delivery_note_url && (
          <div className="glass-card p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delivery Note</h3>
            <a href={trip.delivery_note_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Paperclip className="w-4 h-4" /> View Attachment
            </a>
          </div>
        )}

        {trip.notes && (
          <div className="glass-card p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('notes')}</h3>
            <p className="text-sm text-foreground">{trip.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setReceiptOpen(true)} className="flex-1 border-border">
            <Receipt className="w-4 h-4 mr-1.5" /> {t('quick_receipt')}
          </Button>
          <Button variant="outline" onClick={() => onEdit(trip)} className="flex-1 border-border">
            <Pencil className="w-4 h-4 mr-1.5" /> {t('edit')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">{t('delete')} Trip?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                  {deleting ? t('loading') : t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
    <QuickReceipt trip={trip} open={receiptOpen} onOpenChange={setReceiptOpen} />
    </>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}