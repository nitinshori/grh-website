import type { SkinInfectionConsultationState } from "./skin-infection-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import {
  getAgeBand,
  isCellulitisPgd,
  getFormulationOptions,
  derivedQuantity,
  hoursUntilReview,
} from "./skin-infection-logic";

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
          return "Patient is under 16: select who consented under 'Consent given by' (a person with parental responsibility, or the young person assessed as Gillick competent)";
        if (!state.consent.consentBasisNotes.trim())
          return "Patient is under 16: complete 'Basis recorded' (who consented, and for Gillick competence, the assessment made)";
      }
      return null;
    }

    case 2: {
      if (!a.infectionType) return "Select the 'Infection type'";
      if (!a.severity) return "Select the 'Severity'";
      if (!a.affectedSite.trim()) return "Complete 'Affected site and extent'";
      if (!a.durationDays.trim()) return "Complete 'Duration (days)'";
      if (!cellulitisPgd) {
        // Appendix 2: the record must hold the finding, so the measurements are required.
        if (!a.erythemaDiameterCm.trim()) return "Complete 'Largest diameter of erythema (cm)' (Appendix 2 finding)";
        if (!a.bodyRegionCount.trim()) return "Complete 'Number of body regions involved' (Appendix 2 finding)";
      }
      if (!cellulitisPgd && age !== null && age < 12 && !a.weightKg.trim())
        return "Complete 'Current weight (kg)' for a child under 12";
      // Observations: every observation must be measured and recorded before any supply.
      if (!a.temperature.trim()) return "Complete 'Temperature (C)' under Observations before supply";
      if (!a.pulse.trim()) return "Complete 'Pulse (per minute)' under Observations before supply";
      if (!a.respiratoryRate.trim()) return "Complete 'Respiratory rate (per minute)' under Observations before supply";
      if (cellulitisPgd) {
        if (!a.systolicBP.trim()) return "Complete 'Systolic blood pressure (mmHg)' under Observations before supply";
      } else {
        const band = getAgeBand(age);
        if (!a.oxygenSaturation.trim()) return "Complete 'Oxygen saturation on air at rest (%)' under Observations before supply";
        if (band === "12+" && !a.systolicBP.trim())
          return "Complete 'Systolic blood pressure (mmHg)' under Observations before supply (required from age 12)";
      }
      if (a.infectionType === "cellulitis" && (cellulitisPgd || (age !== null && age >= 12))) {
        if (!a.marginsMarked)
          return cellulitisPgd
            ? "Cellulitis: marking and review: tick 'The margin of the erythema has been marked' once it is done (inclusion requirement)"
            : "Cellulitis: marking and review: tick 'The edge of the erythema has been marked with a skin-safe pen' once it is done";
        if (cellulitisPgd && !a.marginMarkedTime.trim())
          return "Cellulitis: marking and review: complete 'Time the margin was marked'";
        if (!a.reviewDateTime.trim())
          return cellulitisPgd
            ? "Cellulitis: marking and review: complete '48-hour reassessment at this pharmacy, in person: booked date and time' (inclusion requirement)"
            : "Cellulitis: marking and review: complete 'In-person 48-hour review at this pharmacy: booked date and time'";
        // The review is AT 48 hours: a booking outside 36 to 60 hours is not the document's review.
        const hours = hoursUntilReview(state.summary.consultationDate, state.summary.consultationTime, a.reviewDateTime);
        if (hours === null) return "The review date and time could not be read; re-enter it";
        if (hours < 36 || hours > 60)
          return `The 48-hour review must be booked between 36 and 60 hours after this consultation (entered: ${Math.round(hours)} hours)`;
      }
      return null;
    }

    case 3:
      if (!mh.allergies.trim())
        return "Complete 'Allergies' (write 'NKDA' if none known)";
      return null;

    case 4: {
      if (!sel.choice) return "Select the 'Antibiotic'";
      if (sel.choice === "clarithromycin" && !mh.renalFunction)
        return "Clarithromycin: answer 'Renal function' (shown above the dose panel on this step, and on the Medical History step)";
      if (sel.choice !== "flucloxacillin" && !sel.flucloxUnsuitableReason)
        return "Select the 'Reason flucloxacillin was unsuitable' (inclusion for the second and third line arms: penicillin allergy, hepatic history, cannot manage empty-stomach dosing, or intolerance). Patient preference is not a reason under this PGD";
      if (!sel.courseDays) return "Select the 'Course length'";
      if (!cellulitisPgd) {
        // Document: 5 days for uncomplicated infection; 7 days for cellulitis.
        if (a.infectionType === "cellulitis" && sel.courseDays !== "7")
          return "Cellulitis is a 7-day course under this PGD";
        if (a.infectionType !== "cellulitis" && sel.courseDays !== "5")
          return "Uncomplicated infection is a 5-day course under this PGD (7 days is for cellulitis only)";
      }
      const options = getFormulationOptions(state);
      if (options.length === 0) return "No formulation is authorised for this antibiotic at this age or weight; choose another arm or refer";
      if (!sel.formulation || !options.some((o) => o.value === sel.formulation))
        return "Select the 'Formulation supplied' from the PGD's list for this arm";
      if (!sel.brand.trim()) return "Complete 'Brand supplied' (PGD records requirement)";
      const quantity = derivedQuantity(state);
      if (!quantity || sel.quantitySupplied !== quantity) return "Quantity is fixed by the PGD for the formulation and course length: select the 'Formulation supplied' and 'Course length' and it fills in";
      if (!sel.batchNumber.trim()) return "Complete 'Batch number'";
      if (!sel.expiryDate.trim()) return "Complete 'Expiry date'";
      return null;
    }

    case 5: {
      // Each message quotes the opening words of the checkbox it refers to.
      if (!c.completeCourse) return "Tick 'Finish the course, even if symptoms resolve earlier' once given";
      if (!c.administrationAdvice)
        return sel.choice === "flucloxacillin"
          ? "Tick 'Take on an empty stomach, an hour before food or two hours after' once given"
          : sel.choice === "doxycycline"
            ? "Tick 'Take with plenty of water, sitting or standing up' once given"
            : "Tick 'Take twice a day, with or without food' once given";
      if (!c.sideEffects) return "Tick 'Common side effects discussed' once given";
      if (!c.worseningAdvice)
        return cellulitisPgd
          ? "Tick 'Seek medical advice if symptoms worsen rapidly or significantly' once given"
          : "Tick 'Seek help THE SAME DAY if the pain becomes severe' once given";
      if (sel.choice === "doxycycline" && !c.sunProtection)
        return "Tick 'You may burn more easily in the sun' once given (doxycycline)";
      if (!c.seriousReactionAdvice)
        return "Tick 'Stop and seek urgent help if you develop a rash, wheeze, or swelling of the lips or tongue' once given";
      if (sel.choice === "flucloxacillin" && !c.hepaticAdvice)
        return "Tick 'Report yellowing of the eyes or skin, or dark urine' once given (flucloxacillin)";
      if (a.infectionType === "cellulitis" && !c.cellulitisReviewAdvice)
        return "Tick 'We have marked the edge of the redness and booked' the 48-hour review once given (cellulitis)";
      if (cellulitisPgd) {
        if (!c.selfCareAdvice) return "Tick 'Self-care: paracetamol or ibuprofen for pain and fever' once given";
        return null;
      }
      if (sel.choice === "flucloxacillin" && age !== null && age <= 9 && !c.childSyringeAdvice)
        return "Tick 'For a child aged 2 to 9: the dose is 5 mL four times a day' once the parent has been shown the oral syringe";
      if (sel.choice === "clarithromycin" && !c.interactionAdvice)
        return "Tick 'Tell us or your GP before starting any new medicine' once given (clarithromycin)";
      if (sel.choice === "doxycycline" && !c.antacidAdvice)
        return "Tick 'Avoid antacids, indigestion remedies, iron tablets and milk within 2 hours of a dose' once given (doxycycline)";
      return null;
    }

    case 6:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
