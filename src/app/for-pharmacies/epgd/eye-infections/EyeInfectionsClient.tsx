"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep, calculateAge } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

// Aligned to the Chloramphenicol eye drops and eye ointment (Bacterial
// Conjunctivitis) PGD, version 002, issued 11 September 2026.
const PGD_STRAPLINE = "Chloramphenicol eye drops and eye ointment (Bacterial Conjunctivitis) PGD, version 002, issued 11 September 2026";

export default function EyeInfectionsClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      eyeAffected: "",
      durationSymptoms: "",
      stickyDischarge: false,
      redEye: false,
      grittySensation: false,
      eyelidSwelling: false,
      crustingOnWaking: false,
      contactLensWearer: false,
      chloramphenicolAllergy: false,
      boneMarrowProblems: false,
      boneMarrowSuppressionOrChemo: false,
      pregnantOrBreastfeeding: false,
      painInsideEye: false,
      photophobia: false,
      suspectedCornealUlcerOrAbrasion: false,
      suspectedViral: false,
      recentSurgeryOrTrauma: false,
      onlyOneFunctionalEye: false,
      symptomsRecurrent: false,
      childUnder2: false,
      ableToInstil: false,
    },
    treatment: {
      formulation: "",
      dropsStartTime: "",
      durationDays: 5,
      dropsBatchNumber: "",
      dropsExpiry: "",
      ointmentBatchNumber: "",
      ointmentExpiry: "",
    },
    counselling: {
      handsBeforeAfter: false,
      noSharing: false,
      discardContactLenses: false,
      completeCourse: false,
      discard28Days: false,
      returnIfWorse: false,
      blurredVisionWarning: false,
      innerCanthusPressure: false,
      urgentSymptoms: false,
      reportAdverse: false,
      pregnancyInform: false,
      pilSupplied: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      clinicalNotes: "",
    },
  });

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);


  const clinicalAlerts = useMemo((): ClinicalAlert[] => {
    const alerts: ClinicalAlert[] = [];

    // HARD STOPS (exclusion criteria, both arms)
    if (state.assessment.chloramphenicolAllergy) {
      alerts.push({
        severity: "stop",
        code: "CHLOR_ALLERGY",
        message: "Hypersensitivity to chloramphenicol or any excipients",
        detail: "Exclusion. Cannot supply. Advise on alternative options; inform or refer to the GP as appropriate.",
      });
    }
    if (state.assessment.boneMarrowProblems) {
      alerts.push({
        severity: "stop",
        code: "BONE_MARROW",
        message: "Personal or family history of aplastic anaemia or other blood dyscrasias",
        detail: "Exclusion. Cannot supply. Refer to GP.",
      });
    }
    if (state.assessment.boneMarrowSuppressionOrChemo) {
      alerts.push({
        severity: "stop",
        code: "BONE_MARROW_SUPPRESSION",
        message: "Concurrent bone marrow suppression or chemotherapy",
        detail: "Exclusion. Cannot supply. Refer to GP.",
      });
    }
    if (state.assessment.childUnder2 || (state.patient.age !== null && state.patient.age < 2)) {
      alerts.push({
        severity: "stop",
        code: "CHILD_UNDER_2",
        message: "Age less than 2 years",
        detail: "Exclusion. Cannot supply. Refer to GP.",
      });
    }
    if (state.assessment.painInsideEye) {
      alerts.push({
        severity: "stop",
        code: "EYE_PAIN",
        message: "Severe eye pain",
        detail: "Exclusion: suggests more serious pathology. Refer urgently to GP or eye casualty.",
      });
    }
    if (state.assessment.photophobia) {
      alerts.push({
        severity: "stop",
        code: "PHOTOPHOBIA",
        message: "Photophobia or reduced vision",
        detail: "Exclusion: suggests more serious pathology. Refer urgently to GP or eye casualty.",
      });
    }
    if (state.assessment.suspectedCornealUlcerOrAbrasion) {
      alerts.push({
        severity: "stop",
        code: "CORNEAL",
        message: "Suspected corneal ulceration or abrasion",
        detail: "Exclusion. Refer urgently.",
      });
    }
    if (state.assessment.suspectedViral) {
      alerts.push({
        severity: "stop",
        code: "VIRAL",
        message: "Suspected viral aetiology (herpes simplex)",
        detail: "Exclusion. Refer urgently.",
      });
    }

    // RED FLAGS (urgent referral)
    if (state.assessment.recentSurgeryOrTrauma) {
      alerts.push({
        severity: "red-flag",
        code: "SURGERY_TRAUMA",
        message: "Recent Eye Surgery or Trauma",
        detail: "Recent eye surgery or trauma. Cannot supply under PGD. Refer to GP or eye care.",
      });
    }
    if (state.assessment.symptomsRecurrent) {
      alerts.push({
        severity: "red-flag",
        code: "RECURRENT",
        message: "Recurrent or Persistent Infection",
        detail: "Symptoms >7 days or recurrent episodes. Refer to GP for further investigation.",
      });
    }

    // CAUTIONS
    if (state.assessment.contactLensWearer) {
      alerts.push({
        severity: "caution",
        code: "CONTACT_LENS",
        message: "Contact Lens Wearer",
        detail: "Advise removal of contact lenses during treatment and for 48 hours after completion; do not use drops while lenses are in situ. Ointment may damage or coat lenses.",
      });
    }
    if (state.assessment.pregnantOrBreastfeeding) {
      alerts.push({
        severity: "caution",
        code: "PREGNANCY",
        message: "Pregnancy/Breastfeeding",
        detail: "Pregnancy and breastfeeding: use only if benefit outweighs risk; minimal systemic absorption expected.",
      });
    }
    if (state.assessment.onlyOneFunctionalEye) {
      alerts.push({
        severity: "caution",
        code: "ONE_EYE",
        message: "Only One Functional Eye",
        detail: "Patient has only one functional eye. Lower threshold for referral if symptoms do not improve.",
      });
    }

    return alerts;
  }, [state.assessment]);

  const hasStopAlerts = clinicalAlerts.some(a => a.severity === "stop");

  const handleNext = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, 6)), []);
  const handlePrev = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

  const validationError = useMemo((): string | null => {
    switch (currentStep) {
      case 0:
        return validatePatientStep(state.patient, { minAge: 2 });
      case 1:
        return validateConsentStep(state.consent);
      case 2: {
        if (hasStopAlerts) return "Patient meets exclusion criteria. Advise on alternative options; document the advice given and the decision reached; inform or refer to the GP as appropriate.";
        if (!state.assessment.eyeAffected) return "Please record which eye is affected";
        if (!state.assessment.durationSymptoms) return "Please record the duration of symptoms";
        if (!state.assessment.redEye || !state.assessment.stickyDischarge) return "Clinical diagnosis of bacterial conjunctivitis requires conjunctival injection (red eye) and purulent discharge (inclusion criterion)";
        if (!state.assessment.ableToInstil) return "Please confirm the patient is able to instil drops / apply ointment, or have this done by a carer (inclusion criterion)";
        return null;
      }
      case 3: {
        const f = state.treatment.formulation;
        if (!f) return "Please select the formulation supplied";
        if ((f === "drops" || f === "both") && !state.treatment.dropsBatchNumber.trim()) return "Please record the eye drops batch number";
        if ((f === "ointment" || f === "both") && !state.treatment.ointmentBatchNumber.trim()) return "Please record the eye ointment batch number";
        return null;
      }
      case 4: {
        const c = state.counselling;
        if (!c.handsBeforeAfter || !c.noSharing || !c.completeCourse || !c.returnIfWorse || !c.urgentSymptoms || !c.reportAdverse || !c.blurredVisionWarning) return "Please confirm all counselling points";
        if (state.assessment.contactLensWearer && !c.discardContactLenses) return "Please confirm contact lens advice (remove during treatment and for 48 hours after completion)";
        if ((state.treatment.formulation === "drops" || state.treatment.formulation === "both") && !c.innerCanthusPressure) return "Please confirm inner canthus pressure advice for drops";
        if (state.assessment.pregnantOrBreastfeeding && !c.pregnancyInform) return "Please confirm pregnancy advice";
        if (!c.pilSupplied) return "Please confirm the patient information leaflet has been supplied";
        return null;
      }
      case 5:
        return validateSummaryStep(state.summary);
      default:
        return null;
    }
  }, [currentStep, state, hasStopAlerts]);

  const stepTitles = ["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Complete"];


  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: hasStopAlerts ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStopAlerts]);

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
      <ProgressBar current={currentStep + 1} total={7} />

      {clinicalAlerts.length > 0 && (
        <AlertBanner alerts={clinicalAlerts} />
      )}

      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={!validationError}
        validationError={validationError}
        isBlocked={currentStep === 2 && hasStopAlerts}
       getConsultationData={getConsultationData}>
        {/* STEP 0: Patient Details */}
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(String(value)) } : {}) } }))}
            requireAdult={false}
          />
        )}

        {/* STEP 1: Consent */}
        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
          />
        )}

        {/* STEP 2: Assessment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Eye Affected *</label>
              <select
                value={state.assessment.eyeAffected}
                onChange={e => setState(prev => ({ ...prev, assessment: { ...prev.assessment, eyeAffected: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="left">Left Eye</option>
                <option value="right">Right Eye</option>
                <option value="both">Both Eyes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Duration of Symptoms *</label>
              <select
                value={state.assessment.durationSymptoms}
                onChange={e => setState(prev => ({ ...prev, assessment: { ...prev.assessment, durationSymptoms: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="<24h">&lt;24 hours</option>
                <option value="1-3d">1-3 days</option>
                <option value="3-7d">3-7 days</option>
                <option value=">7d">&gt;7 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Symptoms (select all that apply)</label>
              <div className="space-y-2">
                <Checkbox
                  label="Purulent discharge (required for diagnosis)"
                  checked={state.assessment.stickyDischarge}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, stickyDischarge: v } }))}
                />
                <Checkbox
                  label="Red eye / conjunctival injection (required for diagnosis)"
                  checked={state.assessment.redEye}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, redEye: v } }))}
                />
                <Checkbox
                  label="Gritty sensation"
                  checked={state.assessment.grittySensation}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, grittySensation: v } }))}
                />
                <Checkbox
                  label="Eyelid swelling"
                  checked={state.assessment.eyelidSwelling}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, eyelidSwelling: v } }))}
                />
                <Checkbox
                  label="Crusting on waking"
                  checked={state.assessment.crustingOnWaking}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, crustingOnWaking: v } }))}
                />
              </div>
              <div className="mt-3">
                <Checkbox
                  label="Able to instil drops / apply ointment, or have this done by a carer"
                  checked={state.assessment.ableToInstil}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, ableToInstil: v } }))}
                  description="Inclusion criterion, both arms"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">Risk Factors & Contraindications</label>
              <div className="space-y-2">
                <Checkbox
                  label="Contact lens wearer"
                  checked={state.assessment.contactLensWearer}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, contactLensWearer: v } }))}
                  description="Caution: remove lenses during treatment and for 48 hours after completion; do not use drops with lenses in; ointment may damage lenses"
                />
                <Checkbox
                  label="Hypersensitivity to chloramphenicol or any excipients"
                  checked={state.assessment.chloramphenicolAllergy}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, chloramphenicolAllergy: v } }))}
                  description="Exclusion"
                />
                <Checkbox
                  label="Personal or family history of aplastic anaemia or other blood dyscrasias"
                  checked={state.assessment.boneMarrowProblems}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, boneMarrowProblems: v } }))}
                  description="Exclusion"
                />
                <Checkbox
                  label="Concurrent bone marrow suppression or chemotherapy"
                  checked={state.assessment.boneMarrowSuppressionOrChemo}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, boneMarrowSuppressionOrChemo: v } }))}
                  description="Exclusion"
                />
                <Checkbox
                  label="Currently pregnant or breastfeeding"
                  checked={state.assessment.pregnantOrBreastfeeding}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnantOrBreastfeeding: v } }))}
                  description="Caution: use only if benefit outweighs risk; minimal systemic absorption expected"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">Red Flags (exclusions: refer urgently to GP / eye casualty)</label>
              <div className="space-y-2">
                <Checkbox
                  label="Severe eye pain (not surface irritation)"
                  checked={state.assessment.painInsideEye}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painInsideEye: v } }))}
                  description="Exclusion: suggests more serious pathology"
                />
                <Checkbox
                  label="Photophobia or reduced vision"
                  checked={state.assessment.photophobia}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, photophobia: v } }))}
                  description="Exclusion: suggests more serious pathology"
                />
                <Checkbox
                  label="Suspected corneal ulceration or abrasion"
                  checked={state.assessment.suspectedCornealUlcerOrAbrasion}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, suspectedCornealUlcerOrAbrasion: v } }))}
                  description="Exclusion: refer urgently"
                />
                <Checkbox
                  label="Suspected viral aetiology (e.g. herpes simplex)"
                  checked={state.assessment.suspectedViral}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, suspectedViral: v } }))}
                  description="Exclusion: refer urgently"
                />
                <Checkbox
                  label="Recent eye surgery or trauma"
                  checked={state.assessment.recentSurgeryOrTrauma}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, recentSurgeryOrTrauma: v } }))}
                />
                <Checkbox
                  label="Only one functional eye"
                  checked={state.assessment.onlyOneFunctionalEye}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, onlyOneFunctionalEye: v } }))}
                />
                <Checkbox
                  label="Symptoms >7 days or recurrent episodes"
                  checked={state.assessment.symptomsRecurrent}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, symptomsRecurrent: v } }))}
                />
                <Checkbox
                  label="Child under 2 years"
                  checked={state.assessment.childUnder2}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, childUnder2: v } }))}
                  description="Exclusion (also enforced from the date of birth)"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Treatment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Formulation *</label>
              <select
                value={state.treatment.formulation}
                onChange={e => setState(prev => ({ ...prev, treatment: { ...prev.treatment, formulation: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="drops">Chloramphenicol 0.5% eye drops (P)</option>
                <option value="ointment">Chloramphenicol 1% eye ointment (P)</option>
                <option value="both">Both: drops with ointment at night</option>
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Drops (0.5%): instil 1 drop into the conjunctival sac of the affected eye(s) every 2 hours initially for 48 hours, then 1 drop four times daily (QDS) for 5 days total. Quantity: 1 bottle, 10 ml.
              </p>
              <p className="text-xs text-gray-600">
                Ointment (1%): apply to the conjunctival sac of the affected eye(s) at night (once daily) as an adjunct to drops, or four times daily (QDS) if the patient is unable to use or prefers not to use drops. Quantity: 1 tube, 4 g. 5 days total.
              </p>
              <p className="text-xs text-gray-600">
                Legal category P (Pharmacy supply). Store below 25 C; keep container tightly closed; do not use after the expiry date on the label.
              </p>
            </div>

            {(state.treatment.formulation === "drops" || state.treatment.formulation === "both") && (
              <div className="border-l-4 border-blue-400 bg-blue-50 p-4 space-y-3">
                <h3 className="font-medium text-sm text-gray-900">Eye Drops - Chloramphenicol 0.5%</h3>
                <TextInput
                  label="Batch Number"
                  value={state.treatment.dropsBatchNumber}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dropsBatchNumber: v } }))}
                />
                <TextInput
                  label="Expiry Date"
                  type="date"
                  value={state.treatment.dropsExpiry}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dropsExpiry: v } }))}
                />
              </div>
            )}

            {(state.treatment.formulation === "ointment" || state.treatment.formulation === "both") && (
              <div className="border-l-4 border-green-400 bg-green-50 p-4 space-y-3">
                <h3 className="font-medium text-sm text-gray-900">Eye Ointment - Chloramphenicol 1%</h3>
                <TextInput
                  label="Batch Number"
                  value={state.treatment.ointmentBatchNumber}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ointmentBatchNumber: v } }))}
                />
                <TextInput
                  label="Expiry Date"
                  type="date"
                  value={state.treatment.ointmentExpiry}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ointmentExpiry: v } }))}
                />
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">Treatment Summary</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Duration: 5 days total. Do not extend treatment beyond 5 days without review (very rare risk of aplastic anaemia with prolonged use)</li>
                <li>• Patient to discard remaining product 28 days after opening</li>
                <li>• Review if no improvement after 48 hours</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 4: Counselling */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-4">Patient Counselling Checklist</p>
              <div className="space-y-3">
                <Checkbox
                  label="Wash hands before and after applying drops/ointment"
                  checked={state.counselling.handsBeforeAfter}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, handsBeforeAfter: v } }))}
                />
                <Checkbox
                  label="Do not share towels, pillows, or cosmetics during treatment (infectious risk)"
                  checked={state.counselling.noSharing}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, noSharing: v } }))}
                />
                <Checkbox
                  label="Contact lens wearers: remove lenses during treatment and do not reinsert for 48 hours after completion; do not use drops with lenses in; ointment may damage or coat lenses"
                  checked={state.counselling.discardContactLenses}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, discardContactLenses: v } }))}
                />
                <Checkbox
                  label="Drops: apply pressure to the inner canthus (lacrimal duct area) for 1 to 2 minutes after instillation to reduce systemic absorption and improve local effect"
                  checked={state.counselling.innerCanthusPressure}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, innerCanthusPressure: v } }))}
                />
                <Checkbox
                  label="Complete the full 5-day course even if symptoms resolve earlier (to prevent relapse); do not extend treatment beyond 5 days without review"
                  checked={state.counselling.completeCourse}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, completeCourse: v } }))}
                />
                <Checkbox
                  label="Discard remaining drops/ointment 28 days after opening"
                  checked={state.counselling.discard28Days}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, discard28Days: v } }))}
                />
                <Checkbox
                  label="Symptoms should improve within 48 hours; if not, contact the GP to review the diagnosis and consider alternative treatment"
                  checked={state.counselling.returnIfWorse}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, returnIfWorse: v } }))}
                />
                <Checkbox
                  label="If symptoms worsen, or eye pain, photophobia or vision changes develop, seek immediate medical advice (GP, NHS 111, or eye casualty)"
                  checked={state.counselling.urgentSymptoms}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, urgentSymptoms: v } }))}
                />
                <Checkbox
                  label={state.treatment.formulation === "drops"
                    ? "Informed of transient stinging and temporary blurred vision after instillation"
                    : "Informed of temporary blurred vision; ointment: do not drive or operate machinery until vision clears"}
                  checked={state.counselling.blurredVisionWarning}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, blurredVisionWarning: v } }))}
                />
                <Checkbox
                  label="Report any adverse reactions or unexpected effects to the GP or healthcare provider"
                  checked={state.counselling.reportAdverse}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, reportAdverse: v } }))}
                />
                <Checkbox
                  label="If pregnancy is discovered during treatment, inform a healthcare provider (topical use is low-risk)"
                  checked={state.counselling.pregnancyInform}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, pregnancyInform: v } }))}
                />
                <Checkbox
                  label="Patient information leaflet (PIL) supplied with the chloramphenicol drops/ointment"
                  checked={state.counselling.pilSupplied}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, pilSupplied: v } }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Summary */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist Name"
              value={state.summary.pharmacistName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))}
              required
            />
            <TextInput
              label="GPhC Registration"
              value={state.summary.pharmacistGPhC}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))}
              required
            />
            <TextInput
              label="Pharmacy Name"
              value={state.summary.pharmacyName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))}
            />
            <TextInput
              label="Pharmacy Address"
              value={state.summary.pharmacyAddress}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyAddress: v } }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Consultation Date"
                type="date"
                value={state.summary.consultationDate}
                onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, consultationDate: v } }))}
              />
              <TextInput
                label="Consultation Time"
                type="time"
                value={state.summary.consultationTime}
                onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, consultationTime: v } }))}
              />
            </div>
            <TextArea
              label="Clinical Notes"
              value={state.summary.clinicalNotes}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))}
              rows={4}
            />
          </div>
        )}

        {/* STEP 6: Consultation Complete */}
        {currentStep === 6 && (
          <div className="p-6 bg-green-50 border border-green-300 rounded-lg text-center">
            <p className="text-lg font-semibold text-green-900 mb-2">Consultation Record Complete</p>
            <p className="text-sm text-green-700">
              Eye infection ePGD consultation for Chloramphenicol 0.5% eye drops / 1% eye ointment has been recorded ({PGD_STRAPLINE}).
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
