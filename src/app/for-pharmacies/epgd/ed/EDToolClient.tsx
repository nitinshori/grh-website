"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
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
  getArmAvailability,
  getDoseCaps,
  tadalafil72HourApplies,
} from "./lib/ed-clinical-logic";
import { validateStep, calculateAge } from "./lib/ed-validation";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { EDProgressBar } from "./components/EDProgressBar";
import { EDStepWrapper } from "./components/EDStepWrapper";
import { EDAlertBanner } from "./components/EDAlertBanner";
import { EDMedicineSelector } from "./components/EDMedicineSelector";
import { EDCounsellingChecklist } from "./components/EDCounsellingChecklist";
import { EDSummaryReport } from "./components/EDSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
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
    gpAddress: "",
    gpPhone: "",
gpEmail: "",
    gpOdsCode: "",
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
    previousPDE5Inhibitor: "",
    previousPDE5Dose: "",
    previousPDE5Tolerated: false,
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
    hepaticImpairment: "",
    renalImpairment: "",
    sickleCell: false,
    bleedingDisorders: false,
    penileDeformity: false,
    penileDeformityDetails: "",
    priapismHistory: false,
    retinalDisorders: false,
    unstableAngina: false,
    severeHeartFailure: false,
    uncontrolledArrhythmias: false,
    structuralHeartDisease: false,
    recentMIOrStroke: false,
    lastCvReviewDate: "",
    naionHistory: false,
    hypogonadism: false,
    psychiatricIssues: false,
    psychiatricDetails: "",
  },
  medications: {
    takesNitrates: false,
    nitrateDetails: "",
    takesNicorandil: false,
    usesPoppers: false,
    poppersQuestionAsked: false,
    takesRiociguat: false,
    takesRitonavirOrCobicistat: false,
    takesDoxazosin: false,
    takesOtherPDE5Inhibitor: false,
    takesAlphaBlockers: false,
    alphaBlockerStable: false,
    alphaBlockerStabilityAnswered: false,
    alphaBlockerDetails: "",
    takesCYP3A4Inhibitors: false,
    cyp3a4Details: "",
    otherMedications: "",
    allergies: "",
    hypersensitivityPDE5: false,
  },
  observations: {
    systolicBP: null,
    diastolicBP: null,
    heartRate: null,
    bpTakenToday: false,
    exerciseTolerance: "" as "" | "yes" | "no" | "unknown",
    exerciseToleranceNotes: "",
    symptomsOnExertionOrSex: false,
    symptomsQuestionAsked: false,
  },
  redFlags: {
    suddenOnsetSecondaryCause: false,
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
    brand: "",
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
    maxOneDoseIn24Hours: false,
    nitrateWarningGiven: false,
    chestPainAdvice: false,
    grapefruitAvoidance: false,
    alcoholModeration: false,
    sideEffectsExplained: false,
    reviewAdvice: false,
    pilSupplied: false,
    disposalAdvice: false,
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
    case "UPDATE_COMPLAINT": {
      const complaint = { ...state.complaint, [action.field]: action.value };
      if (action.field === "previousTreatment" && action.value === false) {
        complaint.previousTreatmentDetails = "";
        complaint.previousPDE5Inhibitor = "";
        complaint.previousPDE5Dose = "";
        complaint.previousPDE5Tolerated = false;
      }
      if (action.field === "previousPDE5Inhibitor" && action.value === "none") {
        complaint.previousPDE5Dose = "";
        complaint.previousPDE5Tolerated = false;
      }
      newState = { ...state, complaint };
      break;
    }
    case "UPDATE_MEDICAL_HISTORY":
      newState = {
        ...state,
        medicalHistory: {
          ...state.medicalHistory,
          [action.field]: action.value,
        },
      };
      break;
    case "UPDATE_MEDICATIONS": {
      const medications = { ...state.medications, [action.field]: action.value };
      // Hidden state must not keep gating after its checkbox disappears:
      // clearing the alpha-blocker clears doxazosin, stability and details.
      if (action.field === "takesAlphaBlockers" && action.value === false) {
        medications.takesDoxazosin = false;
        medications.alphaBlockerStable = false;
        medications.alphaBlockerStabilityAnswered = false;
        medications.alphaBlockerDetails = "";
      }
      newState = { ...state, medications };
      break;
    }
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
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
        className="mt-0.5 rounded border-gray-300 text-[color:var(--tenant-primary)] focus:ring-[color:var(--tenant-primary)]"
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
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent bg-white"
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
  required,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  unit?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
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
          className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Main component ───

export function EDToolClient() {
  const [state, dispatch] = useReducer(edReducer, initialState);
  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: __pharmProfile.name } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: __pharmProfile.gphcNumber } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: __pharmProfile.pharmacyName } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: __pharmProfile.pharmacyAddress } as any);
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const currentAlerts = useMemo(() => getAllAlerts(state), [state]);
  const stopsExist = useMemo(() => hasHardStops(state), [state]);
  const doseRec = useMemo(
    () => calculateDoseRecommendation(state),
    [state]
  );
  // The current step's validation, computed live so that Next and Save &
  // Print apply the same rule (the wrapper shows it after an attempt).
  const validationError = useMemo(
    () => validateStep(state.currentStep, state),
    [state]
  );

  const handleNext = useCallback(() => {
    if (validateStep(state.currentStep, state)) return;
    if (hasHardStops(state)) return;
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
    dispatch({ type: "NEXT_STEP" });
  }, [state]);

  const handlePrev = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  // Backwards only. Forward always means Next, where the stops are enforced.
  const handleStepClick = useCallback(
    (step: number) => {
      if (step < state.currentStep) {
        dispatch({ type: "SET_STEP", step });
      }
    },
    [state.currentStep]
  );

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const stops = hasHardStops(state);
    const sel = state.medicineSelection;
    const medicineChosen = !stops && sel.medicine !== "" && sel.dose !== "";
    const medicineName =
      sel.medicine === "sildenafil" ? "Sildenafil" : sel.medicine === "tadalafil" ? "Tadalafil" : "";
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
        ...(state as unknown as Record<string, unknown>),
        alerts: currentAlerts,
      },
      // Never "completed" while a stop exists (adversarial review, 11 Sep 2026)
      outcome: stops ? "not_supplied" : "completed",
      medicine: medicineChosen
        ? {
            name: medicineName,
            medicine: `${medicineName} ${sel.dose} film-coated tablets${sel.brand ? ` (${sel.brand})` : ""}`,
            dose: `${sel.dose} ${sel.dosingRegimen === "daily" ? "once daily" : "on demand, maximum one dose in 24 hours"}`,
            duration: sel.dosingRegimen === "daily" ? "28 days" : "As required",
            quantity: sel.quantity,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
    };
  }, [state, currentAlerts]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
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

  // Determine which alerts to show for current step. Every STOP is shown on
  // every step, so the pharmacist is never blocked without being told why
  // (adversarial review, 11 Sep 2026). Cautions are filtered per step.
  const stepAlerts = useMemo(() => {
    const stops = currentAlerts.filter((a) => a.severity === "stop");
    const others = currentAlerts.filter((a) => a.severity !== "stop");
    let extra: typeof currentAlerts = [];
    if (state.currentStep === 3) {
      extra = others.filter((a) =>
        [
          "HEPATIC_MILD_MOD", "RENAL_SEVERE", "RENAL_MODERATE", "PENILE_DEFORMITY",
          "PRIAPISM_RISK", "BLEEDING", "CVD_RISK", "CV_REVIEW_DATE",
        ].includes(a.code)
      );
    } else if (state.currentStep === 4) {
      extra = others.filter((a) =>
        ["ALPHA_BLOCKER", "RITONAVIR", "DOXAZOSIN", "CYP3A4"].includes(a.code)
      );
    } else if (state.currentStep === 6) {
      extra = others;
    } else if (state.currentStep === 7) {
      extra = others.filter((a) => a.severity === "caution");
    }
    return [...stops, ...extra];
  }, [state.currentStep, currentAlerts]);

  // A stop anywhere blocks Next and Save & Print on every step.
  const isBlocked = stopsExist;

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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
            label="GP practice"
            value={state.patient.gpPractice}
            onChange={(v) => updatePatient("gpPractice", v)}
            required
            placeholder="High Street Medical Centre"
          />
          <TextInput
            label="GP name (optional if the practice is given)"
            value={state.patient.gpName}
            onChange={(v) => updatePatient("gpName", v)}
            placeholder="Dr. Jane Doe"
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
          label="Address"
          value={state.patient.address}
          onChange={(v) => updatePatient("address", v)}
          required
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
              label: "Sudden onset",
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
                "Mild: occasional difficulty achieving/maintaining erection",
            },
            {
              value: "moderate",
              label: "Moderate: frequent difficulty",
            },
            {
              value: "severe",
              label: "Severe: unable to achieve/maintain erection",
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
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent resize-y"
          />
        </div>
        <Checkbox
          label="Previous ED treatment attempted"
          checked={state.complaint.previousTreatment}
          onChange={(v) => updateComplaint("previousTreatment", v)}
        />
        {state.complaint.previousTreatment && (
          <div className="ml-7 space-y-3">
            <TextInput
              label="Previous treatment details"
              value={state.complaint.previousTreatmentDetails}
              onChange={(v) =>
                updateComplaint("previousTreatmentDetails", v)
              }
              placeholder="e.g. Sildenafil 50mg, tried 4 times, partially effective"
            />
            <SelectInput
              label="Previous PDE5 inhibitor"
              value={state.complaint.previousPDE5Inhibitor}
              onChange={(v) =>
                updateComplaint(
                  "previousPDE5Inhibitor",
                  v as PresentingComplaint["previousPDE5Inhibitor"]
                )
              }
              required
              options={[
                { value: "none", label: "None (pump, counselling, herbal or other non-PDE5 treatment)" },
                { value: "sildenafil", label: "Sildenafil" },
                { value: "tadalafil-on-demand", label: "Tadalafil on-demand" },
                { value: "tadalafil-daily", label: "Tadalafil once daily" },
              ]}
            />
            {state.complaint.previousPDE5Inhibitor &&
              state.complaint.previousPDE5Inhibitor !== "none" && (
                <>
                  <TextInput
                    label="Dose previously taken"
                    value={state.complaint.previousPDE5Dose}
                    onChange={(v) => updateComplaint("previousPDE5Dose", v)}
                    required
                    placeholder="e.g. 50mg"
                  />
                  <Checkbox
                    label="That dose was tolerated"
                    checked={state.complaint.previousPDE5Tolerated}
                    onChange={(v) => updateComplaint("previousPDE5Tolerated", v)}
                    description="Only a previous tolerated supply of the same medicine allows a dose above the document's starting dose. Otherwise the starting-dose rules apply."
                  />
                </>
              )}
          </div>
        )}
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Cardiovascular fitness (PGD v008, Appendix 1). Complete for every patient, at every supply, and record the answers.</p>
              <p className="text-xs text-amber-800 mt-1">Sexual activity carries a cardiac workload comparable to brisk walking or climbing two flights of stairs. Not done, failed, or does not know: do not supply.</p>
            </div>
            <SelectInput
              label="Can he walk a mile on the flat in about 20 minutes, or climb two flights of stairs briskly, without chest pain and without stopping for breath?"
              value={state.observations.exerciseTolerance}
              onChange={(v) => updateObs("exerciseTolerance", v as "" | "yes" | "no" | "unknown")}
              options={[
                { value: "yes", label: "Yes, comfortably" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Does not know, never exerts himself that much" },
              ]}
              required
            />
            <TextInput
              label="Patient's answer in his own words"
              value={state.observations.exerciseToleranceNotes}
              onChange={(v) => updateObs("exerciseToleranceNotes", v)}
              placeholder="e.g. walks the dog for half an hour daily, no problems on the stairs"
              required
            />
            <SelectInput
              label="Does he get chest pain, breathlessness or palpitations on exertion, or has he during sex?"
              value={
                !state.observations.symptomsQuestionAsked
                  ? ""
                  : state.observations.symptomsOnExertionOrSex
                    ? "yes"
                    : "no"
              }
              onChange={(v) => {
                updateObs("symptomsQuestionAsked", v !== "");
                updateObs("symptomsOnExertionOrSex", v === "yes");
              }}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes (do not supply: refer)" },
              ]}
              required
            />
          </div>
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
            label="Known cardiovascular disease (record what)"
            checked={state.medicalHistory.cardiovascularDisease}
            onChange={(v) => updateHistory("cardiovascularDisease", v)}
            description="Hypertension, ischaemic heart disease, peripheral vascular disease. Recorded at every supply."
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
          <TextInput
            label="Date of the last cardiovascular review, where known"
            value={state.medicalHistory.lastCvReviewDate}
            onChange={(v) => updateHistory("lastCvReviewDate", v)}
            placeholder="e.g. March 2026, or 'none recent: check recommended'"
          />
          <Checkbox
            label="🔴 Unstable angina, or angina during sexual activity"
            checked={state.medicalHistory.unstableAngina}
            onChange={(v) => updateHistory("unstableAngina", v)}
          />
          <Checkbox
            label="🔴 Heart failure of NYHA class 2 or greater in the last 6 months"
            checked={state.medicalHistory.severeHeartFailure}
            onChange={(v) => updateHistory("severeHeartFailure", v)}
          />
          <Checkbox
            label="🔴 Uncontrolled arrhythmia"
            checked={state.medicalHistory.uncontrolledArrhythmias}
            onChange={(v) => updateHistory("uncontrolledArrhythmias", v)}
          />
          <Checkbox
            label="🔴 Hypertrophic cardiomyopathy, significant aortic stenosis or other moderate to severe valve disease, or a murmur of unknown cause"
            checked={state.medicalHistory.structuralHeartDisease}
            onChange={(v) => updateHistory("structuralHeartDisease", v)}
          />
          <Checkbox
            label="🔴 Recent stroke or myocardial infarction (within the last 6 months)"
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
              label="Hepatic impairment (liver disease)"
              value={state.medicalHistory.hepaticImpairment}
              onChange={(v) => updateHistory("hepaticImpairment", v)}
              required
              options={[
                { value: "none", label: "None" },
                {
                  value: "mild-moderate",
                  label: "Mild-moderate (Child-Pugh A or B)",
                },
                {
                  value: "severe",
                  label: "🔴 Severe (Child-Pugh C), EXCLUSION",
                },
              ]}
            />
          </div>
          <div>
            <SelectInput
              label="Renal impairment (kidney disease)"
              value={state.medicalHistory.renalImpairment}
              onChange={(v) => updateHistory("renalImpairment", v)}
              required
              options={[
                { value: "none", label: "None" },
                {
                  value: "moderate",
                  label: "Moderate (creatinine clearance 30 to 50 mL/min): tadalafil once-daily start at 2.5mg",
                },
                {
                  value: "severe",
                  label: "Severe (creatinine clearance below 30 mL/min): sildenafil start 25mg; tadalafil once-daily excluded, on-demand max 10mg",
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
            description="e.g. retinitis pigmentosa, EXCLUSION"
          />
          <Checkbox
            label="🔴 Previous NAION"
            checked={state.medicalHistory.naionHistory}
            onChange={(v) => updateHistory("naionHistory", v)}
            description="Non-arteritic anterior ischaemic optic neuropathy, EXCLUSION"
          />
          <Checkbox
            label="Sickle cell anaemia, multiple myeloma or leukaemia"
            checked={state.medicalHistory.sickleCell}
            onChange={(v) => updateHistory("sickleCell", v)}
            description="Conditions predisposing to priapism (caution)"
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
            label="🔴 Previous priapism, or an erection lasting more than 4 hours on any previous PDE5 inhibitor"
            checked={state.medicalHistory.priapismHistory}
            onChange={(v) => updateHistory("priapismHistory", v)}
            description="EXCLUSION under PGD v008"
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
            label="🔴 Patient takes a prescribed NITRATE (GTN spray, tablets, patch or ointment; isosorbide mononitrate or dinitrate; sodium nitroprusside)"
            checked={state.medications.takesNitrates}
            onChange={(v) => updateMeds("takesNitrates", v)}
            description="ABSOLUTE CONTRAINDICATION. Risk of severe, potentially fatal hypotension."
          />
          {state.medications.takesNitrates && (
            <TextInput
              label="Nitrate details"
              value={state.medications.nitrateDetails}
              onChange={(v) => updateMeds("nitrateDetails", v)}
              placeholder="Which nitrate, and in what form"
            />
          )}
          <Checkbox
            label="🔴 Patient takes NICORANDIL"
            checked={state.medications.takesNicorandil}
            onChange={(v) => updateMeds("takesNicorandil", v)}
            description="An angina medicine with no 'nitrate' in its name. It is a nitric oxide donor and the interaction is the same."
          />
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-sm font-medium text-navy-900">
              Direct question about poppers (required before supply)
            </p>
            <p className="text-xs text-gray-600">
              Ask, without judgement: &lsquo;Some men use poppers, amyl nitrite, at the same time as these
              tablets. Taken together they can drop your blood pressure to a dangerous level. Do you ever use
              them, or think you might?&rsquo; Poppers are bought, not prescribed, so they never appear on a
              medication list.
            </p>
            <SelectInput
              label="Patient's answer"
              value={
                !state.medications.poppersQuestionAsked
                  ? ""
                  : state.medications.usesPoppers
                    ? "yes"
                    : "no"
              }
              onChange={(v) => {
                updateMeds("poppersQuestionAsked", v !== "");
                updateMeds("usesPoppers", v === "yes");
              }}
              options={[
                { value: "no", label: "No: does not use poppers" },
                { value: "yes", label: "Yes, or thinks he might (amyl, butyl, isobutyl or other alkyl nitrite)" },
              ]}
              required
            />
            {state.medications.usesPoppers && (
              <p className="text-xs text-red-700">
                Absolute exclusion while he is unwilling to stop. Explain that it is the combination that is
                dangerous, not either one alone.
              </p>
            )}
          </div>
          <Checkbox
            label="🔴 Patient takes RIOCIGUAT or any other soluble guanylate cyclase stimulator"
            checked={state.medications.takesRiociguat}
            onChange={(v) => updateMeds("takesRiociguat", v)}
            description="CONTRAINDICATION with PDE5 inhibitors"
          />
          <Checkbox
            label="🔴 Already taking any other PDE5 inhibitor, including one obtained online or from another supplier"
            checked={state.medications.takesOtherPDE5Inhibitor}
            onChange={(v) => updateMeds("takesOtherPDE5Inhibitor", v)}
            description="Do not add a second. EXCLUSION."
          />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
            Other relevant medications
          </h4>
          <Checkbox
            label="Alpha-blockers (e.g. tamsulosin, alfuzosin, doxazosin)"
            checked={state.medications.takesAlphaBlockers}
            onChange={(v) => updateMeds("takesAlphaBlockers", v)}
            description="Must be stable on it first. Sildenafil START AT 25mg; tadalafil on-demand 10mg, once-daily 2.5mg. Record which one and whether he is stable."
          />
          {state.medications.takesAlphaBlockers && (
            <div className="ml-7 space-y-2">
              <TextInput
                label="Alpha-blocker details (which one, dose, how long)"
                value={state.medications.alphaBlockerDetails}
                onChange={(v) => updateMeds("alphaBlockerDetails", v)}
                placeholder="Which alpha-blocker, dose, duration?"
                required
              />
              <SelectInput
                label="Is he stable on the alpha-blocker (same dose, no recent start or change, no dizziness on standing)?"
                value={
                  !state.medications.alphaBlockerStabilityAnswered
                    ? ""
                    : state.medications.alphaBlockerStable
                      ? "yes"
                      : "no"
                }
                onChange={(v) => {
                  updateMeds("alphaBlockerStabilityAnswered", v !== "");
                  updateMeds("alphaBlockerStable", v === "yes");
                }}
                options={[
                  { value: "yes", label: "Yes, stable" },
                  { value: "no", label: "No, recently started or dose changed (do not supply yet)" },
                ]}
                required
              />
              <Checkbox
                label="The alpha-blocker is DOXAZOSIN"
                checked={state.medications.takesDoxazosin}
                onChange={(v) => updateMeds("takesDoxazosin", v)}
                description="Excludes the tadalafil arm (SmPC: combination not recommended). Use the sildenafil arm or refer."
              />
            </div>
          )}
          <Checkbox
            label="CYP3A4 inhibitors (e.g. erythromycin, clarithromycin, ketoconazole, itraconazole)"
            checked={state.medications.takesCYP3A4Inhibitors}
            onChange={(v) => updateMeds("takesCYP3A4Inhibitors", v)}
            description="Sildenafil start at 25mg. Tadalafil on-demand not more than 10mg in any 72 hours. Record the inhibitor and the starting dose chosen."
          />
          <Checkbox
            label="RITONAVIR or COBICISTAT"
            checked={state.medications.takesRitonavirOrCobicistat}
            onChange={(v) => updateMeds("takesRitonavirOrCobicistat", v)}
            description="Excludes the sildenafil arm (dose must not exceed 25mg in 48 hours and cannot be titrated under this PGD). Tadalafil on-demand only, max 10mg in 72 hours."
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
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent resize-y"
          />
        </div>

        <TextInput
          label="Known allergies (type NKDA if none)"
          value={state.medications.allergies}
          onChange={(v) => updateMeds("allergies", v)}
          placeholder="NKDA (no known drug allergies) or list allergies"
          required
        />
        <Checkbox
          label="🔴 Known hypersensitivity to sildenafil, tadalafil or any excipient"
          checked={state.medications.hypersensitivityPDE5}
          onChange={(v) => updateMeds("hypersensitivityPDE5", v)}
          description="EXCLUSION in both arms of PGD v008."
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
          description="Measured today. Do not accept a figure from memory. Required before supply."
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
              required
            />
            <NumberInput
              label="Diastolic BP"
              value={state.observations.diastolicBP}
              onChange={(v) => updateObs("diastolicBP", v)}
              min={30}
              max={160}
              placeholder="80"
              unit="mmHg"
              required
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
              {": "}
              {state.observations.systolicBP < 90 ||
              state.observations.diastolicBP < 50
                ? "Hypotension (below 90/50), CANNOT supply"
                : state.observations.systolicBP > 170 ||
                    state.observations.diastolicBP > 100
                  ? "Uncontrolled hypertension (above 170/100), CANNOT supply"
                  : state.observations.systolicBP > 140 ||
                      state.observations.diastolicBP > 90
                    ? "Elevated, proceed with caution and recommend a GP check"
                    : "Within the acceptable range"}
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
          label="🔴 Erectile dysfunction of sudden onset following trauma, surgery or a new medicine, or accompanied by penile pain or deformity"
          checked={state.redFlags.suddenOnsetSecondaryCause}
          onChange={(v) => updateRedFlags("suddenOnsetSecondaryCause", v)}
          description="EXCLUSION under PGD v008. Refer for a diagnosis rather than treating the symptom."
        />
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
          {currentAlerts.length === 0 ? (
            <p className="text-xs text-gray-500 mb-3">
              No clinical alerts have been raised from the information entered so far.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {currentAlerts.map((a) => (
                <li
                  key={a.code}
                  className={
                    a.severity === "stop"
                      ? "text-red-700"
                      : a.severity === "caution"
                        ? "text-amber-700"
                        : "text-orange-700"
                  }
                >
                  <span className="font-semibold uppercase">{a.severity}:</span> {a.message}
                </li>
              ))}
            </ul>
          )}
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
            Cannot proceed to medicine selection: exclusion criteria have been
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
        armAvailability={getArmAvailability(state)}
        caps={getDoseCaps(state)}
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
        tadalafil72Hour={tadalafil72HourApplies(state)}
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent resize-y"
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
        canProceed={!validationError}
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
