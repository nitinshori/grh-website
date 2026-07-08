// ─── Shared ePGD Types ───
// Used across all PGD consultation ePGDs

// ─── Alert System ───

export type AlertSeverity = "stop" | "caution" | "red-flag";

export interface ClinicalAlert {
  severity: AlertSeverity;
  code: string;
  message: string;
  detail: string;
}

// ─── Base Patient Details (shared across all PGDs) ───

export interface BasePatientDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number | null;
  gpName: string;
  gpPractice: string;
  /** Auto-populated by NHS ODS lookup. Defaults to "" for older records. */
  gpAddress: string;
  /** Auto-populated by NHS ODS lookup. Defaults to "" for older records. */
  gpPhone: string;
  /** Pharmacist enters this manually (NHS ODS doesn't reliably publish it). */
  gpEmail: string;
  /** ODS code (e.g. "F84662") for the matched practice — used for audit only. */
  gpOdsCode: string;
  nhsNumber: string;
  address: string;
  phone: string;
  email: string;
  /** Free-text delivery instructions (e.g. home delivery address/notes).
   *  Optional so per-PGD initial-state literals (which predate the field)
   *  remain valid; the shared step treats undefined as "". */
  deliveryDetails?: string;
  /** General consultation note captured alongside patient details. Optional
   *  for the same reason. */
  consultationNotes?: string;
}

// ─── Base Consent (shared across all PGDs) ───

export interface BaseConsent {
  informedConsentGiven: boolean;
  idVerified: boolean;
  idType: string;
  patientAwarePrivateService: boolean;
  /** Optional: patient consents to a copy of this consultation being emailed
   *  to their GP. The actual send only fires if gpEmail is also set. */
  notifyGp?: boolean;
}

// ─── Base Summary (shared across all PGDs) ───

export interface BaseSummary {
  pharmacistName: string;
  pharmacistGPhC: string;
  pharmacyName: string;
  pharmacyAddress: string;
  consultationDate: string;
  consultationTime: string;
  clinicalNotes: string;
}

// ─── Dose Recommendation (generic shape) ───

export interface DoseRecommendation {
  medicine: string;
  dose: string;
  frequency?: string;
  duration?: string;
  dosingRegimen?: string;
  reason: string;
}

// ─── Initial values for shared types ───

export const initialPatientDetails: BasePatientDetails = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  age: null,
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
  deliveryDetails: "",
  consultationNotes: "",
};

export const initialConsent: BaseConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: "",
  patientAwarePrivateService: false,
};

export const initialSummary = (): BaseSummary => ({
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
});

// ─── Validation helpers ───

export function validatePatientStep(patient: BasePatientDetails, opts?: { requireGender?: boolean; genderConfirmed?: boolean; requireFemale?: boolean; femaleConfirmed?: boolean; minAge?: number; maxAge?: number }): string | null {
  if (!patient.firstName.trim()) return "Patient first name is required";
  if (!patient.lastName.trim()) return "Patient last name is required";
  if (!patient.dateOfBirth) return "Date of birth is required";
  if (opts?.minAge !== undefined && patient.age !== null && patient.age < opts.minAge)
    return `Patient must be ${opts.minAge} years or older`;
  if (opts?.maxAge !== undefined && patient.age !== null && patient.age > opts.maxAge)
    return `This PGD is for patients ${opts.maxAge} years or younger`;
  if (opts?.requireGender && !opts?.genderConfirmed)
    return "Please confirm the patient's gender";
  if (opts?.requireFemale && !opts?.femaleConfirmed)
    return "Please confirm the patient is female";
  return null;
}

export function validateConsentStep(consent: BaseConsent): string | null {
  if (!consent.informedConsentGiven) return "Informed consent must be obtained before proceeding";
  if (!consent.idVerified) return "ID verification is required";
  if (!consent.patientAwarePrivateService) return "Patient must be aware this is a private service";
  return null;
}

export function validateSummaryStep(summary: BaseSummary): string | null {
  if (!summary.pharmacistName.trim()) return "Pharmacist name is required";
  if (!summary.pharmacistGPhC.trim()) return "GPhC registration number is required";
  return null;
}

// ─── Age calculation ───

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
