/**
 * Filter a destination's recommendations against a pharmacist's answers
 * to the pre-travel triage questions. Used by the destination checker
 * at /for-pharmacies/dashboard/travel-checker.
 */

import type {
  TravelDestination,
  TriggerCondition,
  VaccineRecommendation,
} from '@/data/travel-destinations'

/** Answers gathered from the pharmacist during triage.
 *  All fields optional — only ask the questions the destination
 *  actually needs (see TravelDestination.asks). */
export interface ConsultationAnswers {
  /** Is the patient travelling to rural / off-tourist areas? */
  rural?: boolean
  /** Trip duration > 4 weeks. */
  longStay?: boolean
  /** Any of: hiking, camping, fieldwork, cycling, etc. */
  outdoorActivities?: boolean
  /** Likely contact with animals (farms, vets, kids in rural areas). */
  animalContact?: boolean
  /** Healthcare or lab work. */
  medicalWork?: boolean
  /** Potential sexual contact with new partners. */
  sexualContact?: boolean
  /** Tattoos / piercings / non-emergency dental abroad. */
  bodyMods?: true | boolean
  /** Hajj or Umrah pilgrimage to Saudi Arabia. */
  hajj?: boolean
  /** Visiting friends or relatives — recognised higher-risk profile. */
  vfr?: boolean
}

/** Check whether a single TriggerCondition is satisfied by the answers. */
function conditionMatches(
  cond: TriggerCondition,
  answers: ConsultationAnswers,
): boolean {
  // A TriggerCondition is an AND across its set fields.
  // (Trigger arrays are OR across conditions — handled by the caller.)
  const checks: (keyof TriggerCondition & keyof ConsultationAnswers)[] = [
    'rural',
    'longStay',
    'outdoorActivities',
    'animalContact',
    'medicalWork',
    'sexualContact',
    'bodyMods',
    'hajj',
    'vfr',
  ]
  for (const key of checks) {
    if (cond[key] === true && answers[key] !== true) return false
  }
  return true
}

export interface FilteredRecommendation extends VaccineRecommendation {
  /** Whether this rec fired because it's routine, or which conditions
   *  fired it. Useful for showing the pharmacist "why" in the UI. */
  whyFired: 'all' | string[]
}

/**
 * Walk the destination's recommendations and return only those that
 * fire under the supplied answers, in the original order. Routine
 * ('all') recommendations always fire.
 */
export function filterRecommendations(
  destination: TravelDestination,
  answers: ConsultationAnswers,
): FilteredRecommendation[] {
  const out: FilteredRecommendation[] = []
  for (const rec of destination.recommendations) {
    if (rec.trigger === 'all') {
      out.push({ ...rec, whyFired: 'all' })
      continue
    }
    const matching: string[] = []
    for (const cond of rec.trigger) {
      if (conditionMatches(cond, answers)) {
        // Build a human-readable label of what matched
        const keys = Object.keys(cond) as (keyof TriggerCondition)[]
        matching.push(keys.map(prettyConditionLabel).join(' + '))
      }
    }
    if (matching.length > 0) {
      out.push({ ...rec, whyFired: matching })
    }
  }
  return out
}

const CONDITION_LABELS: Record<keyof TriggerCondition, string> = {
  rural: 'Rural travel',
  longStay: 'Long stay (>4w)',
  outdoorActivities: 'Outdoor activities',
  animalContact: 'Animal contact',
  medicalWork: 'Medical / aid work',
  sexualContact: 'Sexual contact risk',
  bodyMods: 'Tattoos / piercings',
  hajj: 'Hajj / Umrah',
  vfr: 'Visiting friends & relatives',
}

function prettyConditionLabel(key: keyof TriggerCondition): string {
  return CONDITION_LABELS[key]
}

/** Pretty labels surfaced in the UI. Keep aligned with CONDITION_LABELS. */
export const ASK_LABELS = CONDITION_LABELS
