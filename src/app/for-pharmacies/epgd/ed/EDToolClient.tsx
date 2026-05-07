"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  EDConsultationState,
  EDAction,
  PatientDetails,
  ConsentDetails,
  PresentingComplaint,
  MedicalHistory,
  CurrentMedications,
  Observations,
  RedFlagsChecklist,
  MedicineSelection,
  CounsellingChecklist,
  ConsultationSummary,
} from "./lib/ed-types";
import { STEP_LABELS } from "./lib/ed-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/ed-clinical-logic";
import { validateStep, calculateAge } from "./lib/ed-validation";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { EDProgressBar } from "./components/EDProgressBar";
import { EDStepWrapper } from "./components/EDStepWrapper";
import { EDAlertBanner } from "./components/EDAlertBanner";
import { EDMedicineSelector } from "./components/EDMedicineSelector";
import { EDCounsellingChecklist } from "./components/EDCounsellingChecklist";
import { EDSummaryReport } from "./components/EDSummaryReport";

// ─── Initial state ───

const initialState: EDConsultationState = {
  currentStep: 0,
  patient: {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    age: null,
    genderConfirmed: false,
    gpName: "",
    gpPractice: "",
    nhsNumber: "",
    address: "",
    phone: "",
    email: "",
  },
  consent: {
    informedConsentGiven: false,
    idVerified: false,
    idType: "",
    patientAwarePrivateService: false,
  },
  complaint: {
    description: "",
    onsetType: "",
    duration: "",
    severity: "",
    previousTreatment: false,
    previousTreatmentDetails: "",
    psychosexualFactors: false,
    psychosexualDetails: "",
  },
  medicalHistory: {
    cardiovascularDisease: false,
    cardiovascularDetails: "",
    diabetes: false,
    diabetesType: "",
    neurologicalConditions: false,
    neurologicalDetails: "",
    hepaticImpairment: "none",
    renalImpairment: "none",
    sickleCell: false,
    bleedingDisorders: false,
    penileDeformity: false,
    penileDeformityDetails: "",
    priapismHistory: false,
    retinalDisorders: false,
    unstableAngina: false,
    severeHeartFailure: false,
    uncontrolledArrhythmias: false,
    recentMIOrStroke: false,
    naionHistory: false,
    hypogonadism: false,
    psychiatricIssues: false,
    psychiatricDetails: "",
  },
  medications: {
    takesNitrates: false,
    nitrateDetails: "",
    takesRiociguat: false,
    takesAlphaBlockers: false,
    alphaBlockerStable: false,
    alphaBlockerDetails: "",
    takesCYP3A4Inhibitors: false,
    cyp3a4Details: "",
    otherMedications: "",
    allergies: "",
  },
  observations: {
    systolicBP: null,
    diastolicBP: null,
    heartRate: null,
    bpTakenToday: false,
  },
  redFlags: {
    pelvicPerinealTrauma: false,
    penileAnatomicalAbnormality: false,
    previousPDE5Failure: false,
    previousPDE5Details: "",
  },
  medicineSelection: {
    medicine: "",
    dosingRegimen: "",
    dose: "",
    quantity: 4,
    pharmacistOverride: false,
    overrideReason: "",
  },
  counselling: {
    sexualStimulationRequired: false,
    timingAdvice: false,
    foodInteractions: false,
    priapismWarning: false,
    visionHearingWarning: false,
    noSTIProtection: false,
    grapefruitAvoidance: false,
    alcoholModeration: false,
    sideEffectsExplained: false,
    reviewAdvice: false,
    gpReviewRecommended: false,
  },
  summary: {
    pharmacistName: "",
    pharmacistGPhC: "",
    pharmacyName: "",
    pharmacyAddress: "",
    consultationDate: new Date().toISOString().split("T")[0],
    consultationTime: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    clinicalNotes: "",
  },
  alerts: [],
  doseRecommendation: null,
  canProceed: true,
  isComplete: false,
};

// ─── Reducer ───

