import TripStatusBadge from './TripStatusBadge';

/**
 * Kept for backward compatibility with existing imports — now renders a
 * READ-ONLY status badge (no dropdown). Status is automated; manual selection
 * is removed per the Trip Status Automator spec. onSelectStatus is ignored.
 */
export default function TripStatusDropdown({ trip, onSelectStatus: _onSelectStatus, size = 'sm' }) {
  return <TripStatusBadge trip={trip} size={size} />;
}