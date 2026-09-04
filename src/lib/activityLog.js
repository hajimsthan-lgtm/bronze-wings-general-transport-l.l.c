import { base44 } from '@/api/base44Client';

/**
 * Logs a user activity event to the ActivityLog entity.
 * Silently fails — logging must never break the main action.
 *
 * @param {Object} params
 * @param {string} params.action - One of: create, update, delete, login, logout, export, import, status_change, payment, view, other
 * @param {string} [params.entityType] - Entity type (e.g. "Trip", "Invoice", "Client")
 * @param {string} [params.entityName] - Name/identifier of the affected entity
 * @param {string} [params.details] - Additional context
 */
export async function logActivity({ action, entityType, entityName, details }) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.ActivityLog.create({
      user_name: user?.full_name || user?.email || 'System',
      user_id: user?.id || '',
      action: action || 'other',
      entity_type: entityType || '',
      entity_name: entityName || '',
      details: details || '',
    });
  } catch {
    // Silently fail — logging should never break the main action
  }
}