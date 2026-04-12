"use client";

import { useState, useCallback } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";

interface HepBState {
  patient: { firstName: string; lastName: string; dateOfBirth: string; age: number | null; gpName: string; gpPractice: string; nhsNumber: string; address: string; phone: string; email: string };
  consent: { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean };
  assessment: {
    reasonForVaccination: string;
    previousVaccination: string;
    antiHBsLevelChecked: boolean;
    antiHBsLevel: string;
    knownHBPositive: boolean;
    knownHCVPositive: boolean;
    knownHIVPositive: boolean;
    currentAcuteIllness: boolean;
    allergyVaccineComponent: boolean;
    immunosuppressed: boolean;
    pregnancy: boolean;
    ageUnder16: boolean;
    previousSevereReaction: boolean;
  };
  treatment: {
    vaccine: string;
    schedule: string;
    doseNumber: string;
    injectionSite: string;
    batchNumber: string;
    expiryDate: string;
    observationPeriodCompleted: boolean;
  };
  counselling: {
    counsellingProvided: boolean;
    nextDoseDate: string;
    serologyRecommended: boolean;
    postExposureProtocolExplained: boolean;
    counsellingNotes: string;
  };
  summary: {
    pharmacistName: string;
    pharmacistGPhC: string;
    pharmacyName: string;
    pharmacyAddress: string;
    consultationDate: string;
    consultationTime: string;
    clinicalNotes: string;
  };
}

