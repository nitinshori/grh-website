"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { calculateAge, validatePatientStep, validateConsentStep } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

/**
 * Hepatitis B (Engerix B / HBvaxPRO) ePGD, aligned to the signed document
 * "Patient Group Direction for the administration of Engerix B for vaccination
 * against Hepatitis B" (two arms: Engerix B and HBvaxPRO), PGD version 004,
 * issued 11 September 2026. Individuals aged 16 years and over; under 16
 * refers. Standard (0, 1, 6 months) and accelerated (0, 1, 2, 12 months)
 * schedules only.
 */
const PGD_VERSION = "Hepatitis B (Engerix B / HBvaxPRO) PGD v004, issued 11 September 2026";

type Vaccine = "engerix-20" | "hbvaxpro-10";
const VACCINE_LABEL: Record<Vaccine, string> = {
  "engerix-20": "Engerix B 20 micrograms/1 mL, 1 mL per dose (16 years and over)",
  "hbvaxpro-10": "HBvaxPRO 10 micrograms/1 mL, 1 mL per dose (16 years and over)",
};

interface HepBState {
  patient: { firstName: string; lastName: string; dateOfBirth: string; age: number | null; gpName: string; gpPractice: string; gpAddress: string; gpPhone: string; gpEmail: string; gpOdsCode: string; nhsNumber: string; address: string; phone: string; email: string };
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
    bleedingDisorderOrAnticoagulant: boolean;
    eligibleUnderGuidance: boolean;
  };
  treatment: {
    vaccine: Vaccine;
    schedule: string;
    doseNumber: string;
    injectionSite: string;
    batchNumber: string;
    expiryDate: string;
    adrenalineAvailable: boolean;
    observationPeriodCompleted: boolean;
  };
  counselling: {
    counsellingProvided: boolean;
    pilSupplied: boolean;
    followUpAdviceGiven: boolean;
    nextDoseDate: string;
    courseComplete: boolean;
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

  const [state, setState] = useState<HepBState>({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
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
      bleedingDisorderOrAnticoagulant: false,
      eligibleUnderGuidance: false,
    },
    treatment: {
      vaccine: "engerix-20",
      schedule: "",
      doseNumber: "",
      injectionSite: "",
      batchNumber: "",
      expiryDate: "",
      adrenalineAvailable: false,
      observationPeriodCompleted: false,
    },
    counselling: {
      counsellingProvided: false,
      pilSupplied: false,
      followUpAdviceGiven: false,
      nextDoseDate: "",
      courseComplete: false,
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


  // Auto-fill pharmacist details from logged-in user. Refires when fields

  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.

  const __pharmProfile = usePharmacistProfile();

  useEffect(() => {

    if (!__pharmProfile) return;

    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;

    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));

  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);


  const isUnder16 = state.patient.age !== null && state.patient.age < 16;

  // Alerts are derived from state so a stop can never be evaluated against a
  // stale copy (the previous implementation checked the old alerts array on
  // the same tick it requested a re-evaluation).
  const alerts = useMemo<ClinicalAlert[]>(() => {
    const newAlerts: ClinicalAlert[] = [];

    if (isUnder16) {
      newAlerts.push({ severity: "stop", code: "AGE_UNDER_16", message: "Aged under 16 years", detail: "Children under 16 are not vaccinated under this PGD. Refer to the GP or an appropriate immunisation service." });
    }

    if (state.assessment.knownHBPositive) {
      newAlerts.push({ severity: "stop", code: "HBV_POSITIVE", message: "Known Hepatitis B Positive", detail: "Do not vaccinate. Refer for specialist care." });
    }

    if (state.assessment.allergyVaccineComponent) {
      newAlerts.push({ severity: "stop", code: "VACCINE_ALLERGY", message: "Known hypersensitivity to the active substance or any excipient", detail: "Excluded. Do not administer. Advise on alternatives and inform or refer to the GP." });
    }

    if (state.assessment.previousSevereReaction) {
      newAlerts.push({ severity: "stop", code: "SEVERE_REACTION", message: "Previous allergic reaction to any hepatitis B vaccine", detail: "Excluded. Do not vaccinate. Inform or refer to the GP." });
    }

    if (state.assessment.currentAcuteIllness) {
      newAlerts.push({ severity: "stop", code: "ACUTE_ILLNESS", message: "Acute severe febrile illness", detail: "Excluded: postpone until recovered. Advise when to return." });
    }

    if (state.assessment.knownHCVPositive || state.assessment.knownHIVPositive) {
      newAlerts.push({ severity: "caution", code: "HCV_HIV", message: "HCV/HIV Co-infection", detail: "May need specialist vaccination schedule. Consider higher dose or additional doses." });
    }

    if (state.assessment.immunosuppressed) {
      newAlerts.push({ severity: "caution", code: "IMMUNOSUPPRESSED", message: "Immunosuppressed Patient", detail: "May need higher dose or additional doses. Consult specialist." });
    }

    if (state.assessment.pregnancy) {
      newAlerts.push({ severity: "caution", code: "PREGNANCY", message: "Pregnancy", detail: "Vaccine can be given if high occupational risk. Consider timing and specialist advice." });
    }

    if (state.assessment.bleedingDisorderOrAnticoagulant) {
      newAlerts.push({ severity: "caution", code: "BLEEDING", message: "Bleeding disorder or anticoagulant therapy", detail: "Use with caution: fine needle, firm pressure without rubbing for at least 2 minutes, advise on the risk of haematoma." });
    }

    if (state.assessment.previousVaccination === "full-course" && state.assessment.antiHBsLevelChecked && state.assessment.antiHBsLevel === "above-10") {
      newAlerts.push({ severity: "caution", code: "GOOD_IMMUNITY", message: "Good Immunity Documented", detail: "Anti-HBs >10 IU/L. Revaccination may not be necessary. Consider workplace exposure risk." });
    }

    return newAlerts;
  }, [state.assessment, isUnder16]);

  const hasStopAlerts = alerts.some(a => a.severity === "stop");

  const assessmentError = (() => {
    if (!state.assessment.reasonForVaccination) return "Select the reason for vaccination";
    if (state.assessment.previousVaccination === "") return "Record previous hepatitis B vaccination";
    if (!state.assessment.eligibleUnderGuidance) return "Confirm the individual is eligible under national immunisation or occupational health guidance";
    const stop = alerts.find(a => a.severity === "stop");
    if (stop) return `Exclusion present: ${stop.message}. ${stop.detail}`;
    return null;
  })();

  const treatmentError = (() => {
    if (!state.treatment.adrenalineAvailable) return "Confirm adrenaline 1 in 1,000 is immediately available in the room, in date, with a telephone and a written anaphylaxis protocol";
    if (!state.treatment.vaccine) return "Select the vaccine";
    if (!state.treatment.schedule) return "Select the schedule";
    if (!state.treatment.doseNumber) return "Record the dose number";
    if (!state.treatment.injectionSite) return "Record the injection site";
    if (!state.treatment.batchNumber) return "Record the batch number";
    if (!state.treatment.expiryDate) return "Record the expiry date";
    if (!state.treatment.observationPeriodCompleted) return "Confirm the 15 minute post-vaccination observation was completed";
    return null;
  })();

  const counsellingError = (() => {
    if (!state.counselling.pilSupplied) return "Confirm the patient information leaflet was supplied";
    if (!state.counselling.followUpAdviceGiven) return "Confirm the follow-up advice was given";
    if (!state.counselling.counsellingProvided) return "Confirm counselling was provided";
    if (!state.counselling.courseComplete && !state.counselling.nextDoseDate) return "Record the date the next dose is due, or mark the course complete";
    if (!state.counselling.counsellingNotes) return "Record counselling notes";
    return null;
  })();

  const summaryError = (() => {
    if (!state.summary.pharmacistName) return "Pharmacist name is required";
    if (!state.summary.pharmacistGPhC) return "GPhC registration number is required";
    if (!state.summary.pharmacyName) return "Pharmacy name is required";
    return null;
  })();

  const stepErrors: (string | null)[] = [
    validatePatientStep(state.patient, { minAge: 16 }),
    validateConsentStep(state.consent),
    assessmentError,
    treatmentError,
    counsellingError,
    summaryError,
    null,
  ];
  const validationError = stepErrors[currentStep] ?? null;
  const canProceed = validationError === null;

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [canProceed]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

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
      clinicalData: {
        ...state,
        alerts,
        pgdVersion: PGD_VERSION,
        vaccineLabel: VACCINE_LABEL[state.treatment.vaccine],
        dose: "1 mL",
        route: "Intramuscular",
      } as unknown as Record<string, unknown>,
      outcome: hasStopAlerts ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, alerts, hasStopAlerts]);

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={7} />
      <StepWrapper
        title={["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Complete"][currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hasStopAlerts && currentStep === 2}
       getConsultationData={getConsultationData}>
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}) } }))}
            requireAdult={false}
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
                { value: "travel", label: "Travel to a high-prevalence country" },
                { value: "other-occupational", label: "Other Occupational Exposure" },
                { value: "other-lifestyle", label: "Other Lifestyle Risk" },
              ]}
              required
            />

            <Checkbox
              label="Eligible under national immunisation (Green Book chapter 18) or occupational health guidance (inclusion criterion)"
              checked={state.assessment.eligibleUnderGuidance}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, eligibleUnderGuidance: v } }))}
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
                  label="Known hypersensitivity to the active substance or any excipient (including yeast)"
                  checked={state.assessment.allergyVaccineComponent}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, allergyVaccineComponent: v } }))}
                />
                <Checkbox
                  label="Previous allergic reaction to any hepatitis B vaccine"
                  checked={state.assessment.previousSevereReaction}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, previousSevereReaction: v } }))}
                />
                <Checkbox
                  label="Acute severe febrile illness (postpone until recovered)"
                  checked={state.assessment.currentAcuteIllness}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, currentAcuteIllness: v } }))}
                />
                {isUnder16 && (
                  <p className="text-xs text-red-800">Patient is under 16 (from date of birth): not vaccinated under this PGD, refer.</p>
                )}
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
              label="Bleeding disorder or on anticoagulants (caution: fine needle, firm pressure 2 minutes)"
              checked={state.assessment.bleedingDisorderOrAnticoagulant}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, bleedingDisorderOrAnticoagulant: v } }))}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <Checkbox
              label="Adrenaline (epinephrine) 1 in 1,000 injection immediately available in the room, in date, with a telephone and a written anaphylaxis protocol (Resuscitation Council UK)"
              checked={state.treatment.adrenalineAvailable}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, adrenalineAvailable: v } }))}
              required
            />

            <SelectInput
              label="Vaccine"
              value={state.treatment.vaccine}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, vaccine: v as Vaccine } }))}
              options={[
                { value: "engerix-20", label: VACCINE_LABEL["engerix-20"] },
                { value: "hbvaxpro-10", label: VACCINE_LABEL["hbvaxpro-10"] },
              ]}
              required
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Vaccine Information</p>
              <p className="text-xs text-blue-800 mt-1">{VACCINE_LABEL[state.treatment.vaccine]}. Intramuscular injection, usually in the deltoid muscle. Standard schedule 0, 1 and 6 months; accelerated schedule 0, 1, 2 and 12 months. Pre-dialysis and dialysis patients (40 microgram presentation) are not covered by this PGD; refer.</p>
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
              label="Counselling provided to patient (common side effects; complete the full vaccination schedule)"
              checked={state.counselling.counsellingProvided}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingProvided: v } }))}
              required
            />

            <Checkbox
              label="Patient information leaflet (PIL) supplied"
              checked={state.counselling.pilSupplied}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, pilSupplied: v } }))}
              required
            />

            <Checkbox
              label="Follow-up advice given: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell; report suspected adverse reactions via the Yellow Card scheme"
              checked={state.counselling.followUpAdviceGiven}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, followUpAdviceGiven: v } }))}
              required
            />

            <Checkbox
              label="Course complete with this dose (no further dose due)"
              checked={state.counselling.courseComplete}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, courseComplete: v } }))}
            />

            {!state.counselling.courseComplete && (
              <TextInput
                label="Next Dose Date"
                type="date"
                value={state.counselling.nextDoseDate}
                onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, nextDoseDate: v } }))}
                placeholder={calculateNextDose()}
                required
              />
            )}

            <Checkbox
              label="Anti-HBs serology recommended 1 to 4 months after the final dose where high-risk (e.g. healthcare workers, immunocompromised); anti-HBs 10 mIU/mL or above is protective"
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
            <p className="text-xs text-gray-500">Administered under {PGD_VERSION}.</p>
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
