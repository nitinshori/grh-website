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
  feeNote: string;
  /** Direct Debit link for an admin-created sign-up still awaiting its mandate, else ''. */
  resumeLink: string;
}

interface ApproveForm {
  feePounds: string;
  changePounds: string;
  changeOn: string;
  note: string;
  /** Existing pharmacies.group_slug to attach this sign-up to, or ''. */
  joinGroupSlug: string;
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
  // In-page confirmation and messages. Chrome silences alert/confirm for a
  // site once "prevent this page from creating additional dialogs" has been
  // ticked, after which the old confirm() returned false and approvals
  // looked dead (3 Oct 2026). Nothing here depends on a browser dialog.
  const [confirmText, setConfirmText] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [af, setAf] = useState<ApproveForm>({ feePounds: String(STANDARD_FEE_POUNDS), changePounds: '', changeOn: '', note: '', joinGroupSlug: '' });

  function openApprove(r: Row) {
    setApproving(r.id);
    setConfirmText(null);
    setNotice(null);
    // An admin-created sign-up carries the agreed fee already.
    setAf({
      feePounds: r.monthlyFeePence != null ? String(r.monthlyFeePence / 100) : String(STANDARD_FEE_POUNDS),
      changePounds: r.feeChangePence != null ? String(r.feeChangePence / 100) : '',
      changeOn: r.feeChangeOn || '',
      note: r.feeNote || '',
      joinGroupSlug: '',
    });
  }