export default function HepBOccupationalClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);

  const [state, setState] = useState<HepBState>({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      reasonForVaccination: "",
      previousVaccination: "",
      antiHBsLevelChecked: false,
      antiHBsLevel: "",
      knownHBPositive: false,
      knownHCVPositive: false,
      knownHIVPositive: false,
      currentAcuteIllness: false,
      allergyVaccineComponent: false,
      immunosuppressed: false,
      pregnancy: false,
      ageUnder16: false,
      previousSevereReaction: false,
    },
    treatment: {
      vaccine: "engerix-20",
      schedule: "",
      doseNumber: "",
      injectionSite: "",
      batchNumber: "",
      expiryDate: "",
      observationPeriodCompleted: false,
    },
    counselling: {
      counsellingProvided: false,
      nextDoseDate: "",
      serologyRecommended: false,
      postExposureProtocolExplained: false,
      counsellingNotes: "",
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

  const evaluateAssessmentAlerts = useCallback(() => {
    const newAlerts: ClinicalAlert[] = [];

    if (state.assessment.knownHBPositive) {
      newAlerts.push({ severity: "stop", code: "HBV_POSITIVE", message: "Known Hepatitis B Positive", detail: "Do not vaccinate. Refer for specialist care." });
    }

    if (state.assessment.allergyVaccineComponent) {
      newAlerts.push({ severity: "stop", code: "VACCINE_ALLERGY", message: "Vaccine Component Allergy", detail: "Contraindicated. Do not administer vaccine." });
    }

    if (state.assessment.previousSevereReaction) {
      newAlerts.push({ severity: "stop", code: "SEVERE_REACTION", message: "Previous Severe Reaction", detail: "Absolute contraindication. Do not vaccinate." });
    }

    if (state.assessment.knownHCVPositive || state.assessment.knownHIVPositive) {
      newAlerts.push({ severity: "caution", code: "HCV_HIV", message: "HCV/HIV Co-infection", detail: "May need specialist vaccination schedule. Consider higher dose or additional doses." });
    }

    if (state.assessment.currentAcuteIllness) {
      newAlerts.push({ severity: "caution", code: "ACUTE_ILLNESS", message: "Acute Illness with Fever", detail: "Defer vaccination until illness resolved." });
    }

    if (state.assessment.immunosuppressed) {
      newAlerts.push({ severity: "caution", code: "IMMUNOSUPPRESSED", message: "Immunosuppressed Patient", detail: "May need higher dose or additional doses. Consult specialist." });
    }

    if (state.assessment.pregnancy) {
      newAlerts.push({ severity: "caution", code: "PREGNANCY", message: "Pregnancy", detail: "Vaccine can be given if high occupational risk. Consider timing and specialist advice." });
    }

    if (state.assessment.ageUnder16) {
      newAlerts.push({ severity: "caution", code: "AGE_UNDER_16", message: "Age Under 16 Years", detail: "Occupational health PGDs typically for workers. Verify employer requirement." });
    }

    if (state.assessment.previousVaccination === "full-course" && state.assessment.antiHBsLevelChecked && state.assessment.antiHBsLevel === "above-10") {
      newAlerts.push({ severity: "caution", code: "GOOD_IMMUNITY", message: "Good Immunity Documented", detail: "Anti-HBs >10 IU/L. Revaccination may not be necessary. Consider workplace exposure risk." });
    }

    setAlerts(newAlerts);
  }, [state.assessment]);

  const canProceedAssessment = useCallback(() => {
    return !!(
      state.assessment.reasonForVaccination &&
      state.assessment.previousVaccination !== "" &&
      state.assessment.knownHBPositive === false &&
      state.assessment.allergyVaccineComponent === false &&
      state.assessment.previousSevereReaction === false
    );
  }, [state.assessment]);

  const canProceedTreatment = useCallback(() => {
    return !!(
      state.treatment.schedule &&
      state.treatment.doseNumber &&
      state.treatment.injectionSite &&
      state.treatment.batchNumber &&
      state.treatment.expiryDate &&
      state.treatment.observationPeriodCompleted
    );
  }, [state.treatment]);

  const canProceedCounselling = useCallback(() => {
    return !!(
      state.counselling.counsellingProvided &&
      state.counselling.nextDoseDate &&
      state.counselling.counsellingNotes
    );
  }, [state.counselling]);

  const canProceedSummary = useCallback(() => {
    return !!(
      state.summary.pharmacistName &&
      state.summary.pharmacistGPhC &&
      state.summary.pharmacyName
    );
  }, [state.summary]);

  const validateAndMove = useCallback((nextStep: number) => {
    if (nextStep === 3) {
      evaluateAssessmentAlerts();
      const hasStopAlerts = alerts.some(a => a.severity === "stop");
      if (hasStopAlerts) {
        return;
      }
    }
    setCurrentStep(nextStep);
  }, [alerts, evaluateAssessmentAlerts]);

  const handleNext = useCallback(() => {
    let canMove = true;
    let nextStep = currentStep + 1;

    if (currentStep === 2) canMove = canProceedAssessment();
    if (currentStep === 3) canMove = canProceedTreatment();
    if (currentStep === 4) canMove = canProceedCounselling();
    if (currentStep === 5) canMove = canProceedSummary();

    if (canMove) validateAndMove(nextStep);
  }, [currentStep, canProceedAssessment, canProceedTreatment, canProceedCounselling, canProceedSummary, validateAndMove]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setAlerts([]);
  }, []);

  const getValidationError = useCallback(() => {
    if (currentStep === 2 && !canProceedAssessment()) return "Please complete all assessment fields";
    if (currentStep === 3 && !canProceedTreatment()) return "Please complete all treatment fields";
    if (currentStep === 4 && !canProceedCounselling()) return "Please complete counselling information";
    if (currentStep === 5 && !canProceedSummary()) return "Please complete pharmacist details";
    return null;
  }, [currentStep, canProceedAssessment, canProceedTreatment, canProceedCounselling, canProceedSummary]);

  const hasStopAlerts = alerts.some(a => a.severity === "stop");

  const getNextDoseDatePlus30Days = () => {
    const today = new Date();
    const nextDose = new Date(today.setDate(today.getDate() + 30));
    return nextDose.toISOString().split("T")[0];
  };

  const calculateNextDose = () => {
    const today = new Date();
    if (state.treatment.schedule === "standard" && state.treatment.doseNumber === "1st") {
      const nextDose = new Date(today.setMonth(today.getMonth() + 1));
      return nextDose.toISOString().split("T")[0];
    } else if (state.treatment.schedule === "standard" && state.treatment.doseNumber === "2nd") {
      const nextDose = new Date(today.setMonth(today.getMonth() + 5));
      return nextDose.toISOString().split("T")[0];
    } else if (state.treatment.schedule === "accelerated" && state.treatment.doseNumber === "1st") {
      const nextDose = new Date(today.setMonth(today.getMonth() + 1));
      return nextDose.toISOString().split("T")[0];
    } else if (state.treatment.schedule === "accelerated" && state.treatment.doseNumber === "2nd") {
      const nextDose = new Date(today.setMonth(today.getMonth() + 1));
      return nextDose.toISOString().split("T")[0];
    } else if (state.treatment.schedule === "accelerated" && state.treatment.doseNumber === "3rd") {
      const nextDose = new Date(today.setMonth(today.getMonth() + 11));
      return nextDose.toISOString().split("T")[0];
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={7} />
      <StepWrapper
        title={["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Complete"][currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={currentStep === 2 ? !hasStopAlerts : true}
        validationError={getValidationError()}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <SelectInput
              label="Reason for Vaccination"
              value={state.assessment.reasonForVaccination}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, reasonForVaccination: v } }))}
              options={[
                { value: "", label: "Select reason" },
                { value: "healthcare-worker", label: "Healthcare Worker" },
                { value: "care-worker", label: "Care Worker" },
                { value: "first-responder", label: "First Responder" },
                { value: "laboratory-worker", label: "Laboratory Worker" },
                { value: "mortuary-embalming", label: "Mortuary/Embalming Worker" },
                { value: "sex-worker", label: "Sex Worker" },
                { value: "ivdu", label: "Intravenous Drug User" },
                { value: "household-contact", label: "Household Contact of HBV Carrier" },
                { value: "other-occupational", label: "Other Occupational Exposure" },
              ]}
              required
            />

            <SelectInput
              label="Previous Hepatitis B Vaccination"
              value={state.assessment.previousVaccination}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, previousVaccination: v } }))}
              options={[
                { value: "", label: "Select status" },
                { value: "none", label: "None" },
                { value: "partial-course", label: "Partial Course (1-2 doses)" },
                { value: "full-course", label: "Full Course (3 doses)" },
              ]}
              required
            />

            {state.assessment.previousVaccination === "full-course" && (
              <>
                <Checkbox
                  label="Anti-HBs level checked"
                  checked={state.assessment.antiHBsLevelChecked}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, antiHBsLevelChecked: v } }))}
                />

                {state.assessment.antiHBsLevelChecked && (
                  <SelectInput
                    label="Anti-HBs Level"
                    value={state.assessment.antiHBsLevel}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, antiHBsLevel: v } }))}
                    options={[
                      { value: "", label: "Select level" },
                      { value: "above-10", label: ">10 IU/L (Good Immunity)" },
                      { value: "below-10", label: "<10 IU/L (Non-immune)" },
                    ]}
                  />
                )}
              </>
            )}

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-3">Contraindications</p>
              <div className="space-y-2">
                <Checkbox
                  label="Known Hepatitis B Positive"
                  checked={state.assessment.knownHBPositive}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, knownHBPositive: v } }))}
                />
                <Checkbox
                  label="Known allergy to vaccine components (yeast, aluminium)"
                  checked={state.assessment.allergyVaccineComponent}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, allergyVaccineComponent: v } }))}
                />
                <Checkbox
                  label="Previous severe reaction to Hepatitis B vaccine"
                  checked={state.assessment.previousSevereReaction}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, previousSevereReaction: v } }))}
                />
              </div>
            </div>

            <Checkbox
              label="Known Hepatitis C Positive"
              checked={state.assessment.knownHCVPositive}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, knownHCVPositive: v } }))}
            />

            <Checkbox
              label="Known HIV Positive"
              checked={state.assessment.knownHIVPositive}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, knownHIVPositive: v } }))}
            />

            <Checkbox
              label="Current acute illness with fever"
              checked={state.assessment.currentAcuteIllness}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, currentAcuteIllness: v } }))}
            />

            <Checkbox
              label="Immunosuppressed"
              checked={state.assessment.immunosuppressed}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, immunosuppressed: v } }))}
            />

            <Checkbox
              label="Pregnant"
              checked={state.assessment.pregnancy}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnancy: v } }))}
            />

            <Checkbox
              label="Age <16 years"
              checked={state.assessment.ageUnder16}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, ageUnder16: v } }))}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Vaccine Information</p>
              <p className="text-xs text-blue-800 mt-1">Engerix-B 20mcg/1ml (adult dose)</p>
            </div>

            <SelectInput
              label="Vaccination Schedule"
              value={state.treatment.schedule}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, schedule: v } }))}
              options={[
                { value: "", label: "Select schedule" },
                { value: "standard", label: "Standard (0, 1, 6 months)" },
                { value: "accelerated", label: "Accelerated (0, 1, 2, 12 months)" },
              ]}
              required
            />

            <SelectInput
              label="Dose Number Being Given Today"
              value={state.treatment.doseNumber}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, doseNumber: v } }))}
              options={[
                { value: "", label: "Select dose" },
                { value: "1st", label: "1st Dose" },
                { value: "2nd", label: "2nd Dose" },
                { value: "3rd", label: "3rd Dose" },
                { value: "booster", label: "Booster" },
              ]}
              required
            />

            <SelectInput
              label="Injection Site"
              value={state.treatment.injectionSite}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, injectionSite: v } }))}
              options={[
                { value: "", label: "Select site" },
                { value: "left-deltoid", label: "Left Deltoid" },
                { value: "right-deltoid", label: "Right Deltoid" },
              ]}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Batch Number"
                value={state.treatment.batchNumber}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, batchNumber: v } }))}
                required
              />
              <TextInput
                label="Expiry Date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, expiryDate: v } }))}
                required
              />
            </div>

            <Checkbox
              label="15-minute post-vaccination observation period completed"
              checked={state.treatment.observationPeriodCompleted}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, observationPeriodCompleted: v } }))}
              required
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-3">Common Side Effects</p>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Injection site soreness</li>
                <li>Mild fever</li>
                <li>Fatigue (24-48 hours)</li>
                <li>Advised to report any severe reaction (anaphylaxis signs)</li>
              </ul>
            </div>

            <Checkbox
              label="Counselling provided to patient"
              checked={state.counselling.counsellingProvided}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingProvided: v } }))}
              required
            />

            <TextInput
              label="Next Dose Date"
              type="date"
              value={state.counselling.nextDoseDate}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, nextDoseDate: v } }))}
              placeholder={calculateNextDose()}
              required
            />

            <Checkbox
              label="Anti-HBs serology recommended 1-2 months after completing course"
              checked={state.counselling.serologyRecommended}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, serologyRecommended: v } }))}
            />

            <Checkbox
              label="Post-exposure protocol explained (if occupational exposure before course complete)"
              checked={state.counselling.postExposureProtocolExplained}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, postExposureProtocolExplained: v } }))}
            />

            <TextArea
              label="Counselling Notes"
              value={state.counselling.counsellingNotes}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingNotes: v } }))}
              rows={3}
              placeholder="Include protection minimum titre (10 mIU/ml) and any additional advice"
              required
            />
          </div>
        )}

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
            <TextArea
              label="Clinical Notes"
              value={state.summary.clinicalNotes}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))}
              rows={3}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Hepatitis B Occupational Vaccination Complete</p>
            <p className="text-xs text-green-700 mt-1">Click Print Consultation Record to generate and save the PDF report.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
