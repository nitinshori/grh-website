"use client";

import { useState } from "react";

interface Row {
  id: string;
  status: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyGphc: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactGphc: string;
  mandateId: string;
  mandateStatus: string;
  createdAt: string;
  rejectedReason: string;
}

const STATUS_FILTERS = ['all', 'awaiting_approval', 'approved', 'completed', 'rejected'] as const;


// Formatted with an explicit timezone so the server and the browser produce
// the same string. Without it the server renders in UTC and the browser in
// Europe/London, the text differs, React fails hydration (error #418) and
// discards the whole page: the onboarding queue rendered on the server but
// showed as blank, which is why Stag Chemist sat unseen for a day after
// paying. Any date rendered in a client component needs this treatment.
function formatSubmitted(value: string | Date): string {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London' })
}

export default function OnboardingQueueClient({ rows }: { rows: Row[] }) {
  const [list, setList] = useState<Row[]>(rows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('awaiting_approval');
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  const visible = filter === 'all' ? list : list.filter((r) => r.status === filter);

  async function handleApprove(id: string) {
    const feeStr = window.prompt("Monthly fee for this pharmacy in £ (ex. VAT)?\n\nThe customer's GoCardless mandate will be billed this amount monthly. Enter as a number, e.g. 495 for £495/month.");
    if (feeStr === null) return;
    const feePounds = parseFloat(feeStr.trim());
    if (!Number.isFinite(feePounds) || feePounds < 1) {
      alert('That doesn\'t look like a valid fee. Try again, e.g. 495');
      return;
    }
    const monthlyFeePence = Math.round(feePounds * 100);
    if (!window.confirm(`Approve this pharmacy at £${feePounds}/month?\n\nThis will:\n  • Create the pharmacy + first user, assign all PGDs\n  • Create a £${feePounds}/month subscription in GoCardless\n  • Email the contact a setup link.`)) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/onboarding/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyFeePence }),
      });
      const body = await r.json();
      if (!r.ok) { alert(`Could not approve: ${body.error || r.status}`); return; }
      if (body.subscriptionError) {
        alert(`Pharmacy provisioned but the GoCardless subscription failed: ${body.subscriptionError}\n\nCreate it manually in the GoCardless dashboard.`);
      }
      setSetupUrl(body.setupUrl || null);
      setList((prev) => prev.map((x) => x.id === id ? { ...x, status: 'approved' } : x));
    } finally { setBusyId(null); }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Reason for rejection (will be visible to admins, not the customer):");
    if (reason === null) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/onboarding/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) { alert('Could not reject'); return; }
      setList((prev) => prev.map((x) => x.id === id ? { ...x, status: 'rejected', rejectedReason: reason } : x));
    } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s.replace('_', ' ')} ({s === 'all' ? list.length : list.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {setupUrl && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="text-sm font-semibold text-amber-900">Setup link generated</div>
          <p className="text-xs text-amber-800 mt-1">An email was sent to the contact. If they don't get it, share this link directly:</p>
          <div className="mt-2 flex gap-2 items-center">
            <code className="flex-1 text-xs bg-white border border-amber-200 px-2 py-1.5 rounded overflow-x-auto">{setupUrl}</code>
            <button
              onClick={() => { navigator.clipboard?.writeText(setupUrl); }}
              className="text-xs px-2 py-1.5 bg-white border border-amber-300 rounded hover:bg-amber-100"
            >Copy</button>
            <button onClick={() => setSetupUrl(null)} className="text-xs px-2 py-1.5 text-amber-800">Dismiss</button>
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
          Nothing in this state.
        </div>
      )}

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900">{r.pharmacyName}</h3>
                  <StatusBadge status={r.status} />
                  {r.mandateStatus && r.mandateStatus.startsWith('session:') === false && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">DD: {r.mandateStatus}</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {r.contactFirstName} {r.contactLastName} · {r.contactEmail}
                  {r.contactGphc && ` · GPhC ${r.contactGphc}`}
                </div>
                {r.pharmacyAddress && <div className="text-xs text-gray-500 mt-0.5">{r.pharmacyAddress}</div>}
                {r.pharmacyGphc && <div className="text-xs text-gray-500">Premises GPhC: {r.pharmacyGphc}</div>}
                {r.mandateId && <div className="text-xs text-gray-500">Mandate: <code className="text-[11px]">{r.mandateId}</code></div>}
                <div className="text-xs text-gray-400 mt-1">Submitted {formatSubmitted(r.createdAt)}</div>
                {r.rejectedReason && <div className="text-xs text-red-600 mt-1">Rejected: {r.rejectedReason}</div>}
              </div>
              {r.status === 'awaiting_approval' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {busyId === r.id ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-md disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    started: 'bg-gray-100 text-gray-700',
    dd_pending: 'bg-blue-100 text-blue-700',
    awaiting_approval: 'bg-amber-100 text-amber-800',
    approved: 'bg-teal-100 text-teal-800',
    completed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
