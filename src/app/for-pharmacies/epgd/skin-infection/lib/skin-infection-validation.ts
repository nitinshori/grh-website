import type { SkinInfectionConsultationState } from "./skin-infection-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getAgeBand, isCellulitisPgd } from "./skin-infection-logic";

export function validateStep(
  stepIndex: number,
  state: SkinInfectionConsultationState,
): string | null {
  const cellulitisPgd = isCellulitisPgd(state);
  const age = state.patient.age;
  const a = state.assessment;
  const mh = state.medicalHistory;
  const sel = state.antibioticSelection;
  const c = state.counselling;

  switch (stepIndex) {
    case 0:
      // Cellulitis PGD: adults 18 and over. Skin and soft tissue infection PGD: from 2 years.
      return validatePatientStep(state.patient, { minAge: cellulitisPgd ? 18 : 2 });

    case 1: {
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (!cellulitisPgd && age !== null && age < 16) {
        if (!state.consent.consentBasis)
          return "Patient is under 16: record whether consent came from a person with parental responsibility or from the young person assessed as Gillick competent";
        if (!state.consent.consentBasisNotes.trim())
          return "Record the basis of consent (who gave it, and for Gillick competence, the assessment made)";
      }
      return null;
    }

    case 2: {
      if (!a.infectionType) return "Please select the infection type";
      if (!a.severity) return "Please assess severity";
      if (!a.affectedSite.trim()) return "Please describe the affected site";
      if (!a.durationDays.trim()) return "Please record how long symptoms have been present";
      if (!cellulitisPgd && age !== null && age < 12 && !a.weightKg.trim())
        return "Please record the child's current weight in kg";
      // Observations: every observation must be measured and recorded before any supply.
      if (!a.temperature.trim()) return "Please record the temperature";
      if (!a.pulse.trim()) return "Please record the pulse";
      if (!a.respiratoryRate.trim()) return "Please record the respiratory rate";
      if (cellulitisPgd) {
        if (!a.systolicBP.trim()) return "Please record the systolic blood pressure";
      } else {
        const band = getAgeBand(age);
        if (!a.oxygenSaturation.trim()) return "Please record the oxygen saturation on air at rest";
        if (band === "12+" && !a.systolicBP.trim())
          return "Please record the systolic blood pressure (required from age 12)";
      }
      if (a.infectionType === "cellulitis" && (cellulitisPgd || (age !== null && age >= 12))) {
        if (!a.marginsMarked)
          return cellulitisPgd
            ? "Cellulitis: confirm the margin of the erythema has been marked (inclusion requirement)"
            : "Cellulitis: confirm the edge of the erythema has been marked with a skin-safe pen";
        if (cellulitisPgd && !a.marginMarkedTime.trim())
          return "Cellulitis: record the time the margin was marked";
        if (!cellulitisPgd && !a.reviewDateTime.trim())
          return "Cellulitis: record the date and time of the booked in-person 48-hour review at this pharmacy";
      }
      return null;
    }

    case 3:
      if (!mh.allergies.trim())
        return "Please record allergy status (write 'NKDA' if none known)";
      return null;

    case 4: {
      if (!sel.choice) return "Please select the antibiotic";
      if (sel.choice === "clarithromycin" && !mh.renalFunction)
        return "Clarithromycin: ask about renal function and record the answer (Medical History step)";
      if (sel.choice !== "flucloxacillin" && !sel.rationale.trim())
        return "Record the reason flucloxacillin was unsuitable (penicillin allergy or other reason)";
      if (!sel.courseDays) return "Please select the course length";
      if (!cellulitisPgd) {
        // Document: 5 days for uncomplicated infection; 7 days for cellulitis.
        if (a.infectionType === "cellulitis" && sel.courseDays !== "7")
          return "Cellulitis is a 7-day course under this PGD";
        if (a.infectionType !== "cellulitis" && sel.courseDays !== "5")
          return "Uncomplicated infection is a 5-day course under this PGD (7 days is for cellulitis only)";
      }
      if (!sel.quantitySupplied.trim()) return "Please record the quantity supplied";
      if (!cellulitisPgd) {
        if (!sel.batchNumber.trim()) return "Please record the batch number";
        if (!sel.expiryDate.trim()) return "Please record the expiry date";
      }
      return null;
    }

    case 5: {
      if (!c.completeCourse) return "Please confirm course-completion counselling";
      if (!c.administrationAdvice) return "Please confirm administration advice was given";
      if (!c.sideEffects) return "Please confirm side-effect counselling";
      if (!c.worseningAdvice)
        return "Please confirm same-day warning-sign advice and the 2 to 3 day review advice";
      if (sel.choice === "doxycycline" && !c.sunProtection)
        return "Please confirm sun-protection advice for doxycycline";
      if (cellulitisPgd) {
        if (!c.selfCareAdvice) return "Please confirm the self-care and prevention advice";
        return null;
      }
      if (!c.seriousReactionAdvice)
        return "Please confirm the serious reaction advice (stop and seek urgent help for rash, wheeze, lip or tongue swelling; 999 for breathing difficulty)";
      if (sel.choice === "flucloxacillin" && !c.hepaticAdvice)
        return "Please confirm the jaundice / dark urine advice for flucloxacillin";
      if (sel.choice === "flucloxacillin" && age !== null && age <= 9 && !c.childSyringeAdvice)
        return "Please confirm the oral syringe and 5 mL dose advice for a child aged 2 to 9";
      if (a.infectionType === "cellulitis" && !c.cellulitisReviewAdvice)
        return "Please confirm the cellulitis marking and 48-hour review advice";
      if (sel.choice === "clarithromycin" && !c.interactionAdvice)
        return "Please confirm the interaction advice for clarithromycin";
      if (sel.choice === "doxycycline" && !c.antacidAdvice)
        return "Please confirm the antacid, iron and milk advice for doxycycline";
      return null;
    }

    case 6:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
