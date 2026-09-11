"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep, calculateAge } from "../shared/types";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { EyeInfectionsSummaryReport } from "./components/EyeInfectionsSummaryReport";
import {
  PGD_STRAPLINE,
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialEyeState,
  describeMedicine,
  type EyeConsultationState,
} from "./lib/eye-infections-state";

// Aligned to the Chloramphenicol eye drops and eye ointment (Bacterial
// Conjunctivitis) PGD, version 003, issued 11 September 2026.

export default function EyeInfectionsClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<EyeConsultationState>(() => createInitialEyeState());

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);


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

    // Traumatic onset is listed under Exclude in the document's guidance
    // summary, so it is a stop, not a flag that Next ignores.
    if (state.assessment.recentSurgeryOrTrauma) {
      alerts.push({
        severity: "stop",
        code: "SURGERY_TRAUMA",
        message: "Recent eye surgery or trauma",
        detail: "Exclusion: traumatic onset or recent eye surgery. Cannot supply under this PGD. Refer to the GP or eye care.",
      });
    }

    // RED FLAGS (urgent referral)
    if (state.assessment.symptomsRecurrent || state.assessment.durationSymptoms === ">7d") {
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
  }, [state.assessment, state.patient.age]);

  const hasStopAlerts = clinicalAlerts.some(a => a.severity === "stop");

  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      // Contemporaneous record: stamp the date and time when the
      // consultation actually starts, not when the tab was opened.
      setState(s => ({
        ...s,
        summary: {
          ...s.summary,
          consultationDate: new Date().toISOString().split("T")[0],
          consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
      }));
    }
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, [currentStep]);
  const handlePrev = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);
  const handleNewConsultation = useCallback(() => {
    setState(createInitialEyeState());
    setCurrentStep(0);
  }, []);
  const today = new Date().toISOString().split("T")[0];

  const validationError = useMemo((): string | null => {
    switch (currentStep) {
      case 0: {
        const base = validatePatientStep(state.patient, { minAge: 2 });
        if (base) return base;
        // The PGD record must contain name, address, date of birth and GP.
        if (!state.patient.address.trim()) return "Patient address is required for the PGD record";
        if (!state.patient.gpPractice.trim()) return "GP practice is required for the PGD record";
        return null;
      }
      case 1: {
        const base = validateConsentStep(state.consent);
        if (base) return base;
        if (state.patient.age !== null && state.patient.age < 16) {
          if (!state.consent.consentBasis || state.consent.consentBasis === "patient") {
            return "For a patient under 16, record whether the child is Gillick competent or a person with parental responsibility gave consent";
          }
          if (state.consent.consentBasis === "parental") {
            if (!state.consent.consentGivenByName.trim()) return "Record the name of the person with parental responsibility who gave consent";
            if (!state.consent.consentGivenByRelationship.trim()) return "Record the relationship of the person who gave consent to the patient";
          }
        }
        return null;
      }
      case 2: {
        if (hasStopAlerts) return "Patient meets exclusion criteria. Advise on alternative options; record the advice given and the decision reached in the box above; inform or refer to the GP as appropriate. Use Save as not supplied.";
        if (!state.assessment.eyeAffected) return "Please record which eye is affected";
        if (!state.assessment.durationSymptoms) return "Please record the duration of symptoms";
        if (!state.assessment.redEye || !state.assessment.stickyDischarge) return "Clinical diagnosis of bacterial conjunctivitis requires conjunctival injection (red eye) and purulent discharge (inclusion criterion)";
        if (!state.assessment.ableToInstil) return "Please confirm the patient is able to instil drops / apply ointment, or have this done by a carer (inclusion criterion)";
        if (!state.assessment.questionsAsked) return "Confirm that each of the exclusion and red-flag questions has been put to the patient";
        return null;
      }
      case 3: {
        const f = state.treatment.formulation;
        const t = state.treatment;
        if (!f) return "Please select the formulation supplied";
        if (f === "drops" || f === "both") {
          if (!t.dropsBrand.trim()) return "Please record the brand of eye drops dispensed";
          if (!t.dropsBatchNumber.trim()) return "Please record the eye drops batch number";
          if (!t.dropsExpiry) return "Please record the eye drops expiry date";
          if (t.dropsExpiry < today) return "The eye drops expiry date is before today; do not supply an expired product";
        }
        if (f === "ointment" || f === "both") {
          if (!t.ointmentBrand.trim()) return "Please record the brand of eye ointment dispensed";
          if (!t.ointmentBatchNumber.trim()) return "Please record the eye ointment batch number";
          if (!t.ointmentExpiry) return "Please record the eye ointment expiry date";
          if (t.ointmentExpiry < today) return "The eye ointment expiry date is before today; do not supply an expired product";
        }
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
      case 5: {
        const base = validateSummaryStep(state.summary);
        if (base) return base;
        if (!state.summary.consultationDate) return "Consultation date is required";
        return null;
      }
      default:
        return null;
    }
  }, [currentStep, state, hasStopAlerts, today]);


  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const medicine = describeMedicine(state.treatment);
    const supplied = !hasStopAlerts && !!medicine;
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: { ...state, alerts: clinicalAlerts } as unknown as Record<string, unknown>,
      outcome: hasStopAlerts ? "not_supplied" : "completed",
      medicine: supplied ? { name: medicine.name, dose: medicine.dose, duration: medicine.duration, quantity: medicine.quantity } : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: [state.summary.clinicalNotes, hasStopAlerts && state.summary.exclusionAdvice ? `Advice given (excluded): ${state.summary.exclusionAdvice}` : ""]
          .filter(Boolean)
          .join("\n"),
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStopAlerts, clinicalAlerts, __pharmProfile]);

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="print:hidden space-y-6">
      <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
      <ProgressBar current={currentStep + 1} total={TOTAL_STEPS} />

      {clinicalAlerts.length > 0 && (
        <AlertBanner alerts={clinicalAlerts} />
      )}

      {hasStopAlerts && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <TextArea
            label="Advice given to the excluded patient and referral made (recorded with the not-supplied record)"
            value={state.summary.exclusionAdvice}
            onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, exclusionAdvice: v } }))}
            placeholder="e.g. Advised that chloramphenicol cannot be supplied; referred urgently to eye casualty; written information given"
            rows={2}
          />
        </div>
      )}

      <StepWrapper
        title={STEP_LABELS[currentStep]}
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={!validationError && !hasStopAlerts}
        validationError={validationError}
        isBlocked={hasStopAlerts}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {/* STEP 0: Patient Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(String(value)) } : {}) } }))}
              requireAdult={false}
            />
            <p className="text-xs text-gray-500">Adults and children aged 2 years and over. Address and GP practice are required for the PGD record.</p>
          </div>
        )}

        {/* STEP 1: Consent */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
            />
            {state.patient.age !== null && state.patient.age < 16 && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-navy-900">Patient is under 16: record who gave consent</p>
                <SelectInput
                  label="Consent basis"
                  value={state.consent.consentBasis}
                  onChange={v => setState(prev => ({ ...prev, consent: { ...prev.consent, consentBasis: v as EyeConsultationState["consent"]["consentBasis"] } }))}
                  options={[
                    { value: "gillick", label: "Child assessed as Gillick competent and consented" },
                    { value: "parental", label: "Person with parental responsibility consented" },
                  ]}
                  required
                />
                {state.consent.consentBasis === "parental" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Name of person with parental responsibility"
                      value={state.consent.consentGivenByName}
                      onChange={v => setState(prev => ({ ...prev, consent: { ...prev.consent, consentGivenByName: v } }))}
                      required
                    />
                    <TextInput
                      label="Relationship to patient"
                      value={state.consent.consentGivenByRelationship}
                      onChange={v => setState(prev => ({ ...prev, consent: { ...prev.consent, consentGivenByRelationship: v } }))}
                      placeholder="e.g. Mother"
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </div>
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
                  label="Recent eye surgery or trauma (traumatic onset)"
                  checked={state.assessment.recentSurgeryOrTrauma}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, recentSurgeryOrTrauma: v } }))}
                  description="Exclusion: refer to GP or eye care"
                />
                <Checkbox
                  label="Only one functional eye"
                  checked={state.assessment.onlyOneFunctionalEye}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, onlyOneFunctionalEye: v } }))}
                />
                <Checkbox
                  label="Recurrent episodes (symptoms over 7 days are flagged from the duration above)"
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

            <div className="border-t pt-4">
              <Checkbox
                label="I have asked the patient each of the exclusion and red-flag questions above and recorded the answers"
                checked={state.assessment.questionsAsked}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, questionsAsked: v } }))}
                required
              />
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
                <h3 className="font-medium text-sm text-gray-900">Eye Drops - Chloramphenicol 0.5%: 1 x 10 ml bottle</h3>
                <TextInput
                  label="Brand dispensed"
                  value={state.treatment.dropsBrand}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dropsBrand: v } }))}
                  placeholder="e.g. Optrex Infected Eyes, Golden Eye, or generic chloramphenicol 0.5%"
                  required
                />
                <TextInput
                  label="Batch Number"
                  value={state.treatment.dropsBatchNumber}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dropsBatchNumber: v } }))}
                  required
                />
                <TextInput
                  label="Expiry Date"
                  type="date"
                  value={state.treatment.dropsExpiry}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dropsExpiry: v } }))}
                  required
                />
              </div>
            )}

            {(state.treatment.formulation === "ointment" || state.treatment.formulation === "both") && (
              <div className="border-l-4 border-green-400 bg-green-50 p-4 space-y-3">
                <h3 className="font-medium text-sm text-gray-900">Eye Ointment - Chloramphenicol 1%: 1 x 4 g tube</h3>
                <TextInput
                  label="Brand dispensed"
                  value={state.treatment.ointmentBrand}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ointmentBrand: v } }))}
                  placeholder="e.g. Golden Eye ointment, or generic chloramphenicol 1%"
                  required
                />
                <TextInput
                  label="Batch Number"
                  value={state.treatment.ointmentBatchNumber}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ointmentBatchNumber: v } }))}
                  required
                />
                <TextInput
                  label="Expiry Date"
                  type="date"
                  value={state.treatment.ointmentExpiry}
                  onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ointmentExpiry: v } }))}
                  required
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
                required
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
            <p className="text-xs text-gray-500">Save &amp; Print Record saves the consultation and prints the record below.</p>
          </div>
        )}
      </StepWrapper>
      </div>

      {/* Print view: the consultation record */}
      <div className="hidden print:block">
        <EyeInfectionsSummaryReport state={state} alerts={clinicalAlerts} hasStops={hasStopAlerts} />
      </div>
    </div>
  );
}
