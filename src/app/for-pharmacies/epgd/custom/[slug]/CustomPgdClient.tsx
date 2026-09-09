'use client'

import { useMemo, useState } from 'react'
import type {
  CustomPgdDefinition,
  CustomPgdMedicine,
  CustomPgdDoseOption,
} from '@/lib/custom-pgd/types'

// ── Generic ePGD consultation engine ─────────────────────────────
// Renders any admin-authored PGD definition as a guided consultation:
// patient details → consent → screening → medicine & dose → summary.
// Saves through the same /api/consultation-records endpoint as the
// hand-built tools, so records, analytics, audit and GP notification
// all work identically.

type Step = 'patient' | 'consent' | 'screening' | 'medicine' | 'summary' | 'done'

interface PatientForm {
  firstName: string
  lastName: string
  dateOfBirth: string
  nhsNumber: string
  phone: string
  email: string
  address: string
  gpName: string
  gpPractice: string
  gpEmail: string
}

const EMPTY_PATIENT: PatientForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nhsNumber: '',
  phone: '',
  email: '',
  address: '',
  gpName: '',
  gpPractice: '',
  gpEmail: '',
}

const STANDARD_CONSENT = [
  { id: 'informedConsent', text: 'The patient has given informed consent to this consultation and treatment' },
  { id: 'idVerified', text: 'Patient identity has been verified' },
  { id: 'privateService', text: 'The patient understands this is a private (paid) service' },
]

function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]'