  function approvalPlan(r: Row): { error?: string; monthlyFeePence?: number; feeChangePence?: number | null; feeChangeOn?: string | null; joining?: string; lines?: string[] } {
    const feePounds = parseFloat(af.feePounds.trim());
    if (!Number.isFinite(feePounds) || feePounds < 1) return { error: 'Enter a monthly fee per pharmacy, e.g. 100' };
    const monthlyFeePence = Math.round(feePounds * 100);
    const hasChange = af.changePounds.trim() !== '' || af.changeOn.trim() !== '';
    let feeChangePence: number | null = null;
    let feeChangeOn: string | null = null;
    if (hasChange) {
      const cp = parseFloat(af.changePounds.trim());
      if (!Number.isFinite(cp) || cp < 1) return { error: 'The scheduled fee needs an amount, e.g. 100' };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(af.changeOn.trim())) return { error: 'The scheduled fee needs a date' };
      feeChangePence = Math.round(cp * 100);
      feeChangeOn = af.changeOn.trim();
    }
    const n = r.branchNames.length + 1;
    const joining = af.joinGroupSlug.trim();
    if (joining && !/^[a-z0-9-]{3,100}$/.test(joining)) return { error: 'Group slug: lower-case letters, digits and hyphens only' };
    const lines = [
      `Approve ${r.groupName || r.pharmacyName} (${n} ${n === 1 ? 'pharmacy' : 'pharmacies'}) at ${gbp(monthlyFeePence)} per pharmacy per month?`,
      '',
      `Total ${gbp(monthlyFeePence * n)}/month on the customer's mandate (${n} GoCardless ${n === 1 ? 'subscription' : 'subscriptions'}).`,
      feeChangePence != null ? `Changes to ${gbp(feeChangePence)} per pharmacy on ${feeChangeOn}.` : 'No scheduled change.',
      '',
      joining
        ? `Attaches to existing group "${joining}". If ${r.contactFirstName} ${r.contactLastName} already has a login in that group, no new login or email; otherwise they become pharmacy admin of the group.`
        : n > 1
          ? `This will create ${n} pharmacies under one group, make ${r.contactFirstName} ${r.contactLastName} the pharmacy admin for all of them, assign all PGDs, start billing and email the setup link.`
          : 'This will create the pharmacy and first user, assign all PGDs, start billing and email the setup link.',
    ];
    return { monthlyFeePence, feeChangePence, feeChangeOn, joining, lines };
  }

  function handleApprove(r: Row) {
    const plan = approvalPlan(r);
    if (plan.error) { setNotice({ kind: 'error', text: plan.error }); return; }
    setNotice(null);
    setConfirmText(plan.lines ?? []);
  }

  async function handleApproveConfirmed(r: Row) {
    const plan = approvalPlan(r);
    if (plan.error) { setNotice({ kind: 'error', text: plan.error }); return; }
    const { monthlyFeePence, feeChangePence, feeChangeOn, joining } = plan as Required<ReturnType<typeof approvalPlan>>;
    setConfirmText(null);
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/onboarding/${r.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyFeePence, feeChangePence, feeChangeOn, feeNote: af.note.trim() || null, joinGroupSlug: joining || null }),
      });
      const body = await res.json();
      if (!res.ok) { setNotice({ kind: 'error', text: `Could not approve: ${body.error || res.status}` }); return; }
      const parts: string[] = [];
      if (body.subscriptionError) parts.push(`Pharmacies provisioned but GoCardless billing failed for: ${body.subscriptionError}. Retry from Admin, Billing.`);
      if (body.existingUser) parts.push(`Approved and attached to group "${body.groupSlug}". ${r.contactFirstName} already has a login there, so no setup email was sent.`);
      else parts.push(`Approved. ${body.emailed ? 'Setup email sent.' : `Setup email FAILED: ${body.emailError || 'unknown error'}; the link is shown below.`}`);
      setNotice({ kind: body.subscriptionError ? 'error' : 'ok', text: parts.join(' ') });
      setSetupUrl(body.setupUrl || null);
      setApproving(null);
      setList((prev) => prev.map((x) => x.id === r.id ? {
        ...x,
        status: 'approved',
        monthlyFeePence,
        feeChangePence,
        feeChangeOn: feeChangeOn ?? '',
        setupDone: body.existingUser ? true : false,
        setupEmailSentAt: body.emailed ? new Date().toISOString() : '',
        setupEmailError: body.emailed || body.existingUser ? '' : (body.emailError || 'unknown error'),
        setupEmailAttempts: body.existingUser ? x.setupEmailAttempts : x.setupEmailAttempts + 1,
      } : x));
    } finally { setBusyId(null); }
  }

  async function handleSendDdLink(r: Row) {
    const cc = (ccFor[r.id] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/onboarding/${r.id}/send-dd-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cc }),
      });
      const body = await res.json();
      if (!res.ok) { setNotice({ kind: 'error', text: `Could not send: ${body.error || res.status}` }); return; }
      setNotice({ kind: 'ok', text: `Sent to ${body.to}${body.cc?.length ? `, cc ${body.cc.join(', ')}` : ''}.` });
    } finally { setBusyId(null); }
  }

  async function handleResend(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/onboarding/${id}/resend-setup`, { method: 'POST' });
      const body = await r.json();
      if (!r.ok) { setNotice({ kind: 'error', text: `Could not resend: ${body.error || r.status}` }); return; }
      setSetupUrl(body.setupUrl || null);
      setList((prev) => prev.map((x) => x.id === id ? {
        ...x,
        setupEmailSentAt: body.emailed ? new Date().toISOString() : x.setupEmailSentAt,
        setupEmailError: body.emailed ? '' : (body.emailError || 'unknown error'),
        setupEmailAttempts: x.setupEmailAttempts + 1,
      } : x));
      setNotice(body.emailed ? { kind: 'ok', text: 'Setup link re-sent.' } : { kind: 'error', text: `The email could not be sent: ${body.emailError}. The link is shown above; send it to the customer another way.` });
    } finally { setBusyId(null); }
  }

  const [ccFor, setCcFor] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function handleReject(id: string) {
    const reason = rejectReason.trim();
    if (!reason) { setNotice({ kind: 'error', text: 'Give a reason for the rejection' }); return; }
    setRejecting(null);
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/onboarding/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) { setNotice({ kind: 'error', text: 'Could not reject' }); return; }
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

      {notice && (
        <div className={`rounded-lg p-3 text-sm border ${notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 text-xs underline">Dismiss</button>
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
                {r.resumeLink && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1 flex items-start gap-2 flex-wrap">
                    <span>Set up by us; waiting for the customer to complete the Direct Debit. Link: <code className="select-all break-all">{r.resumeLink}</code></span>
                    <span className="flex items-center gap-1 shrink-0">
                      <input
                        type="text" placeholder="cc (optional)" value={ccFor[r.id] ?? ''}
                        onChange={(e) => setCcFor((m) => ({ ...m, [r.id]: e.target.value }))}
                        className="w-44 px-2 py-1 border border-amber-300 rounded text-xs bg-white"
                      />
                      <button
                        onClick={() => handleSendDdLink(r)}
                        disabled={busyId === r.id}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded disabled:opacity-50"
                      >
                        {busyId === r.id ? '…' : 'Email the link to the contact'}
                      </button>
                    </span>
                  </div>
                )}
                {r.monthlyFeePence != null && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    {r.status === 'awaiting_approval' || r.status === 'started' || r.status === 'dd_pending' ? 'Agreed fee' : 'Fee'} {gbp(r.monthlyFeePence)} per pharmacy per month
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
                  {rejecting === r.id ? (
                    <span className="flex items-center gap-1">
                      <input type="text" autoFocus placeholder="Reason (admins only)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-48 px-2 py-1.5 border border-red-300 rounded-md text-sm" />
                      <button onClick={() => handleReject(r.id)} disabled={busyId === r.id} className="px-3 py-1.5 text-sm bg-red-600 text-white font-medium rounded-md disabled:opacity-50">Confirm reject</button>
                      <button onClick={() => setRejecting(null)} className="px-2 py-1.5 text-sm text-gray-600">Cancel</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => { setRejecting(r.id); setRejectReason(''); }}
                      disabled={busyId === r.id}
                      className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-md disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
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
                  <label className="block text-xs font-medium text-gray-700">Attach to an existing group (optional)</label>
                  <input
                    type="text" value={af.joinGroupSlug} placeholder="group slug from Admin, Billing, e.g. delmergate-1a2b"
                    onChange={(e) => setAf((f) => ({ ...f, joinGroupSlug: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">For a branch of a group whose other branches are already on the platform. Leave blank for a new pharmacy or a new group.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Note for the billing page (optional)</label>
                  <input
                    type="text" value={af.note} placeholder="e.g. 10% group rate agreed for year one"
                    onChange={(e) => setAf((f) => ({ ...f, note: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                {confirmText ? (
                  <div className="sm:col-span-2 rounded-lg border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900">
                    {confirmText.filter(Boolean).map((l, i) => <p key={i} className={i === 0 ? 'font-semibold' : 'mt-1'}>{l}</p>)}
                    <div className="mt-3 flex gap-2 justify-end">
                      <button onClick={() => setConfirmText(null)} disabled={busyId === r.id} className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md">Cancel</button>
                      <button onClick={() => handleApproveConfirmed(r)} disabled={busyId === r.id} className="px-4 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">
                        {busyId === r.id ? 'Approving…' : 'Yes, approve and start billing'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={() => handleApprove(r)}
                      disabled={busyId === r.id}
                      className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50"
                    >
                      {busyId === r.id ? 'Approving…' : `Approve and start billing`}
                    </button>
                  </div>
                )}
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
