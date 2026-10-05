"use client";

import { useCallback, useEffect, useState } from "react";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "pharmacist" | "pharmacy_admin" | string;
  isActive: boolean;
  createdAt: string;
  inviteStatus: "active" | "pending" | "expired";
  pharmacyId: string | null;
  pharmacyName: string | null;
  alsoWorksAt: Array<{ id: string; name: string }>;
}

interface Branch { id: string; name: string }

export function StaffClient({ currentUserId }: { currentUserId: string }) {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingBranches, setEditingBranches] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/staff");
      const data = (await res.json()) as { staff?: StaffRow[]; branches?: Branch[]; error?: string };
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setStaff(data.staff ?? []);
      setBranches(data.branches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/dashboard/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Failed (${res.status})`);
      return;
    }
    refresh();
  }

  async function changeRole(id: string, role: "pharmacist" | "pharmacy_admin") {
    const res = await fetch(`/api/dashboard/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Failed (${res.status})`);
      return;
    }
    refresh();
  }

  async function saveBranches(id: string, pharmacyId: string, alsoWorksAt: string[]) {
    const res = await fetch(`/api/dashboard/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pharmacyId, alsoWorksAt }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Failed (${res.status})`);
      return;
    }
    setEditingBranches(null);
    refresh();
  }

  async function resendInvite(id: string) {
    const res = await fetch(`/api/dashboard/staff/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend_invite" }),
    });
    const data = (await res.json()) as { ok?: boolean; setupUrl?: string; emailed?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error || `Failed (${res.status})`);
      return;
    }
    setNotice(data.emailed ? "Invite re-sent by email." : `Email not sent. Send this link to them: ${data.setupUrl ?? ""}`);
    refresh();
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{loading ? "Loading…" : `${staff.length} staff`}</div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 text-white text-sm font-semibold rounded-md inline-flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Invite staff
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-900">{error}</div>
      )}
      {notice && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-900 break-all">{notice} <button onClick={() => setNotice(null)} className="ml-2 text-xs underline">Dismiss</button></div>
      )}
      {branches.length > 1 && (
        <p className="mb-3 text-xs text-gray-500">Showing staff across all {branches.length} branches in your group. Each person has a home branch; tick any other branches they also work at and they can switch between them from their dashboard.</p>
      )}

      {/* Staff table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Branch</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic text-sm">
                    No staff yet. Click "Invite staff" to add your first one.
                  </td>
                </tr>
              )}
              {staff.map((s) => {
                const isSelf = s.id === currentUserId;
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${!s.isActive ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.firstName} {s.lastName}</div>
                      {isSelf && <div className="text-[11px] text-[color:var(--tenant-primary)]">(you)</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.email}</td>
                    <td className="px-4 py-3">
                      {editingBranches === s.id ? (
                        <BranchEditor
                          branches={branches}
                          homeId={s.pharmacyId}
                          alsoIds={s.alsoWorksAt.map((b) => b.id)}
                          onCancel={() => setEditingBranches(null)}
                          onSave={(home, also) => saveBranches(s.id, home, also)}
                        />
                      ) : (
                        <div className="text-gray-700">
                          <div>{s.pharmacyName ?? "—"}</div>
                          {s.alsoWorksAt.length > 0 && (
                            <div className="text-[11px] text-gray-500">also {s.alsoWorksAt.map((b) => b.name).join(", ")}</div>
                          )}
                          {branches.length > 1 && !isSelf && (
                            <button type="button" onClick={() => setEditingBranches(s.id)} className="text-[11px] text-[color:var(--tenant-primary)] hover:underline">Change branches</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-gray-700">{labelForRole(s.role)}</span>
                      ) : (
                        <select
                          value={s.role}
                          onChange={(e) => changeRole(s.id, e.target.value as "pharmacist" | "pharmacy_admin")}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!s.isActive}
                        >
                          <option value="pharmacist">Pharmacist</option>
                          <option value="pharmacy_admin">Pharmacy admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill row={s} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {s.inviteStatus !== "active" && !isSelf && (
                        <button
                          type="button"
                          onClick={() => resendInvite(s.id)}
                          className="text-xs text-[color:var(--tenant-primary)] hover:text-[color:var(--tenant-primary)]"
                        >
                          Resend invite
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => toggleActive(s.id, s.isActive)}
                          className={`text-xs ${s.isActive ? "text-red-600 hover:text-red-700" : "text-green-700 hover:text-green-900"}`}
                        >
                          {s.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && <InviteModal branches={branches} onClose={() => setShowInvite(false)} onCreated={refresh} />}
    </div>
  );
}

function BranchEditor({ branches, homeId, alsoIds, onCancel, onSave }: {
  branches: Branch[];
  homeId: string | null;
  alsoIds: string[];
  onCancel: () => void;
  onSave: (home: string, also: string[]) => void;
}) {
  const [home, setHome] = useState(homeId ?? branches[0]?.id ?? "");
  const [also, setAlso] = useState<Set<string>>(new Set(alsoIds));
  return (
    <div className="space-y-2 text-xs">
      <div>
        <label className="block text-[11px] font-medium text-gray-600">Home branch</label>
        <select value={home} onChange={(e) => { setHome(e.target.value); setAlso((prev) => { const n = new Set(prev); n.delete(e.target.value); return n; }); }} className="px-2 py-1 border border-gray-300 rounded text-xs">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <div className="text-[11px] font-medium text-gray-600">Also works at</div>
        {branches.filter((b) => b.id !== home).map((b) => (
          <label key={b.id} className="flex items-center gap-1.5">
            <input type="checkbox" checked={also.has(b.id)} onChange={(e) => setAlso((prev) => { const n = new Set(prev); if (e.target.checked) n.add(b.id); else n.delete(b.id); return n; })} />
            {b.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave(home, [...also])} className="px-2 py-1 bg-[color:var(--tenant-primary)] text-white rounded">Save</button>
        <button type="button" onClick={onCancel} className="px-2 py-1 text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

function labelForRole(role: string): string {
  if (role === "pharmacy_admin") return "Pharmacy admin";
  if (role === "pharmacist") return "Pharmacist";
  if (role === "super_admin") return "Super admin";
  return role;
}

function StatusPill({ row }: { row: StaffRow }) {
  if (!row.isActive) {
    return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold uppercase">Deactivated</span>;
  }
  if (row.inviteStatus === "pending") {
    return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase">Invite pending</span>;
  }
  if (row.inviteStatus === "expired") {
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-semibold uppercase">Invite expired</span>;
  }
  return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold uppercase">Active</span>;
}

function InviteModal({ branches, onClose, onCreated }: { branches: Branch[]; onClose: () => void; onCreated: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"pharmacist" | "pharmacy_admin">("pharmacist");
  const [pharmacyId, setPharmacyId] = useState<string>(branches[0]?.id ?? "");
  const [also, setAlso] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ setupUrl: string; emailed: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, role, pharmacyId: pharmacyId || undefined, alsoWorksAt: [...also] }),
      });
      const data = (await res.json()) as { ok?: boolean; setupUrl?: string; emailed?: boolean; error?: string; warnings?: string[] };
      if (!res.ok || !data.ok) {
        setError(data.error || `Failed (${res.status})`);
        return;
      }
      if (data.warnings?.length) setError(`Account created, but: ${data.warnings.join("; ")}. Use "Change branches" to fix their branch list.`);
      setResult({ setupUrl: data.setupUrl ?? "", emailed: Boolean(data.emailed) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Invite a staff member</h2>
        </div>
        {result ? (
          <div className="p-5 space-y-3">
            {result.emailed ? (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded-md">
                ✓ Invite sent by email. The link expires in 7 days.
              </p>
            ) : (
              <>
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-md">
                  User created but email failed. Copy the link below and send it to them manually:
                </p>
                <input
                  readOnly
                  value={result.setupUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono"
                />
              </>
            )}
            <div className="text-right">
              <button onClick={onClose} className="px-4 py-2 bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 text-white text-sm rounded-md">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              <p className="text-[11px] text-gray-500 mt-1">They'll get a set-password link at this address.</p>
            </div>
            {branches.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Home branch</label>
                <select value={pharmacyId} onChange={(e) => { setPharmacyId(e.target.value); setAlso((prev) => { const n = new Set(prev); n.delete(e.target.value); return n; }); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="mt-2 text-xs font-medium text-gray-700">Also works at</div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {branches.filter((b) => b.id !== pharmacyId).map((b) => (
                    <label key={b.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                      <input type="checkbox" checked={also.has(b.id)} onChange={(e) => setAlso((prev) => { const n = new Set(prev); if (e.target.checked) n.add(b.id); else n.delete(b.id); return n; })} />
                      {b.name}
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Their records are filed under whichever branch they choose to work at when they log in.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "pharmacist" | "pharmacy_admin")} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="pharmacist">Pharmacist — can deliver consultations</option>
                <option value="pharmacy_admin">Pharmacy admin — can also manage staff</option>
              </select>
            </div>
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-900">{error}</div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} disabled={busy} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 text-white text-sm font-semibold rounded-md disabled:opacity-60">
                {busy ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
