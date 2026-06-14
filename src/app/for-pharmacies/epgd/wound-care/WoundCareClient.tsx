"use client";

import { useState, useCallback, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
interface WoundState {
  patient: { firstName: string; lastName: string; dateOfBirth: string; age: number | null; gpName: string; gpPractice: string; gpAddress: string; gpPhone: string; gpEmail: string; gpOdsCode: string; nhsNumber: string; address: string; phone: string; email: string };
  consent: { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean };
  assessment: {
    woundType: string;
    woundLocation: string;
    woundSize: string;
    woundDepth: string;
    timeOfInjury: string;
    activeBleedingControlled: boolean;
    signsOfInfection: string[];
    redTrackingLines: boolean;
    foreignBody: boolean;
    tendonNerveDamage: boolean;
    tetanusStatus: string;
    immunosuppressed: boolean;
    diabetic: boolean;
    takingAnticoagulants: boolean;
  };
  treatment: {
    irrigationMethod: string;
    closureMethod: string;
    dressingType: string;
    topicalAntiseptic: boolean;
    suppliedItemBatch: string;
    suppliedItemExpiry: string;
    tetanusReferralGenerated: boolean;
  };
  counselling: {
    counsellingProvided: boolean;
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

export default function WoundCareClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);

  const [state, setState] = useState<WoundState>({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      woundType: "",
      woundLocation: "",
      woundSize: "",
      woundDepth: "",
      timeOfInjury: "",
      activeBleedingControlled: true,
      signsOfInfection: [],
      redTrackingLines: false,
      foreignBody: false,
      tendonNerveDamage: false,
      tetanusStatus: "",
      immunosuppressed: false,
      diabetic: false,
      takingAnticoagulants: false,
    },
    treatment: {
      irrigationMethod: "",
      closureMethod: "",
      dressingType: "",
      topicalAntiseptic: false,
      suppliedItemBatch: "",
      suppliedItemExpiry: "",
      tetanusReferralGenerated: false,
    },
    counselling: {
      counsellingProvided: false,
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


  const evaluateAssessmentAlerts = useCallback(() => {
    const newAlerts: ClinicalAlert[] = [];

    if (!state.assessment.activeBleedingControlled) {
      newAlerts.push({ severity: "stop", code: "ACTIVE_BLEEDING", message: "Active Bleeding Not Controlled", detail: "Emergency referral required. Patient needs urgent attention." });
    }

    if (state.assessment.redTrackingLines) {
      newAlerts.push({ severity: "stop", code: "RED_TRACKING", message: "Red Tracking Lines Detected", detail: "Possible sepsis. Urgent referral required." });
    }

    if (state.assessment.foreignBody) {
      newAlerts.push({ severity: "stop", code: "FOREIGN_BODY", message: "Foreign Body in Wound", detail: "Refer for wound exploration." });
    }

    if (state.assessment.tendonNerveDamage) {
      newAlerts.push({ severity: "stop", code: "TENDON_NERVE", message: "Tendon/Nerve Damage Suspected", detail: "Refer for specialist assessment." });
    }

    if (state.assessment.woundDepth === "full-thickness" || state.assessment.woundDepth === "deep") {
      newAlerts.push({ severity: "red-flag", code: "DEEP_WOUND", message: "Deep Wound Detected", detail: "May require suturing. Consider specialist referral." });
    }

    if (state.assessment.woundLocation === "face") {
      newAlerts.push({ severity: "caution", code: "FACIAL_WOUND", message: "Facial Wound", detail: "Consider referral for cosmetic outcome." });
    }

    if (state.assessment.woundType === "bite-animal" || state.assessment.woundType === "bite-human") {
      newAlerts.push({ severity: "red-flag", code: "BITE_WOUND", message: "Bite Wound Detected", detail: "High infection risk. Antibiotic consideration required." });
    }

    const hoursOld = state.assessment.timeOfInjury ? Math.floor((Date.now() - new Date(state.assessment.timeOfInjury).getTime()) / (1000 * 60 * 60)) : 0;
    if (hoursOld > 6) {
      newAlerts.push({ severity: "caution", code: "WOUND_AGE", message: "Wound Age Over 6 Hours", detail: "Increased infection risk. Closure may not be appropriate." });
    }

    if (state.assessment.signsOfInfection.length > 0) {
      newAlerts.push({ severity: "red-flag", code: "INFECTION_SIGNS", message: "Signs of Infection Present", detail: `Detected: ${state.assessment.signsOfInfection.join(", ")}. May need antibiotic treatment.` });
    }

    if (state.assessment.tetanusStatus === "not-up-to-date" && (state.assessment.woundType === "puncture-wound" || state.assessment.woundType === "bite-animal" || state.assessment.woundType === "bite-human")) {
      newAlerts.push({ severity: "red-flag", code: "TETANUS", message: "Tetanus Booster Required", detail: "Dirty wound with outdated tetanus status. Arrange tetanus prophylaxis." });
    }

    if (state.assessment.immunosuppressed || state.assessment.diabetic) {
      newAlerts.push({ severity: "caution", code: "INFECTION_RISK", message: "Increased Infection Risk", detail: "Patient is immunosuppressed or diabetic. Higher risk of complications." });
    }

    if (state.assessment.takingAnticoagulants) {
      newAlerts.push({ severity: "caution", code: "ANTICOAGULANT", message: "Anticoagulant Use", detail: "Increased bleeding risk. Monitor wound carefully." });
    }

    setAlerts(newAlerts);
  }, [state.assessment]);

  const canProceedAssessment = useCallback(() => {
    return !!(
      state.assessment.woundType &&
      state.assessment.woundLocation &&
      state.assessment.woundSize &&
      state.assessment.woundDepth &&
      state.assessment.timeOfInjury &&
      state.assessment.tetanusStatus !== ""
    );
  }, [state.assessment]);

  const canProceedTreatment = useCallback(() => {
    return !!(
      state.treatment.irrigationMethod &&
      state.treatment.closureMethod &&
      state.treatment.dressingType &&
      state.treatment.suppliedItemBatch &&
      state.treatment.suppliedItemExpiry
    );
  }, [state.treatment]);

  const canProceedCounselling = useCallback(() => {
    return !!(state.counselling.counsellingProvided && state.counselling.counsellingNotes);
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
    if (currentStep === 4 && !canProceedCounselling()) return "Please confirm counselling was provided";
    if (currentStep === 5 && !canProceedSummary()) return "Please complete pharmacist details";
    return null;
  }, [currentStep, canProceedAssessment, canProceedTreatment, canProceedCounselling, canProceedSummary]);

  const hasStopAlerts = alerts.some(a => a.severity === "stop");


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
      <StepWrapper
        title={["Patient Details", "Consent", "Wound Assessment", "Treatment Plan", "Counselling", "Summary", "Consultation Complete"][currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={currentStep === 3 ? !hasStopAlerts : true}
        validationError={getValidationError()}
       getConsultationData={getConsultationData}>
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
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

            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Wound Type"
                value={state.assessment.woundType}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, woundType: v } }))}
                options={[
                  { value: "", label: "Select wound type" },
                  { value: "laceration-cut", label: "Laceration/Cut" },
                  { value: "abrasion-graze", label: "Abrasion/Graze" },
                  { value: "puncture-wound", label: "Puncture Wound" },
                  { value: "bite-animal", label: "Bite Wound (Animal)" },
                  { value: "bite-human", label: "Bite Wound (Human)" },
                  { value: "burn", label: "Burn" },
                ]}
                required
              />
              <SelectInput
                label="Wound Location"
                value={state.assessment.woundLocation}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, woundLocation: v } }))}
                options={[
                  { value: "", label: "Select location" },
                  { value: "hand-finger", label: "Hand/Finger" },
                  { value: "arm", label: "Arm" },
                  { value: "leg", label: "Leg" },
                  { value: "face", label: "Face" },
                  { value: "torso", label: "Torso" },
                  { value: "foot", label: "Foot" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Wound Size"
                value={state.assessment.woundSize}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, woundSize: v } }))}
                options={[
                  { value: "", label: "Select size" },
                  { value: "less-2cm", label: "<2cm" },
                  { value: "2-5cm", label: "2-5cm" },
                  { value: "greater-5cm", label: ">5cm" },
                ]}
                required
              />
              <SelectInput
                label="Wound Depth"
                value={state.assessment.woundDepth}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, woundDepth: v } }))}
                options={[
                  { value: "", label: "Select depth" },
                  { value: "superficial", label: "Superficial" },
                  { value: "partial-thickness", label: "Partial Thickness" },
                  { value: "full-thickness", label: "Full Thickness/Deep" },
                ]}
                required
              />
            </div>

            <TextInput
              label="Time of Injury"
              type="datetime-local"
              value={state.assessment.timeOfInjury}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, timeOfInjury: v } }))}
              required
            />

            <Checkbox
              label="Active bleeding controlled by pressure"
              checked={state.assessment.activeBleedingControlled}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, activeBleedingControlled: v } }))}
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-3">Signs of Infection (select all that apply)</p>
              <div className="space-y-2">
                {["Redness spreading", "Pus present", "Swelling", "Warmth at wound site", "Red tracking lines"].map(sign => (
                  <Checkbox
                    key={sign}
                    label={sign}
                    checked={state.assessment.signsOfInfection.includes(sign)}
                    onChange={checked => {
                      if (checked) {
                        setState(prev => ({ ...prev, assessment: { ...prev.assessment, signsOfInfection: [...prev.assessment.signsOfInfection, sign] } }));
                      } else {
                        setState(prev => ({ ...prev, assessment: { ...prev.assessment, signsOfInfection: prev.assessment.signsOfInfection.filter(s => s !== sign) } }));
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <Checkbox
              label="Red tracking lines from wound"
              checked={state.assessment.redTrackingLines}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, redTrackingLines: v } }))}
            />

            <Checkbox
              label="Foreign body visible in wound"
              checked={state.assessment.foreignBody}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, foreignBody: v } }))}
            />

            <Checkbox
              label="Tendon/nerve damage suspected (loss of movement/sensation)"
              checked={state.assessment.tendonNerveDamage}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, tendonNerveDamage: v } }))}
            />

            <SelectInput
              label="Tetanus Status"
              value={state.assessment.tetanusStatus}
              onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, tetanusStatus: v } }))}
              options={[
                { value: "", label: "Select tetanus status" },
                { value: "up-to-date", label: "Up to date" },
                { value: "not-up-to-date", label: "Not up to date" },
                { value: "unknown", label: "Unknown" },
              ]}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Checkbox
                label="Immunosuppressed"
                checked={state.assessment.immunosuppressed}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, immunosuppressed: v } }))}
              />
              <Checkbox
                label="Diabetic"
                checked={state.assessment.diabetic}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, diabetic: v } }))}
              />
              <Checkbox
                label="Taking anticoagulants"
                checked={state.assessment.takingAnticoagulants}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, takingAnticoagulants: v } }))}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <SelectInput
              label="Wound Irrigation Method"
              value={state.treatment.irrigationMethod}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, irrigationMethod: v } }))}
              options={[
                { value: "", label: "Select method" },
                { value: "sterile-saline", label: "Sterile Saline" },
                { value: "clean-water", label: "Clean Water" },
                { value: "chlorhexidine", label: "Chlorhexidine Solution" },
              ]}
              required
            />

            <SelectInput
              label="Wound Closure Method"
              value={state.treatment.closureMethod}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, closureMethod: v } }))}
              options={[
                { value: "", label: "Select method" },
                { value: "steri-strips", label: "Steri-Strips/Adhesive Closure Strips" },
                { value: "glue", label: "Tissue Adhesive" },
                { value: "none", label: "No Closure (Healing by Secondary Intention)" },
              ]}
              required
            />

            <SelectInput
              label="Dressing Type"
              value={state.treatment.dressingType}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, dressingType: v } }))}
              options={[
                { value: "", label: "Select dressing" },
                { value: "adhesive", label: "Adhesive Dressing" },
                { value: "non-adhesive", label: "Non-Adhesive Pad with Tape" },
                { value: "hydrocolloid", label: "Hydrocolloid Dressing" },
              ]}
              required
            />

            <Checkbox
              label="Topical antiseptic applied"
              checked={state.treatment.topicalAntiseptic}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, topicalAntiseptic: v } }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Supplied Item Batch Number"
                value={state.treatment.suppliedItemBatch}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, suppliedItemBatch: v } }))}
                required
              />
              <TextInput
                label="Supplied Item Expiry Date"
                type="date"
                value={state.treatment.suppliedItemExpiry}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, suppliedItemExpiry: v } }))}
                required
              />
            </div>

            <Checkbox
              label="Tetanus referral letter generated"
              checked={state.treatment.tetanusReferralGenerated}
              onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, tetanusReferralGenerated: v } }))}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-3">Patient Counselling Provided</p>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Keep wound clean and dry for 24-48 hours</li>
                <li>Change dressing if wet or dirty</li>
                <li>Return if signs of infection develop (increasing pain, redness, swelling, pus, fever)</li>
                {state.treatment.closureMethod === "steri-strips" && <li>Steri-strips: do not pull off, let fall naturally (5-7 days)</li>}
                {state.treatment.tetanusReferralGenerated && <li>Tetanus booster arranged as needed</li>}
                <li>Return urgently if red lines spread from wound</li>
              </ul>
            </div>

            <Checkbox
              label="Counselling provided to patient"
              checked={state.counselling.counsellingProvided}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingProvided: v } }))}
              required
            />

            <TextArea
              label="Additional counselling notes"
              value={state.counselling.counsellingNotes}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingNotes: v } }))}
              rows={3}
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
            <p className="text-sm font-semibold text-green-900">Wound Care Consultation Complete</p>
            <p className="text-xs text-green-700 mt-1">Click Print Consultation Record to generate and save the PDF report.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
