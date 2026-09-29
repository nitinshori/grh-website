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
  heardAbout: string;
  heardAboutDetail: string;
  mandateId: string;
  mandateStatus: string;
  createdAt: string;
  rejectedReason: string;
  /** ISO time the setup email last went, or '' if never sent. */
  setupEmailSentAt: string;
  setupEmailError: string;
  setupEmailAttempts: number;
  /** null until approved; then whether the customer has chosen a password. */
  setupDone: boolean | null;
  /** Extra branches on a multi-branch sign-up (names only here). */
  branchNames: string[];
  groupName: string;
  /** Per-branch monthly fee in pence once approved, else null. */
  monthlyFeePence: number | null;
  feeChangePence: number | null;
  feeChangeOn: string;
}

interface ApproveForm {
  feePounds: string;
  changePounds: string;
  changeOn: string;
  note: string;
}

const STANDARD_FEE_POUNDS = 100;

function gbp(pence: number): string {
  return '£' + (pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

/** One year from today, Europe/London, as YYYY-MM-DD: the usual first-year rate end. */
function oneYearFromToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const y = Number(parts.slice(0, 4)) + 1;
  return `${y}${parts.slice(4)}`;
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

// Readable labels for the optional "how did you hear about us" answer.
// Kept in sync with the options in src/app/onboard/OnboardClient.tsx.
const HEARD_ABOUT_LABELS: Record<string, string> = {
  recommendation: 'Recommendation',
  linkedin: 'LinkedIn',
  search: 'Search engine',
  email: 'Email from us',
  event: 'Conference or event',
  press: 'Pharmacy press',
  existing: 'Existing relationship',
  other: 'Other',
}

export default function OnboardingQueueClient({ rows }: { rows: Row[] }) {
  const [list, setList] = useState<Row[]>(rows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('awaiting_approval');
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  const visible = filter === 'all' ? list : list.filter((r) => r.status === filter);

  // The approval form replaces a window.prompt: a multi-branch sign-up needs
  // a per-branch fee, an optional scheduled change (first-year group rate to
  // standard) and a note, which a prompt cannot carry.
  const [approving, setApproving] = useState<string | null>(null);
  const [af, setAf] = useState<ApproveForm>({ feePounds: String(STANDARD_FEE_POUNDS), changePounds: '', changeOn: '', note: '' });

  function openApprove(r: Row) {
    setApproving(r.id);
    setAf({ feePounds: String(STANDARD_FEE_POUNDS), changePounds: '', changeOn: '', note: '' });
  }

  async function handleApprove(r: Row) {
    const feePounds = parseFloat(af.feePounds.trim());
    if (!Number.isFinite(feePounds) || feePounds < 1) { alert('Enter a monthly fee per pharmacy, e.g. 100'); return; }
    const monthlyFeePence = Math.round(feePounds * 100);
    const hasChange = af.changePounds.trim() !== '' || af.changeOn.trim() !== '';
    let feeChangePence: number | null = null;
    let feeChangeOn: string | null = null;
    if (hasChange) {
      const cp = parseFloat(af.changePounds.trim());
      if (!Number.isFinite(cp) || cp < 1) { alert('The scheduled fee needs an amount, e.g. 100'); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(af.changeOn.trim())) { alert('The scheduled fee needs a date'); return; }
      feeChangePence = Math.round(cp * 100);
      feeChangeOn = af.changeOn.trim();
    }
    const n = r.branchNames.length + 1;
    const lines = [
      `Approve ${r.groupName || r.pharmacyName} (${n} ${n === 1 ? 'pharmacy' : 'pharmacies'}) at ${gbp(monthlyFeePence)} per pharmacy per month?`,
      '',
      `Total ${gbp(monthlyFeePence * n)}/month on the customer's mandate (${n} GoCardless ${n === 1 ? 'subscription' : 'subscriptions'}).`,
      feeChangePence != null ? `Changes to ${gbp(feeChangePence)} per pharmacy on ${feeChangeOn}.` : 'No scheduled change.',
      '',
      n > 1
        ? `This will create ${n} pharmacies under one group, make ${r.contactFirstName} ${r.contactLastName} the pharmacy admin for all of them, assign all PGDs, start billing and email the setup link.`
        : 'This will create the pharmacy and first user, assign all PGDs, start billing and email the setup link.',
    ];
    if (!window.confirm(lines.join('\n'))) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/onboarding/${r.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyFeePence, feeChangePence, feeChangeOn, feeNote: af.note.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) { alert(`Could not approve: ${body.error || res.status}`); return; }
      if (body.subscriptionError) {
        alert(`Pharmacies provisioned but GoCardless billing failed for: ${body.subscriptionError}\n\nRetry from Admin > Billing.`);
      }
      setSetupUrl(body.setupUrl || null);
      setApproving(null);
      setList((prev) => prev.map((x) => x.id === r.id ? {
        ...x,
        status: 'approved',
        monthlyFeePence,
        feeChangePence,
        feeChangeOn: feeChangeOn ?? '',
        setupDone: false,
        setupEmailSentAt: body.emailed ? new Date().toISOString() : '',
        setupEmailError: body.emailed ? '' : (body.emailError || 'unknown error'),
        setupEmailAttempts: x.setupEmailAttempts + 1,
      } : x));
    } finally { setBusyId(null); }
  }

  async function handleResend(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/onboarding/${id}/resend-setup`, { method: 'POST' });
      const body = await r.json();
      if (!r.ok) { alert(`Could not resend: ${body.error || r.status}`); return; }
      setSetupUrl(body.setupUrl || null);
      setList((prev) => prev.map((x) => x.id === id ? {
        ...x,
        setupEmailSentAt: body.emailed ? new Date().toISOString() : x.setupEmailSentAt,
        setupEmailError: body.emailed ? '' : (body.emailError || 'unknown error'),
        setupEmailAttempts: x.setupEmailAttempts + 1,
      } : x));
      if (!body.emailed) alert(`The email could not be sent: ${body.emailError}\n\nThe link is shown above; send it to the customer another way.`);
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
          <p className="text-xs text-amber-800 mt-1">An email was sent to the contact. If they don&apos;t get it, share this link directly:</p>
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
                {r.branchNames.length > 0 && (
                  <div className="text-xs text-indigo-800 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 mt-1">
                    <span className="font-semibold">Group of {r.branchNames.length + 1}{r.groupName ? `: ${r.groupName}` : ''}.</span>{' '}
                    Also {r.branchNames.join('; ')}
                  </div>
                )}
                {r.monthlyFeePence != null && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    Fee {gbp(r.monthlyFeePence)} per pharmacy per month
                    {r.feeChangePence != null && r.feeChangeOn ? `, ${gbp(r.feeChangePence)} from ${r.feeChangeOn}` : ''}
                  </div>
                )}
                {r.heardAbout && (
                  <div className="text-xs text-teal-700 mt-0.5">
                    Heard about us: {HEARD_ABOUT_LABELS[r.heardAbout] ?? r.heardAbout}
                    {r.heardAboutDetail && ` — ${r.heardAboutDetail}`}
                  </div>
                )}
                {r.mandateId && <div className="text-xs text-gray-500">Mandate: <code className="text-[11px]">{r.mandateId}</code></div>}
                <div className="text-xs text-gray-400 mt-1">Submitted {formatSubmitted(r.createdAt)}</div>
                {r.rejectedReason && <div className="text-xs text-red-600 mt-1">Rejected: {r.rejectedReason}</div>}
                {(r.status === 'approved' || r.status === 'completed') && (
                  <div className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {r.setupDone === true && <span className="text-green-700">Password set: customer can log in</span>}
                    {r.setupDone === false && <span className="text-red-700 font-semibold">NOT SET UP: no password chosen yet</span>}
                    {r.setupEmailError
                      ? <span className="text-red-700">Setup email FAILED: {r.setupEmailError}</span>
                      : r.setupEmailSentAt
                        ? <span className="text-gray-600">Setup email sent {formatSubmitted(r.setupEmailSentAt)}{r.setupEmailAttempts > 1 ? ` (${r.setupEmailAttempts} sends)` : ''}</span>
                        : <span className="text-amber-700">Setup email: no record of it being sent</span>}
                  </div>
                )}
              </div>
              {(r.status === 'approved' || r.status === 'completed') && r.setupDone === false && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleResend(r.id)}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {busyId === r.id ? '…' : 'Resend setup link'}
                  </button>
                </div>
              )}
              {r.status === 'awaiting_approval' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => (approving === r.id ? setApproving(null) : openApprove(r))}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {busyId === r.id ? '…' : approving === r.id ? 'Close' : 'Approve'}
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
            {approving === r.id && r.status === 'awaiting_approval' && (
              <div className="mt-4 border-t border-gray-200 pt-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Monthly fee per pharmacy (£, ex VAT)</label>
                  <input
                    type="number" min={1} step="0.01" value={af.feePounds}
                    onChange={(e) => setAf((f) => ({ ...f, feePounds: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Standard {gbp(STANDARD_FEE_POUNDS * 100)}. {r.branchNames.length + 1} {r.branchNames.length ? 'pharmacies' : 'pharmacy'}: total {gbp(Math.round((parseFloat(af.feePounds) || 0) * 100) * (r.branchNames.length + 1))}/month.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Scheduled change (optional)</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number" min={1} step="0.01" placeholder="£ per pharmacy" value={af.changePounds}
                      onChange={(e) => setAf((f) => ({ ...f, changePounds: e.target.value }))}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="date" value={af.changeOn}
                      onChange={(e) => setAf((f) => ({ ...f, changeOn: e.target.value }))}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    e.g. a first-year rate moving to standard.{' '}
                    <button type="button" className="text-teal-700 underline" onClick={() => setAf((f) => ({ ...f, changePounds: String(STANDARD_FEE_POUNDS), changeOn: oneYearFromToday() }))}>
                      Standard rate in one year
                    </button>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Note for the billing page (optional)</label>
                  <input
                    type="text" value={af.note} placeholder="e.g. 10% group rate agreed for year one"
                    onChange={(e) => setAf((f) => ({ ...f, note: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleApprove(r)}
                    disabled={busyId === r.id}
                    className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50"
                  >
                    {busyId === r.id ? 'Approving…' : `Approve and start billing`}
                  </button>
                </div>
              </div>
            )}
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