export default function CustomPgdClient({
  slug,
  title,
  definition: def,
}: {
  slug: string
  title: string
  definition: CustomPgdDefinition
}) {
  const [step, setStep] = useState<Step>('patient')
  const [patient, setPatient] = useState<PatientForm>(EMPTY_PATIENT)
  const [consent, setConsent] = useState<Record<string, boolean>>({})
  const [notifyGp, setNotifyGp] = useState(false)
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})
  const [medicineId, setMedicineId] = useState('')
  const [doseId, setDoseId] = useState('')
  // Vaccine extras
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [injectionSite, setInjectionSite] = useState('')
  // Summary
  const [pharmacistName, setPharmacistName] = useState('')
  const [pharmacistGPhC, setPharmacistGPhC] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [outcome, setOutcome] = useState<'completed' | 'referred' | 'not_supplied'>('completed')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedRecordId, setSavedRecordId] = useState('')

  const age = useMemo(() => ageFromDob(patient.dateOfBirth), [patient.dateOfBirth])

  // ── Screening outcome ─────────────────────────────────────────
  const exclusions = useMemo(
    () =>
      def.questions.filter((q) => {
        const a = answers[q.id]
        if (!a) return false
        if (q.kind === 'exclude' && a === 'yes') return true
        if (q.kind === 'exclude-if-no' && a === 'no') return true
        return false
      }),
    [answers, def.questions],
  )
  const cautionsTriggered = useMemo(
    () => def.questions.filter((q) => q.kind === 'caution' && answers[q.id] === 'yes'),
    [answers, def.questions],
  )
  const allAnswered = def.questions.every((q) => answers[q.id])
  const isExcluded = exclusions.length > 0

  // ── Medicine eligibility ──────────────────────────────────────
  const eligibleMedicines = useMemo(
    () =>
      def.medicines.filter((m) => {
        if (age === null) return true
        if (age < m.ageMinYears) return false
        if (m.ageMaxYears != null && age > m.ageMaxYears) return false
        return true
      }),
    [def.medicines, age],
  )
  const selectedMedicine: CustomPgdMedicine | undefined = def.medicines.find(
    (m) => m.id === medicineId,
  )
  const selectedDose: CustomPgdDoseOption | undefined = selectedMedicine?.doseOptions.find(
    (d) => d.id === doseId,
  )

  // ── Step validation ───────────────────────────────────────────
  const patientValid =
    patient.firstName.trim() && patient.lastName.trim() && patient.dateOfBirth && age !== null
  const consentValid =
    STANDARD_CONSENT.every((c) => consent[c.id]) &&
    def.consentItems.every((c) => consent[c.id])
  const medicineValid = !!selectedMedicine && !!selectedDose &&
    (!selectedMedicine.isVaccine || (batchNumber.trim() && expiryDate))

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!pharmacistName.trim() || !pharmacistGPhC.trim()) {
      setSaveError('Pharmacist name and GPhC number are required.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const finalOutcome = isExcluded ? outcome : 'completed'
      const res = await fetch('/api/consultation-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pgdSlug: slug,
          patient: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            nhsNumber: patient.nhsNumber,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            gpName: patient.gpName,
            gpPractice: patient.gpPractice,
            gpEmail: patient.gpEmail,
          },
          clinicalData: {
            engine: 'custom-pgd',
            pgdTitle: title,
            age,
            consent: { ...consent, notifyGp },
            screening: def.questions.map((q) => ({
              question: q.text,
              answer: answers[q.id] || '',
              kind: q.kind,
            })),
            exclusionsTriggered: exclusions.map((q) => q.text),
            cautionsTriggered: cautionsTriggered.map((q) => q.text),
            medicine: selectedMedicine
              ? {
                  name: selectedMedicine.name,
                  brandName: selectedMedicine.brandName,
                  form: selectedMedicine.form,
                  route: selectedMedicine.route,
                  dose: selectedDose?.label,
                  quantity: selectedDose?.quantity,
                  directions: selectedDose?.directions,
                  ...(selectedMedicine.isVaccine
                    ? { batchNumber, expiryDate, injectionSite }
                    : {}),
                }
              : null,
            adviceGiven: isExcluded ? [] : def.adviceToPatient,
          },
          outcome: finalOutcome,
          medicine:
            !isExcluded && selectedMedicine
              ? {
                  name: `${selectedMedicine.name}${selectedMedicine.form ? ` ${selectedMedicine.form}` : ''}`,
                  dose: selectedDose?.label,
                  quantity: selectedDose?.quantity,
                }
              : null,
          summary: {
            pharmacistName,
            pharmacistGPhC,
            consultationDate: new Date().toISOString(),
            clinicalNotes,
          },
          consent: { notifyGp },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedRecordId(data.recordId)
      setStep('done')
      window.scrollTo({ top: 0 })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Steps UI ──────────────────────────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: 'patient', label: 'Patient' },
    { key: 'consent', label: 'Consent' },
    { key: 'screening', label: 'Screening' },
    { key: 'medicine', label: 'Medicine' },
    { key: 'summary', label: 'Record' },
  ]
  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Progress */}
      {step !== 'done' && (
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-1 overflow-x-auto">
          {steps.map((s, i) => {
            const skipped = s.key === 'medicine' && isExcluded && allAnswered
            return (
              <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && <div className="w-4 h-px bg-gray-300" />}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    i === stepIndex
                      ? 'text-white'
                      : i < stepIndex
                        ? 'bg-gray-100 text-gray-700'
                        : 'text-gray-400'
                  } ${skipped ? 'line-through' : ''}`}
                  style={i === stepIndex ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* ── Patient details ─────────────────────────────── */}
        {step === 'patient' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Patient details</h2>
            {def.inclusionCriteria.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">This PGD covers:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {def.inclusionCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <Labelled label="First name" required>
                <input type="text" value={patient.firstName} onChange={(e) => setPatient({ ...patient, firstName: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="Last name" required>
                <input type="text" value={patient.lastName} onChange={(e) => setPatient({ ...patient, lastName: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="Date of birth" required>
                <input type="date" value={patient.dateOfBirth} onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })} className={inputCls} />
                {age !== null && <p className="text-xs text-gray-500 mt-1">Age: {age}</p>}
              </Labelled>
              <Labelled label="NHS number">
                <input type="text" value={patient.nhsNumber} onChange={(e) => setPatient({ ...patient, nhsNumber: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="Phone">
                <input type="tel" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="Email">
                <input type="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} className={inputCls} />
              </Labelled>
            </div>
            <Labelled label="Address">
              <input type="text" value={patient.address} onChange={(e) => setPatient({ ...patient, address: e.target.value })} className={inputCls} />
            </Labelled>
            <div className="grid sm:grid-cols-3 gap-3">
              <Labelled label="GP name">
                <input type="text" value={patient.gpName} onChange={(e) => setPatient({ ...patient, gpName: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="GP practice">
                <input type="text" value={patient.gpPractice} onChange={(e) => setPatient({ ...patient, gpPractice: e.target.value })} className={inputCls} />
              </Labelled>
              <Labelled label="GP email (for notification)">
                <input type="email" value={patient.gpEmail} onChange={(e) => setPatient({ ...patient, gpEmail: e.target.value })} className={inputCls} />
              </Labelled>
            </div>
            <NavButtons
              onNext={() => setStep('consent')}
              nextDisabled={!patientValid}
            />
          </div>
        )}

        {/* ── Consent ─────────────────────────────────────── */}
        {step === 'consent' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Consent & verification</h2>
            <div className="space-y-2.5">
              {[...STANDARD_CONSENT, ...def.consentItems].map((c) => (
                <label key={c.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!consent[c.id]}
                    onChange={(e) => setConsent({ ...consent, [c.id]: e.target.checked })}
                    className="mt-0.5 w-4 h-4"
                  />
                  <span className="text-sm text-gray-800">{c.text}</span>
                </label>
              ))}
              <label className="flex items-start gap-3 p-3 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyGp}
                  onChange={(e) => setNotifyGp(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span className="text-sm text-gray-600">
                  Patient consents to a copy of this consultation being emailed to their GP
                  <span className="text-gray-400"> (optional — needs GP email)</span>
                </span>
              </label>
            </div>
            <NavButtons onBack={() => setStep('patient')} onNext={() => setStep('screening')} nextDisabled={!consentValid} />
          </div>
        )}

        {/* ── Screening ───────────────────────────────────── */}
        {step === 'screening' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Clinical screening</h2>
            <div className="space-y-3">
              {def.questions.map((q, i) => {
                const a = answers[q.id]
                const triggered =
                  (q.kind === 'exclude' && a === 'yes') ||
                  (q.kind === 'exclude-if-no' && a === 'no') ||
                  (q.kind === 'caution' && a === 'yes')
                return (
                  <div
                    key={q.id}
                    className={`border rounded-lg p-3.5 ${
                      triggered
                        ? q.kind === 'caution'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <p className="text-sm text-gray-900 mb-2">
                      <span className="text-gray-400 mr-1.5">{i + 1}.</span>
                      {q.text}
                    </p>
                    {q.helpText && <p className="text-xs text-gray-500 mb-2">{q.helpText}</p>}
                    <div className="flex gap-2">
                      {(['yes', 'no'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: v })}
                          className={`px-5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            a === v
                              ? 'text-white border-transparent'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                          style={a === v ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
                        >
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    {triggered && q.detail && (
                      <p className={`text-xs mt-2 font-medium ${q.kind === 'caution' ? 'text-amber-700' : 'text-red-700'}`}>
                        {q.detail}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {allAnswered && isExcluded && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-bold text-red-800 mb-1">
                  Patient excluded from supply under this PGD
                </p>
                <ul className="text-sm text-red-700 list-disc pl-4 space-y-0.5">
                  {exclusions.map((q) => (
                    <li key={q.id}>{q.detail || q.text}</li>
                  ))}
                </ul>
                {def.referralArrangements.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-xs font-semibold text-red-800 mb-1">Referral arrangements:</p>
                    <ul className="text-xs text-red-700 list-disc pl-4 space-y-0.5">
                      {def.referralArrangements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {allAnswered && !isExcluded && cautionsTriggered.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-bold text-amber-800 mb-1">Cautions — proceed with care</p>
                <ul className="text-sm text-amber-700 list-disc pl-4 space-y-0.5">
                  {cautionsTriggered.map((q) => (
                    <li key={q.id}>{q.detail || q.text}</li>
                  ))}
                </ul>
              </div>
            )}

            <NavButtons
              onBack={() => setStep('consent')}
              onNext={() => setStep(isExcluded ? 'summary' : 'medicine')}
              nextDisabled={!allAnswered}
              nextLabel={isExcluded ? 'Record outcome' : 'Next'}
            />
          </div>
        )}

        {/* ── Medicine & dose ─────────────────────────────── */}
        {step === 'medicine' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Medicine & dose</h2>
            {eligibleMedicines.length === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                No medicine in this PGD is licensed for a patient aged {age}. Record the
                consultation as referred / not supplied.
              </div>
            ) : (
              <div className="space-y-3">
                {eligibleMedicines.map((m) => (
                  <div
                    key={m.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      medicineId === m.id
                        ? 'border-[color:var(--tenant-primary)] ring-2 ring-[color:var(--tenant-primary)]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setMedicineId(m.id)
                      setDoseId('')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">
                        {m.name}
                        {m.brandName && <span className="font-normal text-gray-500"> ({m.brandName})</span>}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-gray-300 text-gray-500">
                        {m.legalCategory}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {m.form} · {m.route}
                      {m.ageMaxYears != null
                        ? ` · Ages ${m.ageMinYears}–${m.ageMaxYears}`
                        : ` · Age ${m.ageMinYears}+`}
                    </p>
                    {m.cautions && medicineId === m.id && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                        {m.cautions}
                      </p>
                    )}
                    {medicineId === m.id && (
                      <div className="mt-3 space-y-1.5">
                        {m.doseOptions.map((d) => (
                          <label
                            key={d.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer ${
                              doseId === d.id ? 'border-[color:var(--tenant-primary)] bg-[color:var(--tenant-primary)]/5' : 'border-gray-200'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDoseId(d.id)
                            }}
                          >
                            <input type="radio" checked={doseId === d.id} readOnly className="mt-1" />
                            <span className="text-sm">
                              <span className="font-medium text-gray-900">{d.label}</span>
                              {d.quantity && <span className="text-gray-500"> — {d.quantity}</span>}
                              {d.directions && (
                                <span className="block text-xs text-gray-500">{d.directions}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedMedicine?.isVaccine && (
              <div className="grid sm:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Labelled label="Batch number" required>
                  <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className={inputCls} />
                </Labelled>
                <Labelled label="Expiry date" required>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputCls} />
                </Labelled>
                <Labelled label="Injection site">
                  <input type="text" value={injectionSite} onChange={(e) => setInjectionSite(e.target.value)} placeholder="e.g. Left deltoid" className={inputCls} />
                </Labelled>
              </div>
            )}

            <NavButtons
              onBack={() => setStep('screening')}
              onNext={() => setStep('summary')}
              nextDisabled={eligibleMedicines.length > 0 && !medicineValid}
              nextLabel={eligibleMedicines.length === 0 ? 'Record outcome' : 'Next'}
            />
          </div>
        )}

        {/* ── Summary & save ──────────────────────────────── */}
        {step === 'summary' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Consultation record</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-gray-500">Patient:</span> <strong>{patient.firstName} {patient.lastName}</strong> · DOB {patient.dateOfBirth} (age {age})</p>
              {isExcluded ? (
                <p className="text-red-700 font-medium">
                  Excluded: {exclusions.map((q) => q.text).join('; ')}
                </p>
              ) : (
                selectedMedicine && (
                  <p>
                    <span className="text-gray-500">Supply:</span>{' '}
                    <strong>{selectedMedicine.name} {selectedMedicine.form}</strong>
                    {selectedDose && ` — ${selectedDose.label}${selectedDose.quantity ? ` (${selectedDose.quantity})` : ''}`}
                    {selectedMedicine.isVaccine && batchNumber && ` · Batch ${batchNumber}`}
                  </p>
                )
              )}
              {cautionsTriggered.length > 0 && (
                <p className="text-amber-700">Cautions: {cautionsTriggered.map((q) => q.text).join('; ')}</p>
              )}
            </div>

            {!isExcluded && def.adviceToPatient.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-1.5">Advice given to patient:</p>
                <ul className="text-sm text-blue-900 list-disc pl-4 space-y-0.5">
                  {def.adviceToPatient.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {isExcluded && (
              <Labelled label="Outcome" required>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as typeof outcome)}
                  className={inputCls}
                >
                  <option value="referred">Referred (GP / A&E / specialist)</option>
                  <option value="not_supplied">Not supplied</option>
                </select>
              </Labelled>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <Labelled label="Pharmacist name" required>
                <input type="text" value={pharmacistName} onChange={(e) => setPharmacistName(e.target.value)} className={inputCls} />
              </Labelled>
              <Labelled label="GPhC number" required>
                <input type="text" value={pharmacistGPhC} onChange={(e) => setPharmacistGPhC(e.target.value)} className={inputCls} />
              </Labelled>
            </div>
            <Labelled label="Clinical notes">
              <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={3} className={inputCls} />
            </Labelled>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <NavButtons
              onBack={() => setStep(isExcluded ? 'screening' : 'medicine')}
              onNext={handleSave}
              nextDisabled={saving || !pharmacistName.trim() || !pharmacistGPhC.trim()}
              nextLabel={saving ? 'Saving…' : 'Save consultation record'}
            />
          </div>
        )}

        {/* ── Done ────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
              ✓
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Consultation record saved</h2>
            <p className="text-sm text-gray-500 mb-6">
              Record ID: <span className="font-mono">{savedRecordId}</span>
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/for-pharmacies/dashboard/records"
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                View records
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: 'var(--tenant-primary)' }}
              >
                New consultation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── UI helpers ───────────────────────────────────────────────────

function Labelled({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Next',
}: {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--tenant-primary)' }}
      >
        {nextLabel}
      </button>
    </div>
  )
}
