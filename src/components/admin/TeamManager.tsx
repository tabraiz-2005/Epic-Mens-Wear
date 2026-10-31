'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { addTeamMember, removeTeamMember } from '@/app/admin/_actions/store';
import { Field, Notice } from './FormBits';
import { Badge } from './Page';

export function TeamManager({
  owners,
  members,
  canManage,
  meId,
}: {
  owners: string[];
  members: { user_id: string; email: string; role: string; created_at: string }[];
  canManage: boolean;
  meId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'owner'>('staff');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      {msg && <Notice kind={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}
      <div className="border border-line bg-surface">
        <div className="border-b border-line px-5 py-3.5 font-display text-[12px] font-semibold uppercase tracking-label">People with admin access</div>
        <ul className="divide-y divide-line">
          {owners.map((e) => (
            <li key={e} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{e}</span>
              <span className="flex items-center gap-2"><Badge tone="green">Owner</Badge><span className="text-xs text-subtle">via ADMIN_EMAILS</span></span>
            </li>
          ))}
          {members.filter((m) => !owners.includes(m.email)).map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>{m.email}</span>
              <span className="flex items-center gap-3">
                <Badge tone={m.role === 'owner' ? 'green' : 'grey'}>{m.role}</Badge>
                {canManage && m.user_id !== meId && (
                  <button
                    type="button"
                    className="text-xs text-muted underline hover:text-danger"
                    onClick={() =>
                      confirm(`Remove admin access for ${m.email}?`) &&
                      start(async () => {
                        const r = await removeTeamMember(m.user_id);
                        setMsg(r.ok ? { ok: true, text: 'Access removed.' } : { ok: false, text: r.error });
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {canManage ? (
        <form
          className="border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await addTeamMember(email, password, role);
              setMsg(r.ok ? { ok: true, text: r.message ?? 'Added.' } : { ok: false, text: r.error });
              if (r.ok) {
                setEmail('');
                setPassword('');
                router.refresh();
              }
            });
          }}
        >
          <h2 className="font-display text-[12px] font-semibold uppercase tracking-label">Add a team member</h2>
          <p className="mt-1 text-sm text-muted">They sign in at <code className="text-xs">/admin</code> with this email and temporary password, then change it under their account.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
            <Field label="Email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></Field>
            <Field label="Temporary password"><input required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field" /></Field>
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as 'staff')} className="field">
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
            </Field>
            <button type="submit" disabled={pending} className="btn-primary h-12 px-6">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Add</button>
          </div>
          <p className="mt-3 text-xs text-subtle">Staff can manage products, stock, orders and settings. Owners can also add and remove team members.</p>
        </form>
      ) : (
        <Notice kind="info">Only owners can add or remove team members.</Notice>
      )}
    </div>
  );
}
