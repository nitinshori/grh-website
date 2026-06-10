'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { TravelDestination } from '@/data/travel-destinations'
import {
  filterRecommendations,
  type ConsultationAnswers,
} from '@/lib/travel-checker'

interface Props {
  destinations: TravelDestination[]
}

type Step = 'destination' | 'questions' | 'results'

export function TravelCheckerClient({ destinations }: Props) {
  const [step, setStep] = useState<Step>('destination')
  const [selectedIso, setSelectedIso] = useState<string>('')
  const [answers, setAnswers] = useState<ConsultationAnswers>({})

  const destination = useMemo(
    () => destinations.find((d) => d.iso === selectedIso) ?? null,
    [destinations, selectedIso],
  )

  function handleDestinationSelect(iso: string) {
    setSelectedIso(iso)
    setAnswers({})
    // Skip the questions step if the destination has no asks
    const dest = destinations.find((d) => d.iso === iso)
    if (!dest) return
    const hasAsks = Object.values(dest.asks).some(Boolean)
    setStep(hasAsks ? 'questions' : 'results')
  }

  function handleReset() {
    setSelectedIso('')
    setAnswers({})
    setStep('destination')
  }

  return (
    <div className="space-y-6">
      {/* Progress trail */}
      <ProgressTrail step={step} />

      {step === 'destination' && (
        <DestinationPicker
          destinations={destinations}
          onSelect={handleDestinationSelect}
        />
      )}

      {step === 'questions' && destination && (
        <QuestionPanel
          destination={destination}
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => setStep('destination')}
          onContinue={() => setStep('results')}
        />
      )}

      {step === 'results' && destination && (
        <ResultsPanel
          destination={destination}
          answers={answers}
          onBack={() =>
            setStep(
              Object.values(destination.asks).some(Boolean)
                ? 'questions'
                : 'destination',
            )
          }
          onReset={handleReset}
        />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function ProgressTrail({ step }: { step: Step }) {
  const items: { key: Step; label: string }[] = [
    { key: 'destination', label: '1. Destination' },
    { key: 'questions', label: '2. Trip details' },
    { key: 'results', label: '3. Recommendations' },
  ]
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {items.map((it, idx) => {
        const isActive = step === it.key
        const isPast =
          items.findIndex((x) => x.key === step) >
          items.findIndex((x) => x.key === it.key)
        return (
          <li key={it.key} className="flex items-center gap-2">
            <span
              className={
                'px-2 py-1 rounded-md font-medium ' +
                (isActive
                  ? 'bg-teal-600 text-white'
                  : isPast
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-gray-100 text-gray-500')
              }
            >
              {it.label}
            </span>
            {idx < items.length - 1 && (
              <span className="text-gray-300">→</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function DestinationPicker({
  destinations,
  onSelect,
}: {
  destinations: TravelDestination[]
  onSelect: (iso: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
      <label
        htmlFor="dest-search"
        className="block text-sm font-medium text-gray-900 mb-2"
      >
        Where is the patient travelling to?
      </label>
      <input
        id="dest-search"
        type="text"
        placeholder="Start typing a country name — e.g. Pakistan"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        autoFocus
      />
      <p className="text-xs text-gray-500 mt-2">
        v1 covers {destinations.length} destinations. More will be added
        as Chris signs off the clinical content.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-auto">
        {filtered.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => onSelect(d.iso)}
            className="text-left p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50/40 transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-gray-900">{d.name}</span>
              <span className="text-xs text-gray-500">{d.region}</span>
            </div>
            {!d.lastReviewed && (
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                Draft — pending clinical sign-off
              </span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-gray-500 p-4 text-center">
            No destinations matching &ldquo;{query}&rdquo;. Either Chris hasn&apos;t
            signed off that country yet, or it&apos;s spelt differently —
            try a shorter search.
          </p>
        )}
      </div>
    </div>
  )
}

function QuestionPanel({
  destination,
  answers,
  setAnswers,
  onBack,
  onContinue,
}: {
  destination: TravelDestination
  answers: ConsultationAnswers
  setAnswers: (a: ConsultationAnswers) => void
  onBack: () => void
  onContinue: () => void
}) {
  function toggle(key: keyof ConsultationAnswers) {
    setAnswers({ ...answers, [key]: !answers[key] })
  }

  const { asks } = destination

  type QuestionItem = {
    key: keyof ConsultationAnswers
    label: string
    description: string
    show: boolean
  }
  const allQuestions: QuestionItem[] = [
    {
      key: 'rural',
      label: 'Rural travel',
      description:
        'Travelling outside main tourist resorts / cities to rural areas or smaller towns.',
      show: !!asks.rural,
    },
    {
      key: 'longStay',
      label: 'Long stay (>4 weeks)',
      description: 'Total time in the destination exceeds 4 weeks.',
      show: !!asks.longStay,
    },
    {
      key: 'outdoorActivities',
      label: 'Outdoor activities',
      description: 'Hiking, camping, cycling, safari, jungle, fieldwork etc.',
      show: !!asks.activities,
    },
    {
      key: 'animalContact',
      label: 'Animal contact likely',
      description:
        'Farm/village stays, voluntary work with animals, children playing outside.',
      show: !!asks.activities,
    },
    {
      key: 'medicalWork',
      label: 'Healthcare / aid work',
      description: 'Working in clinics, hospitals, or aid settings.',
      show: !!asks.activities,
    },
    {
      key: 'sexualContact',
      label: 'New sexual contact risk',
      description: 'Possible new partners during the trip.',
      show: !!asks.activities,
    },
    {
      key: 'bodyMods',
      label: 'Tattoos / piercings / dental abroad',
      description:
        'Patient plans to get tattoos, piercings or non-emergency dental work locally.',
      show: !!asks.activities,
    },
    {
      key: 'vfr',
      label: 'Visiting friends & relatives (VFR)',
      description:
        'Staying with local family — higher exposure to local food, water and household contacts.',
      show: !!asks.vfr,
    },
    {
      key: 'hajj',
      label: 'Hajj or Umrah pilgrimage',
      description:
        'Travelling for Hajj or Umrah — triggers Saudi vaccination entry requirements.',
      show: !!asks.hajj,
    },
  ]
  const questions = allQuestions.filter((q) => q.show)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tell us about the trip — {destination.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tick everything that applies. We use the answers to filter
            which vaccines NaTHNaC recommends for this individual
            traveller.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {questions.map((q) => (
          <label
            key={q.key}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!answers[q.key]}
              onChange={() => toggle(q.key)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">
                {q.label}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {q.description}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Change destination
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg"
        >
          Show recommendations
        </button>
      </div>
    </div>
  )
}

function ResultsPanel({
  destination,
  answers,
  onBack,
  onReset,
}: {
  destination: TravelDestination
  answers: ConsultationAnswers
  onBack: () => void
  onReset: () => void
}) {
  const recs = filterRecommendations(destination, answers)

  // Group recs by pgdId so we can show "deliver these N together via X PGD"
  const byPgd = new Map<string, typeof recs>()
  for (const r of recs) {
    const existing = byPgd.get(r.pgdId) ?? []
    existing.push(r)
    byPgd.set(r.pgdId, existing)
  }

  return (
    <div className="space-y-5">
      {!destination.lastReviewed && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Draft content.</strong> The clinical recommendations
          for {destination.name} are pending sign-off by Chris and
          Nitin. Treat as a guide — verify against NaTHNaC before
          dispensing.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">
            {destination.name}
          </h2>
          <span className="text-xs text-gray-500">{destination.region}</span>
        </div>
        <p className="text-sm text-gray-700 mt-2">{destination.oneLiner}</p>
      </div>

      {/* Recommendations */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Recommended vaccines
        </h3>
        <ul className="space-y-3">
          {recs.map((r, i) => (
            <li
              key={`${r.pgdId}-${i}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{r.vaccine}</div>
                <p className="text-sm text-gray-600 mt-0.5">{r.reason}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.whyFired === 'all' ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                      Routine
                    </span>
                  ) : (
                    r.whyFired.map((reason) => (
                      <span
                        key={reason}
                        className="text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded"
                      >
                        {reason}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <Link
                href={`/for-pharmacies/epgd/${r.pgdId}`}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-md"
              >
                Start ePGD →
              </Link>
            </li>
          ))}
        </ul>

        {byPgd.has('travel-core') && (byPgd.get('travel-core')?.length ?? 0) > 1 && (
          <div className="mt-4 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm text-teal-900">
            <strong>Tip:</strong> The Travel Core PGD delivers Hep A,
            Hep B, Typhoid, dT/IPV (and where relevant cholera and
            yellow fever) in a single consultation. Open it once to
            cover all the routine + conditional core vaccines above.
          </div>
        )}
      </section>

      {/* Malaria */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Malaria
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <RiskBadge risk={destination.malaria.risk} />
          {destination.malaria.recommendAntimalarials && (
            <Link
              href="/for-pharmacies/epgd/anti-malarials"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
            >
              Open anti-malarials ePGD →
            </Link>
          )}
        </div>
        {destination.malaria.regions && (
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-medium">Regions:</span>{' '}
            {destination.malaria.regions}
          </p>
        )}
        {destination.malaria.seasonality && (
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-medium">Seasonality:</span>{' '}
            {destination.malaria.seasonality}
          </p>
        )}
        {destination.malaria.notes && (
          <p className="text-sm text-gray-600 mt-2 italic">
            {destination.malaria.notes}
          </p>
        )}
      </section>

      {/* Entry requirements */}
      {destination.entryRequirements.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Entry requirements
          </h3>
          <ul className="space-y-2">
            {destination.entryRequirements.map((er, i) => (
              <li
                key={i}
                className="p-3 rounded-lg bg-amber-50 border border-amber-200"
              >
                <div className="font-medium text-amber-900">{er.vaccine}</div>
                <p className="text-sm text-amber-900/90 mt-0.5">
                  {er.details}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* General notes */}
      {destination.notes && (
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-5 lg:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Clinical notes
          </h3>
          <p className="text-sm text-gray-700">{destination.notes}</p>
        </section>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Edit answers
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Start over →
        </button>
      </div>
    </div>
  )
}

function RiskBadge({
  risk,
}: {
  risk: 'none' | 'very-low' | 'low' | 'moderate' | 'high'
}) {
  const map: Record<typeof risk, { label: string; className: string }> = {
    none: { label: 'No malaria risk', className: 'bg-green-100 text-green-800' },
    'very-low': {
      label: 'Very low risk',
      className: 'bg-green-100 text-green-800',
    },
    low: { label: 'Low risk', className: 'bg-yellow-100 text-yellow-800' },
    moderate: {
      label: 'Moderate risk',
      className: 'bg-orange-100 text-orange-800',
    },
    high: { label: 'High risk', className: 'bg-red-100 text-red-800' },
  }
  const { label, className } = map[risk]
  return (
    <span
      className={
        'inline-block text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ' +
        className
      }
    >
      {label}
    </span>
  )
}