function edReducer(
  state: EDConsultationState,
  action: EDAction
): EDConsultationState {
  let newState = { ...state };

  switch (action.type) {
    case "UPDATE_PATIENT": {
      const patient = { ...state.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        patient.age = calculateAge(action.value as string);
      }
      newState = { ...state, patient };
      break;
    }
    case "UPDATE_CONSENT":
      newState = {
        ...state,
        consent: { ...state.consent, [action.field]: action.value },
      };
      break;
    case "UPDATE_COMPLAINT":
      newState = {
        ...state,
        complaint: { ...state.complaint, [action.field]: action.value },
      };
      break;
    case "UPDATE_MEDICAL_HISTORY":
      newState = {
        ...state,
        medicalHistory: {
          ...state.medicalHistory,
          [action.field]: action.value,
        },
      };
      break;
    case "UPDATE_MEDICATIONS":
      newState = {
        ...state,
        medications: { ...state.medications, [action.field]: action.value },
      };
      break;
    case "UPDATE_OBSERVATIONS":
      newState = {
        ...state,
        observations: { ...state.observations, [action.field]: action.value },
      };
      break;
    case "UPDATE_RED_FLAGS":
      newState = {
        ...state,
        redFlags: { ...state.redFlags, [action.field]: action.value },
      };
      break;
    case "UPDATE_MEDICINE_SELECTION":
      newState = {
        ...state,
        medicineSelection: {
          ...state.medicineSelection,
          [action.field]: action.value,
        },
      };
      break;
    case "UPDATE_COUNSELLING":
      newState = {
        ...state,
        counselling: { ...state.counselling, [action.field]: action.value },
      };
      break;
    case "UPDATE_SUMMARY":
      newState = {
        ...state,
        summary: { ...state.summary, [action.field]: action.value },
      };
      break;
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(state.currentStep + 1, 9) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }

  // Recompute alerts and dose recommendation after every data change
  const alerts = getAllAlerts(newState);
  const doseRecommendation = calculateDoseRecommendation(newState);
  return { ...newState, alerts, doseRecommendation };
}

// ─── Form field helpers ───

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
      />
      <div>
        <span className="text-sm text-navy-900">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
  unit,
  className = "",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
            onChange(v !== null && isNaN(v) ? null : v);
          }}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Main component ───

