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

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
export default function EyeInfectionsClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
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
      pregnantOrBreastfeeding: false,
      painInsideEye: false,
      photophobia: false,
      recentSurgeryOrTrauma: false,
      onlyOneFunctionalEye: false,
      symptomsRecurrent: false,
      childUnder2: false,
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

    // HARD STOPS
    if (state.assessment.chloramphenicolAllergy) {
      alerts.push({
        severity: "stop",
        code: "CHLOR_ALLERGY",
        message: "Contraindication",
        detail: "Known allergy to chloramphenicol. Cannot supply. Refer to GP or A&E.",
      });
    }
    if (state.assessment.boneMarrowProblems) {
      alerts.push({
        severity: "stop",
        code: "BONE_MARROW",
        message: "Contraindication",
        detail: "History of bone marrow problems/blood disorders. Cannot supply. Refer to GP.",
      });
    }
    if (state.assessment.childUnder2) {
      alerts.push({
        severity: "stop",
        code: "CHILD_UNDER_2",
        message: "Contraindication",
        detail: "Child under 2 years. Cannot supply. Refer to GP.",
      });
    }

    // RED FLAGS (urgent referral)
    if (state.assessment.painInsideEye) {
      alerts.push({
        severity: "red-flag",
        code: "EYE_PAIN",
        message: "Possible Iritis/Uveitis",
        detail: "Pain inside the eye (not surface irritation) suggests possible iritis or uveitis. Refer to urgent eye care.",
      });
    }
    if (state.assessment.photophobia) {
      alerts.push({
        severity: "red-flag",
        code: "PHOTOPHOBIA",
        message: "Photophobia or Visual Disturbance",
        detail: "Photophobia and/or visual disturbance detected. Refer urgently to ophthalmology.",
      });
    }
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
        detail: "Patient must stop wearing contact lenses during treatment and for 24 hours after completion.",
      });
    }
    if (state.assessment.pregnantOrBreastfeeding) {
      alerts.push({
        severity: "caution",
        code: "PREGNANCY",
        message: "Pregnancy/Breastfeeding",
        detail: "Patient is pregnant or breastfeeding. Use caution; discuss risks vs benefits. Consider GP referral.",
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

  const canProceedFromAssessment = !hasStopAlerts;

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
      outcome: "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state]);

  return (
    <div className="space-y-6">
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
        canProceed={currentStep === 2 ? canProceedFromAssessment : true}
        validationError={currentStep === 2 && hasStopAlerts ? "Please address contraindications before proceeding." : null}
       getConsultationData={getConsultationData}>
        {/* STEP 0: Patient Details */}
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
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
                  label="Sticky/purulent discharge"
                  checked={state.assessment.stickyDischarge}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, stickyDischarge: v } }))}
                />
                <Checkbox
                  label="Red eye"
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
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">Risk Factors & Contraindications</label>
              <div className="space-y-2">
                <Checkbox
                  label="Contact lens wearer"
                  checked={state.assessment.contactLensWearer}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, contactLensWearer: v } }))}
                />
                <Checkbox
                  label="Known allergy to chloramphenicol"
                  checked={state.assessment.chloramphenicolAllergy}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, chloramphenicolAllergy: v } }))}
                />
                <Checkbox
                  label="History of bone marrow problems / blood disorders"
                  checked={state.assessment.boneMarrowProblems}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, boneMarrowProblems: v } }))}
                />
                <Checkbox
                  label="Currently pregnant or breastfeeding"
                  checked={state.assessment.pregnantOrBreastfeeding}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnantOrBreastfeeding: v } }))}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">Red Flags</label>
              <div className="space-y-2">
                <Checkbox
                  label="Pain inside the eye (not surface irritation)"
                  checked={state.assessment.painInsideEye}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painInsideEye: v } }))}
                />
                <Checkbox
                  label="Photophobia / visual disturbance"
                  checked={state.assessment.photophobia}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, photophobia: v } }))}
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
                <option value="drops">Eye Drops (0.5%)</option>
                <option value="ointment">Eye Ointment (1%)</option>
                <option value="both">Both Drops & Ointment</option>
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Drops: 1 drop every 2 hours for 48 hours, then 4 times daily for 5 days total (1 x 10ml bottle)
              </p>
              <p className="text-xs text-gray-600">
                Ointment: Apply at night (or 3-4 times daily if ointment only) for 5 days (1 x 4g tube)
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
                <li>• Duration: 5 days</li>
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
                  label="Do not share towels, flannels, or pillowcases"
                  checked={state.counselling.noSharing}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, noSharing: v } }))}
                />
                <Checkbox
                  label="Discard contact lenses worn during infection"
                  checked={state.counselling.discardContactLenses}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, discardContactLenses: v } }))}
                />
                <Checkbox
                  label="Complete the full 5-day course (even if symptoms improve)"
                  checked={state.counselling.completeCourse}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, completeCourse: v } }))}
                />
                <Checkbox
                  label="Discard remaining drops/ointment 28 days after opening"
                  checked={state.counselling.discard28Days}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, discard28Days: v } }))}
                />
                <Checkbox
                  label="Return if symptoms worsen or no improvement after 48 hours"
                  checked={state.counselling.returnIfWorse}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, returnIfWorse: v } }))}
                />
                <Checkbox
                  label="Informed of temporary blurred vision with eye drops"
                  checked={state.counselling.blurredVisionWarning}
                  onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, blurredVisionWarning: v } }))}
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
              Eye infection ePGD consultation for Chloramphenicol 0.5% eye drops / 1% ointment has been recorded.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
