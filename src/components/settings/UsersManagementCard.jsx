import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Mail, KeyRound, Shield, Pencil, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import SettingsCard from './SettingsCard';

export default function UsersManagementCard({ currentUser }) {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null); // user being edited
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.User.list();
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast({ title: 'Could not load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openEdit = (u) => {
    setEditUser(u);
    setEditName(u.full_name || '');
    setEditRole(u.role || 'user');
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const patch = { role: editRole };
      if (editName && editName !== editUser.full_name) {
        patch.full_name = editName;
      }
      await base44.entities.User.update(editUser.id, patch);
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...patch } : u)));
      toast({ title: 'User updated successfully' });
      setEditUser(null);
    } catch (err) {
      toast({ title: 'Could not update user', description: err?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (u) => {
    setResettingId(u.id);
    try {
      await base44.auth.resetPasswordRequest(u.email);
      toast({ title: `Password reset email sent to ${u.email}` });
    } catch (err) {
      toast({ title: 'Could not send reset email', description: err?.message, variant: 'destructive' });
    } finally {
      setResettingId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast({ title: `Invitation sent to ${inviteEmail.trim()}` });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('user');
      await loadUsers();
    } catch (err) {
      toast({ title: 'Could not send invitation', description: err?.message, variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <SettingsCard
      icon={Users}
      title="Current Users"
      description="Manage user names, roles, and passwords"
      action={
        <Button
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="btn-new-trip gap-1.5 h-8 px-3 text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite
        </Button>
      }
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email…"
          className="pl-9 bg-white/[0.03] border-white/[0.08]"
        />
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-white/40">No users found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const isSelf = currentUser && u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/12 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/15 border border-white/10 text-sm font-semibold text-white/80">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/90 truncate">
                      {u.full_name || 'Unnamed user'}
                    </p>
                    {isSelf && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{u.email}</p>
                </div>

                {/* Role badge */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    u.role === 'admin'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                      : 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                  }`}
                >
                  {u.role || 'user'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(u)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Edit user"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleResetPassword(u)}
                    disabled={resettingId === u.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-amber-400 hover:bg-amber-500/[0.08] transition-colors disabled:opacity-40"
                    title="Send password reset email"
                  >
                    {resettingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-blue-400" /> Edit User
            </DialogTitle>
            <DialogDescription>
              Update name and role for {editUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="user">
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> User
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="btn-new-trip gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an invitation email. The recipient will join with the selected role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="pl-9 bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="user">
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> User
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="btn-new-trip gap-1.5">
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsCard>
  );
}