export function EDToolClient() {
  const [state, dispatch] = useReducer(edReducer, initialState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const currentAlerts = useMemo(() => getAllAlerts(state), [state]);
  const stopsExist = useMemo(() => hasHardStops(state), [state]);
  const doseRec = useMemo(
    () => calculateDoseRecommendation(state),
    [state]
  );

  const handleNext = useCallback(() => {
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
    dispatch({ type: "NEXT_STEP" });
  }, [state]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "PREV_STEP" });
  }, []);

  const handleStepClick = useCallback(
    (step: number) => {
      if (completedSteps.has(step) || step <= state.currentStep) {
        setValidationError(null);
        dispatch({ type: "SET_STEP", step });
      }
    },
    [completedSteps, state.currentStep]
  );

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

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
    setValidationError(null);
  }, []);

  // Helper to update nested fields
  const updatePatient = (field: keyof PatientDetails, value: PatientDetails[keyof PatientDetails]) =>
    dispatch({ type: "UPDATE_PATIENT", field, value });
  const updateConsent = (field: keyof ConsentDetails, value: ConsentDetails[keyof ConsentDetails]) =>
    dispatch({ type: "UPDATE_CONSENT", field, value });
  const updateComplaint = (field: keyof PresentingComplaint, value: PresentingComplaint[keyof PresentingComplaint]) =>
    dispatch({ type: "UPDATE_COMPLAINT", field, value });
  const updateHistory = (field: keyof MedicalHistory, value: MedicalHistory[keyof MedicalHistory]) =>
    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field, value });
  const updateMeds = (field: keyof CurrentMedications, value: CurrentMedications[keyof CurrentMedications]) =>
    dispatch({ type: "UPDATE_MEDICATIONS", field, value });
  const updateObs = (field: keyof Observations, value: Observations[keyof Observations]) =>
    dispatch({ type: "UPDATE_OBSERVATIONS", field, value });
  const updateRedFlags = (field: keyof RedFlagsChecklist, value: RedFlagsChecklist[keyof RedFlagsChecklist]) =>
    dispatch({ type: "UPDATE_RED_FLAGS", field, value });
  const updateMedicine = (field: keyof MedicineSelection, value: MedicineSelection[keyof MedicineSelection]) =>
    dispatch({ type: "UPDATE_MEDICINE_SELECTION", field, value });
  const updateCounselling = (field: keyof CounsellingChecklist, value: boolean) =>
    dispatch({ type: "UPDATE_COUNSELLING", field, value });
  const updateSummary = (field: keyof ConsultationSummary, value: string) =>
    dispatch({ type: "UPDATE_SUMMARY", field, value });

  // Determine which alerts to show for current step
  const stepAlerts = useMemo(() => {
    // Show medication-related stops on step 4 (medications)
    if (state.currentStep === 4) {
      return currentAlerts.filter((a) =>
        ["NITRATE", "RIOCIGUAT"].includes(a.code)
      );
    }
    // Show BP stops on step 5 (observations)
    if (state.currentStep === 5) {
      return currentAlerts.filter((a) =>
        ["HYPOTENSION", "HYPERTENSION"].includes(a.code)
      );
    }
    // Show medical history stops/cautions on step 3
    if (state.currentStep === 3) {
      return currentAlerts.filter((a) =>
        [
          "RECENT_MI_STROKE", "SEVERE_HEPATIC", "NAION", "UNSTABLE_ANGINA",
          "SEVERE_HF", "ARRHYTHMIAS", "RETINAL", "HEPATIC_MILD_MOD",
          "RENAL_SEVERE", "RENAL_MODERATE", "PENILE_DEFORMITY",
          "PRIAPISM_RISK", "BLEEDING", "CVD_RISK",
        ].includes(a.code)
      );
    }
    // Show all on step 6 (red flags review)
    if (state.currentStep === 6) {
      return currentAlerts;
    }
    // Show cautions on medicine selection
    if (state.currentStep === 7) {
      return currentAlerts.filter(
        (a) => a.severity === "caution" || a.severity === "stop"
      );
    }
    return [];
  }, [state.currentStep, currentAlerts]);

  const isBlocked =
    stopsExist &&
    state.currentStep >= 3 &&
    state.currentStep < 9;

  // ─── Step renderers ───

  function renderStep() {
    switch (state.currentStep) {
      case 0:
        return renderPatientDetails();
      case 1:
        return renderConsent();
      case 2:
        return renderComplaint();
      case 3:
        return renderMedicalHistory();
      case 4:
        return renderMedications();
      case 5:
        return renderObservations();
      case 6:
        return renderRedFlags();
      case 7:
        return renderMedicineSelection();
      case 8:
        return renderCounselling();
      case 9:
        return renderSummary();
      default:
        return null;
    }
  }

  // ── Step 0: Patient Details ──
  function renderPatientDetails() {
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput
            label="First name"
            value={state.patient.firstName}
            onChange={(v) => updatePatient("firstName", v)}
            required
            placeholder="John"
          />
          <TextInput
            label="Last name"
            value={state.patient.lastName}
            onChange={(v) => updatePatient("lastName", v)}
            required
            placeholder="Smith"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Date of birth <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={state.patient.dateOfBirth}
              onChange={(e) => updatePatient("dateOfBirth", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Age (auto-calculated)
            </label>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
              {state.patient.age !== null ? (
                <>
                  {state.patient.age} years
                  {state.patient.age < 18 && (
                    <span className="ml-2 text-red-500 text-xs font-medium">
                      Must be 18+
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Enter DOB above</span>
              )}
            </div>
          </div>
        </div>
        <Checkbox
          label="Patient confirmed as male"
          checked={state.patient.genderConfirmed}
          onChange={(v) => updatePatient("genderConfirmed", v)}
          description="This PGD is for adult males only"
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput
            label="GP name"
            value={state.patient.gpName}
            onChange={(v) => updatePatient("gpName", v)}
            placeholder="Dr. Jane Doe"
          />
          <TextInput
            label="GP practice"
            value={state.patient.gpPractice}
            onChange={(v) => updatePatient("gpPractice", v)}
            placeholder="High Street Medical Centre"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput
            label="NHS number (optional)"
            value={state.patient.nhsNumber}
            onChange={(v) => updatePatient("nhsNumber", v)}
            placeholder="123 456 7890"
          />
          <TextInput
            label="Phone (optional)"
            value={state.patient.phone}
            onChange={(v) => updatePatient("phone", v)}
            type="tel"
            placeholder="07..."
          />
        </div>
        <TextInput
          label="Address (optional)"
          value={state.patient.address}
          onChange={(v) => updatePatient("address", v)}
          placeholder="123 High Street, London"
        />
      </div>
    );
  }

  // ── Step 1: Consent ──
  function renderConsent() {
    return (
      <div className="space-y-4">
        <Checkbox
          label="Informed consent obtained"
          checked={state.consent.informedConsentGiven}
          onChange={(v) => updateConsent("informedConsentGiven", v)}
          description="The patient has been informed about the treatment, including benefits, risks, and alternatives, and has given verbal or written consent."
        />
        <Checkbox
          label="ID verification completed"
          checked={state.consent.idVerified}
          onChange={(v) => updateConsent("idVerified", v)}
          description="The patient's identity has been confirmed."
        />
        {state.consent.idVerified && (
          <SelectInput
            label="ID type"
            value={state.consent.idType}
            onChange={(v) => updateConsent("idType", v)}
            options={[
              { value: "Driving licence", label: "Driving licence" },
              { value: "Passport", label: "Passport" },
              { value: "Known to pharmacist", label: "Known to pharmacist" },
              { value: "Other", label: "Other" },
            ]}
          />
        )}
        <Checkbox
          label="Patient aware this is a private service"
          checked={state.consent.patientAwarePrivateService}
          onChange={(v) => updateConsent("patientAwarePrivateService", v)}
          description="The patient understands there will be a consultation fee and the medication is not available on NHS prescription through this service."
        />
      </div>
    );
  }

  // ── Step 2: Presenting Complaint ──
  function renderComplaint() {
    return (
      <div className="space-y-4">
        <SelectInput
          label="Onset type"
          value={state.complaint.onsetType}
          onChange={(v) => updateComplaint("onsetType", v)}
          required
          options={[
            {
              value: "gradual",
              label: "Gradual onset (suggests organic cause)",
            },
            {
              value: "sudden",
              label: "Sudden onset (suggests psychogenic cause)",
            },
          ]}
        />
        <SelectInput
          label="Duration of ED"
          value={state.complaint.duration}
          onChange={(v) => updateComplaint("duration", v)}
          required
          options={[
            { value: "< 3 months", label: "Less than 3 months" },
            { value: "3-6 months", label: "3-6 months" },
            { value: "6-12 months", label: "6-12 months" },
            { value: "> 12 months", label: "More than 12 months" },
          ]}
        />
        <SelectInput
          label="Severity"
          value={state.complaint.severity}
          onChange={(v) => updateComplaint("severity", v)}
          required
          options={[
            {
              value: "mild",
              label:
                "Mild — occasional difficulty achieving/maintaining erection",
            },
            {
              value: "moderate",
              label: "Moderate — frequent difficulty",
            },
            {
              value: "severe",
              label: "Severe — unable to achieve/maintain erection",
            },
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Additional notes (optional)
          </label>
          <textarea
            value={state.complaint.description}
            onChange={(e) => updateComplaint("description", e.target.value)}
            rows={3}
            placeholder="Any additional details about the presenting complaint..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
          />
        </div>
        <Checkbox
          label="Previous ED treatment attempted"
          checked={state.complaint.previousTreatment}
          onChange={(v) => updateComplaint("previousTreatment", v)}
        />
        {state.complaint.previousTreatment && (
          <TextInput
            label="Previous treatment details"
            value={state.complaint.previousTreatmentDetails}
            onChange={(v) =>
              updateComplaint("previousTreatmentDetails", v)
            }
            placeholder="e.g. Sildenafil 50mg, tried 4 times, partially effective"
          />
        )}
        <Checkbox
          label="Psychosexual factors present"
          checked={state.complaint.psychosexualFactors}
          onChange={(v) => updateComplaint("psychosexualFactors", v)}
          description="Stress, relationship issues, performance anxiety, depression"
        />
      </div>
    );
  }

  // ── Step 3: Medical History ──
  function renderMedicalHistory() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 mb-2">
          Check all that apply. Conditions marked with a red dot are potential
          exclusion criteria.
        </p>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
            Cardiovascular
          </h4>
          <Checkbox
            label="Cardiovascular disease"
            checked={state.medicalHistory.cardiovascularDisease}
            onChange={(v) => updateHistory("cardiovascularDisease", v)}
            description="Hypertension, ischaemic heart disease, peripheral vascular disease"
          />
          {state.medicalHistory.cardiovascularDisease && (
            <TextInput
              label="CV details"
              value={state.medicalHistory.cardiovascularDetails}
              onChange={(v) => updateHistory("cardiovascularDetails", v)}
              placeholder="Specify conditions..."
              className="ml-7"
            />
          )}
          <Checkbox
            label="🔴 Unstable angina"
            checked={state.medicalHistory.unstableAngina}
            onChange={(v) => updateHistory("unstableAngina", v)}
          />
          <Checkbox
            label="🔴 Severe heart failure (NYHA class IV)"
            checked={state.medicalHistory.severeHeartFailure}
            onChange={(v) => updateHistory("severeHeartFailure", v)}
          />
          <Checkbox
            label="🔴 Uncontrolled arrhythmias"
            checked={state.medicalHistory.uncontrolledArrhythmias}
            onChange={(v) => updateHistory("uncontrolledArrhythmias", v)}
          />
          <Checkbox
            label="🔴 Recent MI or stroke (within 6 months)"
            checked={state.medicalHistory.recentMIOrStroke}
            onChange={(v) => updateHistory("recentMIOrStroke", v)}
          />

          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
            Metabolic & Organ Function
          </h4>
          <Checkbox
            label="Diabetes"
            checked={state.medicalHistory.diabetes}
            onChange={(v) => updateHistory("diabetes", v)}
          />
          {state.medicalHistory.diabetes && (
            <SelectInput
              label="Diabetes type"
              value={state.medicalHistory.diabetesType}
              onChange={(v) => updateHistory("diabetesType", v)}
              options={[
                { value: "Type 1", label: "Type 1" },
                { value: "Type 2", label: "Type 2" },
              ]}
            />
          )}
          <div>
            <SelectInput
              label="Hepatic impairment"
              value={state.medicalHistory.hepaticImpairment}
              onChange={(v) => updateHistory("hepaticImpairment", v)}
              options={[
                { value: "none", label: "None" },
                {
                  value: "mild-moderate",
                  label: "Mild-moderate (Child-Pugh A or B)",
                },
                {
                  value: "severe",
                  label: "🔴 Severe (Child-Pugh C) — EXCLUSION",
                },
              ]}
            />
          </div>
          <div>
            <SelectInput
              label="Renal impairment"
              value={state.medicalHistory.renalImpairment}
              onChange={(v) => updateHistory("renalImpairment", v)}
              options={[
                { value: "none", label: "None" },
                {
                  value: "moderate",
                  label: "Moderate (eGFR 30-50 mL/min)",
                },
                {
                  value: "severe",
                  label: "Severe (eGFR <30 mL/min)",
                },
              ]}
            />
          </div>

          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
            Other Conditions
          </h4>
          <Checkbox
            label="Neurological conditions"
            checked={state.medicalHistory.neurologicalConditions}
            onChange={(v) => updateHistory("neurologicalConditions", v)}
            description="Multiple sclerosis, spinal cord injury, Parkinson's"
          />
          <Checkbox
            label="🔴 Hereditary degenerative retinal disorders"
            checked={state.medicalHistory.retinalDisorders}
            onChange={(v) => updateHistory("retinalDisorders", v)}
            description="e.g. retinitis pigmentosa — EXCLUSION"
          />
          <Checkbox
            label="🔴 Previous NAION"
            checked={state.medicalHistory.naionHistory}
            onChange={(v) => updateHistory("naionHistory", v)}
            description="Non-arteritic anterior ischaemic optic neuropathy — EXCLUSION"
          />
          <Checkbox
            label="Sickle cell disease / blood disorders"
            checked={state.medicalHistory.sickleCell}
            onChange={(v) => updateHistory("sickleCell", v)}
            description="Conditions predisposing to priapism"
          />
          <Checkbox
            label="Bleeding disorders / active peptic ulceration"
            checked={state.medicalHistory.bleedingDisorders}
            onChange={(v) => updateHistory("bleedingDisorders", v)}
          />
          <Checkbox
            label="Penile deformity"
            checked={state.medicalHistory.penileDeformity}
            onChange={(v) => updateHistory("penileDeformity", v)}
            description="Peyronie's disease, angulation, cavernosal fibrosis"
          />
          <Checkbox
            label="History of priapism"
            checked={state.medicalHistory.priapismHistory}
            onChange={(v) => updateHistory("priapismHistory", v)}
          />
          <Checkbox
            label="Suspected hypogonadism"
            checked={state.medicalHistory.hypogonadism}
            onChange={(v) => updateHistory("hypogonadism", v)}
          />
          <Checkbox
            label="Psychiatric/psychosexual issues"
            checked={state.medicalHistory.psychiatricIssues}
            onChange={(v) => updateHistory("psychiatricIssues", v)}
          />
        </div>
      </div>
    );
  }

  // ── Step 4: Current Medications ──
  function renderMedications() {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">
            Critical medication checks
          </p>
          <Checkbox
            label="🔴 Patient takes NITRATES (GTN, isosorbide mononitrate/dinitrate, amyl nitrite)"
            checked={state.medications.takesNitrates}
            onChange={(v) => updateMeds("takesNitrates", v)}
            description="ABSOLUTE CONTRAINDICATION — risk of severe, potentially fatal hypotension"
          />
          {state.medications.takesNitrates && (
            <TextInput
              label="Nitrate details"
              value={state.medications.nitrateDetails}
              onChange={(v) => updateMeds("nitrateDetails", v)}
              placeholder="Which nitrate(s)?"
              className="ml-7"
            />
          )}
          <Checkbox
            label="🔴 Patient takes RIOCIGUAT (guanylate cyclase stimulator)"
            checked={state.medications.takesRiociguat}
            onChange={(v) => updateMeds("takesRiociguat", v)}
            description="CONTRAINDICATION with PDE5 inhibitors"
          />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
            Other relevant medications
          </h4>
          <Checkbox
            label="Alpha-blockers (e.g. tamsulosin, doxazosin)"
            checked={state.medications.takesAlphaBlockers}
            onChange={(v) => updateMeds("takesAlphaBlockers", v)}
            description="Dose adjustment required — start sildenafil at 25mg"
          />
          {state.medications.takesAlphaBlockers && (
            <div className="ml-7 space-y-2">
              <Checkbox
                label="Patient stable on alpha-blocker"
                checked={state.medications.alphaBlockerStable}
                onChange={(v) => updateMeds("alphaBlockerStable", v)}
                description="Must be stable on alpha-blocker therapy before initiating PDE5 inhibitor"
              />
              <TextInput
                label="Alpha-blocker details"
                value={state.medications.alphaBlockerDetails}
                onChange={(v) => updateMeds("alphaBlockerDetails", v)}
                placeholder="Which alpha-blocker, dose, duration?"
              />
            </div>
          )}
          <Checkbox
            label="CYP3A4 inhibitors (e.g. erythromycin, ketoconazole, itraconazole, ritonavir)"
            checked={state.medications.takesCYP3A4Inhibitors}
            onChange={(v) => updateMeds("takesCYP3A4Inhibitors", v)}
            description="Dose adjustment required"
          />
          {state.medications.takesCYP3A4Inhibitors && (
            <TextInput
              label="CYP3A4 inhibitor details"
              value={state.medications.cyp3a4Details}
              onChange={(v) => updateMeds("cyp3a4Details", v)}
              placeholder="Which inhibitor(s)?"
              className="ml-7"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Other current medications
          </label>
          <textarea
            value={state.medications.otherMedications}
            onChange={(e) =>
              updateMeds("otherMedications", e.target.value)
            }
            rows={3}
            placeholder="List all other medications the patient is currently taking..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
          />
        </div>

        <TextInput
          label="Known allergies"
          value={state.medications.allergies}
          onChange={(v) => updateMeds("allergies", v)}
          placeholder="NKDA (no known drug allergies) or list allergies"
        />
      </div>
    );
  }

  // ── Step 5: Observations ──
  function renderObservations() {
    return (
      <div className="space-y-4">
        <Checkbox
          label="Blood pressure taken today"
          checked={state.observations.bpTakenToday}
          onChange={(v) => updateObs("bpTakenToday", v)}
          description="A current blood pressure reading is required before supply"
        />

        {state.observations.bpTakenToday && (
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberInput
              label="Systolic BP"
              value={state.observations.systolicBP}
              onChange={(v) => updateObs("systolicBP", v)}
              min={60}
              max={250}
              placeholder="120"
              unit="mmHg"
            />
            <NumberInput
              label="Diastolic BP"
              value={state.observations.diastolicBP}
              onChange={(v) => updateObs("diastolicBP", v)}
              min={30}
              max={160}
              placeholder="80"
              unit="mmHg"
            />
          </div>
        )}

        {/* BP visual feedback */}
        {state.observations.bpTakenToday &&
          state.observations.systolicBP !== null &&
          state.observations.diastolicBP !== null && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                state.observations.systolicBP < 90 ||
                state.observations.diastolicBP < 50
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : state.observations.systolicBP > 170 ||
                      state.observations.diastolicBP > 100
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : state.observations.systolicBP > 140 ||
                        state.observations.diastolicBP > 90
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <span className="font-medium">
                {state.observations.systolicBP}/{state.observations.diastolicBP}{" "}
                mmHg
              </span>
              {" — "}
              {state.observations.systolicBP < 90 ||
              state.observations.diastolicBP < 50
                ? "Hypotension — CANNOT supply"
                : state.observations.systolicBP > 170 ||
                    state.observations.diastolicBP > 100
                  ? "Uncontrolled hypertension — CANNOT supply"
                  : state.observations.systolicBP > 140 ||
                      state.observations.diastolicBP > 90
                    ? "Elevated — proceed with caution"
                    : "Within normal range"}
            </div>
          )}

        <NumberInput
          label="Heart rate (optional)"
          value={state.observations.heartRate}
          onChange={(v) => updateObs("heartRate", v)}
          min={30}
          max={220}
          placeholder="72"
          unit="bpm"
        />
      </div>
    );
  }

  // ── Step 6: Red Flags ──
  function renderRedFlags() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 mb-2">
          Review the following red flags. If any are present, consider whether
          referral to GP or specialist is appropriate before (or instead of)
          supplying medication.
        </p>

        <Checkbox
          label="Pelvic or perineal trauma"
          checked={state.redFlags.pelvicPerinealTrauma}
          onChange={(v) => updateRedFlags("pelvicPerinealTrauma", v)}
        />
        <Checkbox
          label="Penile anatomical abnormality"
          checked={state.redFlags.penileAnatomicalAbnormality}
          onChange={(v) =>
            updateRedFlags("penileAnatomicalAbnormality", v)
          }
          description="e.g. Peyronie's disease"
        />
        <Checkbox
          label="Failed 2 different PDE5 inhibitors at maximum dose"
          checked={state.redFlags.previousPDE5Failure}
          onChange={(v) => updateRedFlags("previousPDE5Failure", v)}
          description="After adequate trial of 6-8 attempts each"
        />
        {state.redFlags.previousPDE5Failure && (
          <TextInput
            label="Previous PDE5 failure details"
            value={state.redFlags.previousPDE5Details}
            onChange={(v) => updateRedFlags("previousPDE5Details", v)}
            placeholder="Which medicines tried, doses, number of attempts"
            className="ml-7"
          />
        )}

        {/* Summary of all alerts at this point */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-navy-900 mb-3">
            Full clinical review
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Based on all information entered so far, the following clinical
            alerts have been raised:
          </p>
        </div>
      </div>
    );
  }

  // ── Step 7: Medicine Selection ──
  function renderMedicineSelection() {
    if (stopsExist) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold">
            Cannot proceed to medicine selection — exclusion criteria have been
            identified.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please review the clinical alerts above. The patient should be
            referred to their GP.
          </p>
        </div>
      );
    }

    return (
      <EDMedicineSelector
        selection={state.medicineSelection}
        recommendation={doseRec}
        onChange={updateMedicine}
      />
    );
  }

  // ── Step 8: Counselling ──
  function renderCounselling() {
    const medicineName =
      state.medicineSelection.medicine === "sildenafil"
        ? `Sildenafil ${state.medicineSelection.dose}`
        : `Tadalafil ${state.medicineSelection.dose} (${state.medicineSelection.dosingRegimen})`;

    return (
      <EDCounsellingChecklist
        checklist={state.counselling}
        medicineName={medicineName}
        onChange={updateCounselling}
      />
    );
  }

  // ── Step 9: Summary ──
  function renderSummary() {
    return (
      <div className="space-y-6">
        {/* Pharmacist details input */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-semibold text-navy-900">
            Pharmacist details
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) => updateSummary("pharmacistName", v)}
              required
              placeholder="Your full name"
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) => updateSummary("pharmacistGPhC", v)}
              required
              placeholder="e.g. 2012345"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) => updateSummary("pharmacyName", v)}
              placeholder="Your pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) => updateSummary("pharmacyAddress", v)}
              placeholder="Address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Additional clinical notes (optional)
            </label>
            <textarea
              value={state.summary.clinicalNotes}
              onChange={(e) =>
                updateSummary("clinicalNotes", e.target.value)
              }
              rows={3}
              placeholder="Any additional notes for the consultation record..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
            />
          </div>
        </div>

        {/* Printable summary */}
        <div className="border border-gray-200 rounded-lg p-6 print:border-none print:p-0">
          <EDSummaryReport state={{ ...state, alerts: currentAlerts }} />
        </div>
      </div>
    );
  }

  // ─── Main render ───

  return (
    <div className="space-y-4">
      <EDProgressBar
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={stepAlerts.some((a) => a.severity === "stop")}
      />

      {/* Alerts for current step */}
      {stepAlerts.length > 0 && <EDAlertBanner alerts={stepAlerts} />}

      <EDStepWrapper
        title={STEP_LABELS[state.currentStep]}
        description={
          state.currentStep === 0
            ? "Enter the patient's demographic information"
            : state.currentStep === 1
              ? "Confirm consent and identity verification"
              : state.currentStep === 2
                ? "Document the presenting complaint"
                : state.currentStep === 3
                  ? "Review the patient's medical history for contraindications and cautions"
                  : state.currentStep === 4
                    ? "Check current medications for interactions and contraindications"
                    : state.currentStep === 5
                      ? "Record blood pressure and heart rate"
                      : state.currentStep === 6
                        ? "Review red flags and determine if referral is needed"
                        : state.currentStep === 7
                          ? "Select the appropriate medicine, dose, and quantity"
                          : state.currentStep === 8
                            ? "Confirm all counselling points have been discussed"
                            : "Review the consultation record and print"
        }
        currentStep={state.currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={true}
        validationError={validationError}
        isBlocked={isBlocked}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStep()}
      </EDStepWrapper>
    </div>
  );
}
