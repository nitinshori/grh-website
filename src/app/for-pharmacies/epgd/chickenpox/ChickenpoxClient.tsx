"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  ChickenpoxConsultationState,
  ChickenpoxAction,
} from "./lib/chickenpox-types";
import { STEP_LABELS, TOTAL_STEPS, CHICKENPOX_PGD_VERSION, createInitialChickenpoxState } from "./lib/chickenpox-types";
import type { ChickenpoxMedicalHistory, ChickenpoxVaccineAdmin } from "./lib/chickenpox-types";
import { getAllAlerts, hasHardStops, getScheduleText, daysBetween } from "./lib/chickenpox-clinical-logic";
import { validateStep } from "./lib/chickenpox-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from "../shared/components/FormInputs";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../shared/components/SummaryReportShell";

// ─── Reducer ───

function reducer(
  state: ChickenpoxConsultationState,
  action: ChickenpoxAction
): ChickenpoxConsultationState {
  const newState = { ...state };

  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        newState.patient.age = calculateAge(action.value as string);
      }
      break;

    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;

    case "UPDATE_ELIGIBILITY":
      newState.eligibility = { ...newState.eligibility, [action.field]: action.value };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_VACCINE_ADMIN":
      newState.vaccineAdmin = { ...newState.vaccineAdmin, [action.field]: action.value };
      break;

    case "UPDATE_POST_VACCINE":
      newState.postVaccine = { ...newState.postVaccine, [action.field]: action.value };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = { ...newState.counselling, [action.field]: action.value };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;

    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      break;

    case "PREV_STEP":
      newState.currentStep = Math.max(newState.currentStep - 1, 0);
      break;

    case "RESET":
      return createInitialChickenpoxState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function ChickenpoxClient() {
  const [state, dispatch] = useReducer(reducer, createInitialChickenpoxState());
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

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Compute alerts
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    return newState;
  }, [state, alerts]);

  // Validation
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);
  const underSixteen = state.patient.age !== null && state.patient.age < 16;

  // Can proceed?
  // A stop anywhere disables Next on every step; the progress bar only goes
  // backwards, so there is no way round it.
  const canProceed = !validationError && !hasStops;

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(state.currentStep);
    setCompletedSteps(newCompleted);
  }, [completedSteps, state.currentStep]);

  const handleNext = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrev = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const a = state.vaccineAdmin;
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
      clinicalData: { ...state, alerts } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && a.vaccine
          ? {
              name: `${a.vaccine} (varicella vaccine, live)`,
              dose: `0.5 mL ${a.route || "subcutaneous"}, dose ${a.doseNumber || "1st"} of 2`,
              duration: "Single dose this attendance",
              quantity: 1,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity and age."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
              requireAdult={false}
          />
          </StepWrapper>
        );

      case 1: // Consent
        return (
          <StepWrapper
            title="Consent & ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
            {underSixteen && (
              <div className="mt-6 space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
                <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD consent in children and young people)</p>
                <SelectInput
                  label="Consent given by"
                  value={state.medicalHistory.consentBasis}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "consentBasis", value: v as ChickenpoxMedicalHistory["consentBasis"] })
                  }
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                <TextInput
                  label={state.medicalHistory.consentBasis === "gillick" ? "Basis of the Gillick competence assessment" : "Name and relationship of the person with parental responsibility"}
                  value={state.medicalHistory.consentGiverDetails}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "consentGiverDetails", value: v })}
                  placeholder={state.medicalHistory.consentBasis === "gillick" ? "Why the young person was judged competent" : "A parent accompanying a child does not automatically hold parental responsibility. Ask."}
                  required
                />
              </div>
            )}
          </StepWrapper>
        );

      case 2: // Eligibility
        return (
          <StepWrapper
            title="Eligibility Assessment"
            description="Confirm the inclusion criteria and screen for a history of chickenpox or a completed course."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <Checkbox
                label="No history of chickenpox infection (inclusion criterion)"
                checked={state.eligibility.noPriorVaricella}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "noPriorVaricella",
                    value: v,
                  })
                }
                description="Susceptible: no reliable history of chickenpox or no evidence of immunity. Consider prior immunity testing in adults if uncertain."
                required
              />
              <Checkbox
                label="History of chickenpox infection"
                checked={state.eligibility.historyOfChickenpox}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_ELIGIBILITY", field: "historyOfChickenpox", value: v })
                }
                description="Exclusion"
              />
              <Checkbox
                label="Has already completed a two-dose varicella course"
                checked={state.eligibility.completedTwoDoseCourse}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_ELIGIBILITY", field: "completedTwoDoseCourse", value: v })
                }
                description="Exclusion"
              />
              <Checkbox
                label="Dose 1 already given (attending for dose 2)"
                checked={state.eligibility.dose1GivenElsewhere}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_ELIGIBILITY", field: "dose1GivenElsewhere", value: v })
                }
                description="Dose 2 may be given under this PGD whether dose 1 was given here or elsewhere; record where, the date and the brand of dose 1."
              />
              {state.eligibility.dose1GivenElsewhere && (
                <>
                  <SelectInput
                    label="Where was dose 1 given?"
                    value={state.eligibility.dose1Where}
                    onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "dose1Where", value: v })}
                    options={[
                      { value: "this-pharmacy", label: "This pharmacy (under this PGD)" },
                      { value: "elsewhere", label: "Elsewhere (another provider)" },
                    ]}
                    required
                  />
                  <TextInput
                    label="Date of dose 1"
                    value={state.eligibility.dose1ElsewhereDate}
                    onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "dose1ElsewhereDate", value: v })}
                    type="date"
                    required
                  />
                  <SelectInput
                    label="Brand of dose 1"
                    value={state.eligibility.dose1ElsewhereBrand}
                    onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "dose1ElsewhereBrand", value: v })}
                    options={[
                      { value: "Varivax", label: "Varivax" },
                      { value: "Varilrix", label: "Varilrix" },
                      { value: "Unknown", label: "Unknown or not recorded" },
                    ]}
                    required
                  />
                </>
              )}
              <p className="text-sm font-semibold text-navy-900 pt-2">Reason for vaccination (Green Book indications, for the record)</p>
              <Checkbox
                label="Seronegative (confirmed by testing)"
                checked={state.eligibility.seronegative}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "seronegative",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Healthcare worker requiring immunity"
                checked={state.eligibility.healthcareWorker}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "healthcareWorker",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Close contact of immunosuppressed person"
                checked={state.eligibility.closeContactImmunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "closeContactImmunosuppressed",
                    value: v,
                  })
                }
              />
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <Checkbox
                label="Pregnant, or planning pregnancy within one month"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="Exclusion (live vaccine). Pregnancy must be avoided for one month post-vaccination."
              />

              <Checkbox
                label="Immunosuppression of any cause"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "immunosuppressed",
                    value: v,
                  })
                }
                description="Exclusion: immunosuppressive therapy or high-dose systemic corticosteroids; blood dyscrasias, leukaemia, lymphoma or other malignancy of the blood or lymphatic system; family history of congenital or hereditary immunodeficiency unless immune competence has been demonstrated. Refer."
              />

              <Checkbox
                label="Acute febrile illness (moderate or severe illness with fever)"
                checked={state.medicalHistory.severeFebrilIllness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeFebrilIllness",
                    value: v,
                  })
                }
                description="Exclusion: postpone until recovered."
              />

              <Checkbox
                label="Hypersensitivity to neomycin"
                checked={state.medicalHistory.anaphylaxisNeomycin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisNeomycin",
                    value: v,
                  })
                }
                description="Exclusion."
              />

              <Checkbox
                label="Hypersensitivity to gelatin"
                checked={state.medicalHistory.anaphylaxisGelatin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisGelatin",
                    value: v,
                  })
                }
                description="Exclusion."
              />

              <Checkbox
                label="Hypersensitivity to any other component of the vaccine"
                checked={state.medicalHistory.hypersensitivityComponent}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypersensitivityComponent", value: v })
                }
                description="Exclusion. Check the SmPC excipient list for the product held."
              />

              <Checkbox
                label="Active untreated tuberculosis"
                checked={state.medicalHistory.activeTB}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "activeTB",
                    value: v,
                  })
                }
                description="Exclusion: live vaccine should not be given."
              />

              <Checkbox
                label="MMR or another live vaccine within the previous 4 weeks (not on the same day)"
                checked={state.medicalHistory.liveVaccineWithin4Weeks}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liveVaccineWithin4Weeks", value: v })
                }
                description="Exclusion unless given on the same day. Give on the same day as MMR or other live vaccines, or 4 weeks apart."
              />

              <Checkbox
                label="Immunoglobulin or blood products in the previous 3 months"
                checked={state.medicalHistory.bloodProductsWithin3Months}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bloodProductsWithin3Months", value: v })
                }
                description="Caution: may reduce the response. Where protection is needed vaccinate now and consider a further dose after 3 months (Green Book); record the reason."
              />
              {state.medicalHistory.bloodProductsWithin3Months && (
                <TextInput
                  label="Reason for vaccinating now (recorded)"
                  value={state.medicalHistory.bloodProductsReason}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bloodProductsReason", value: v })}
                  placeholder="Why protection is needed now; further dose considered after 3 months"
                  required
                />
              )}
            </div>
          </StepWrapper>
        );

      case 4: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Exclusion present: cannot proceed to vaccine administration."
                : null
            }
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Excluded: do not vaccinate under this PGD
                </p>
                <p className="text-sm text-red-600">
                  Advise on alternative treatment options and how these can be accessed. Document any advice given and the decision reached. Inform or refer to the GP as appropriate.
                </p>
                <div className="mt-3">
                  <TextArea
                    label="Advice given and decision reached (saved with the exclusion record)"
                    value={state.summary.clinicalNotes}
                    onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
                    placeholder="e.g., History of chickenpox: vaccination not needed; explained and no supply made."
                  />
                  <p className="text-xs text-red-700 mt-1">Then use "Save as not supplied" below to record the consultation.</p>
                </div>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Vaccine Administration
        return (
          <StepWrapper
            title="Vaccine Administration"
            description="Record vaccine administered and administration details."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <SelectInput
                label="Vaccine"
                value={state.vaccineAdmin.vaccine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "vaccine",
                    value: v,
                  })
                }
                options={[
                  { value: "Varivax", label: "Varivax (live attenuated), subcutaneous" },
                  { value: "Varilrix", label: "Varilrix (live attenuated), subcutaneous or intramuscular" },
                ]}
                required
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">{getScheduleText(state.vaccineAdmin.vaccine, state.patient.age)}</p>
                <p className="text-xs text-blue-800 mt-1">0.5 mL per dose; course of two doses. Store at 2 to 8 C, do not freeze, protect from light.</p>
              </div>

              <SelectInput
                label="Dose in course"
                value={state.vaccineAdmin.doseNumber}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "doseNumber", value: v as ChickenpoxVaccineAdmin["doseNumber"] })
                }
                options={[
                  { value: "1st", label: "Dose 1" },
                  { value: "2nd", label: "Dose 2 (dose 1 recorded on the Eligibility step)" },
                ]}
                required
              />

              <SelectInput
                label="Route"
                value={state.vaccineAdmin.route}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "route", value: v as ChickenpoxVaccineAdmin["route"] })
                }
                options={[
                  { value: "subcutaneous", label: "Subcutaneous (Varivax: usually the upper arm)" },
                  { value: "intramuscular", label: "Intramuscular (Varilrix only)" },
                ]}
                required
              />

              <TextInput
                label="Date of administration"
                value={state.vaccineAdmin.dose1Date}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Date",
                    value: v,
                  })
                }
                type="date"
                required
              />

              <TextInput
                label="Anatomical site"
                value={state.vaccineAdmin.dose1Site}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Site",
                    value: v,
                  })
                }
                placeholder="e.g. Left upper arm, Right upper arm"
                required
              />

              <TextInput
                label="Batch number"
                value={state.vaccineAdmin.dose1Lot}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Lot",
                    value: v,
                  })
                }
                placeholder="Vaccine batch number"
                required
              />

              <TextInput
                label="Expiry date"
                value={state.vaccineAdmin.expiryDate}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "expiryDate", value: v })
                }
                type="date"
                required
              />

              {state.vaccineAdmin.doseNumber === "1st" && (
                <TextInput
                  label={state.vaccineAdmin.vaccine === "Varilrix" ? "Dose 2 due (at least 6 weeks later, never less than 4)" : "Dose 2 due (at least 4 weeks later; 13 years and over: 4 to 8 weeks)"}
                  value={state.vaccineAdmin.dose2Scheduled}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_VACCINE_ADMIN",
                      field: "dose2Scheduled",
                      value: v,
                    })
                  }
                  type="date"
                  required
                />
              )}

              {state.vaccineAdmin.doseNumber === "2nd" && state.vaccineAdmin.vaccine === "Varilrix" && (() => {
                const interval = daysBetween(state.eligibility.dose1ElsewhereDate, state.vaccineAdmin.dose1Date);
                return interval !== null && interval >= 28 && interval < 42;
              })() && (
                <TextInput
                  label="Varilrix dose 2 given between 4 and 6 weeks after dose 1: reason"
                  value={state.vaccineAdmin.intervalReason}
                  onChange={(v) => dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "intervalReason", value: v })}
                  placeholder="e.g., travel before the 6 week date; PGD gives at least 6 weeks, never less than 4"
                  required
                />
              )}

              <TextInput
                label="Administered by (name and credentials)"
                value={state.vaccineAdmin.administeredBy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "administeredBy",
                    value: v,
                  })
                }
                placeholder="e.g. John Smith, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Post-Vaccine Observations
        return (
          <StepWrapper
            title="Post-Vaccine Observations & Counselling"
            description="Confirm post-vaccination observations and counselling provided."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <Checkbox
                label="Observed for 15 minutes after vaccination, seated, and the observation period completed"
                checked={state.postVaccine.observationCompleted}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "observationCompleted", value: v })
                }
                description="Anxiety-related reactions including vasovagal syncope are commonest in adolescents. Have procedures in place to prevent injury from a faint."
                required
              />

              <Checkbox
                label="Any immediate reactions observed"
                checked={state.postVaccine.reactionsObserved}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "reactionsObserved",
                    value: v,
                  })
                }
                description="e.g. redness, swelling at injection site"
              />

              <p className="text-sm font-semibold text-navy-900 pt-2">Counselling and written information (PGD)</p>

              <Checkbox
                label="Patient information leaflet (PIL) provided with the medication supplied"
                checked={state.postVaccine.leafletGiven}
                onChange={(v) => dispatch({ type: "UPDATE_POST_VACCINE", field: "leafletGiven", value: v })}
                required
              />

              <Checkbox
                label="Two-dose course explained and dose 2 date confirmed"
                checked={state.counselling.doseScheduleAdvice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_COUNSELLING", field: "doseScheduleAdvice", value: v });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "reviewScheduleAdvice", value: v });
                }}
                description={getScheduleText(state.vaccineAdmin.vaccine, state.patient.age)}
                required
              />

              <Checkbox
                label="Advised to avoid contact with high-risk individuals (e.g. immunosuppressed) for 4 to 6 weeks if a rash develops"
                checked={state.postVaccine.contactWithImmunosuppressed && state.counselling.immunosuppressedContactAdvice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "contactWithImmunosuppressed", value: v });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "immunosuppressedContactAdvice", value: v });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "mildRashAdvice", value: v });
                }}
                description="A mild varicella-like rash can follow vaccination."
                required
              />

              <Checkbox
                label="Pregnancy must be avoided for one month post-vaccination"
                checked={state.postVaccine.pregnancyAdviceGiven && state.counselling.pregnancyAvoidanceAdvice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "pregnancyAdviceGiven", value: v });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancyAvoidanceAdvice", value: v });
                }}
                description="Women of childbearing age: appropriate contraceptive advice."
                required
              />

              <Checkbox
                label="Expected side effects explained"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffectsExplained", value: v })}
                description="Injection site reactions (pain, redness, swelling), fever, rash, irritability, or upper respiratory symptoms. Rarely, varicella-like rash or febrile convulsions. Report suspected adverse effects via the Yellow Card scheme."
                required
              />

              <Checkbox
                label="Advised to avoid salicylates (e.g. aspirin) for 6 weeks post-vaccine"
                checked={state.postVaccine.salicylatesAvoided}
                onChange={(v) => {
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "salicylatesAvoided",
                    value: v,
                  });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "salicylatesAvoidanceAdvice", value: v });
                }}
                description="Reye's syndrome risk (PGD precaution). Required for every patient."
                required
              />

              <Checkbox
                label="Follow-up advice given"
                checked={state.postVaccine.followUpAdviceGiven}
                onChange={(v) => dispatch({ type: "UPDATE_POST_VACCINE", field: "followUpAdviceGiven", value: v })}
                description="Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell."
                required
              />
            </div>
          </StepWrapper>
        );

      case 7: // Summary & Print
        return (
          <StepWrapper
            title="Summary &amp; Consultation Record"
            description="Complete the pharmacist declaration, then Save & Print. The record is saved to Patient Records when printed."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6 print:hidden">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistName",
                    value: v,
                  })
                }
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistGPhC",
                    value: v,
                  })
                }
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacyName",
                    value: v,
                  })
                }
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacyAddress",
                    value: v,
                  })
                }
              />
              <TextArea
                label="Additional clinical notes"
                value={state.summary.clinicalNotes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "clinicalNotes",
                    value: v,
                  })
                }
                placeholder="Any additional information to record..."
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4 print:hidden">
                Review the summary below before saving and printing the consultation record.
              </p>
              <ChickenpoxSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {alerts.length > 0 && state.currentStep < 5 && (
        <AlertBanner alerts={alerts} />
      )}

      {renderStep()}
    </div>
  );
}

// ─── Summary Report Component ───

function ChickenpoxSummaryReport({
  state,
}: {
  state: ChickenpoxConsultationState;
}) {
  return (
    <div className="space-y-4 text-xs print:text-[10px]">
      <SectionHeader>Patient Information</SectionHeader>
      <Row
        label="Name"
        value={`${state.patient.firstName} ${state.patient.lastName}`}
      />
      <Row label="Date of Birth" value={state.patient.dateOfBirth} />
      <Row label="Age" value={`${state.patient.age} years`} />
      <Row label="NHS Number" value={state.patient.nhsNumber} />
      <Row label="Address" value={state.patient.address || "Not recorded"} />
      <Row label="GP" value={[state.patient.gpName, state.patient.gpPractice, state.patient.gpAddress].filter(Boolean).join(", ") || "Not recorded"} />

      {state.patient.age !== null && state.patient.age < 16 && (
        <Row
          label="Under 16 consent basis"
          value={
            state.medicalHistory.consentBasis === "gillick"
              ? `Gillick competent: ${state.medicalHistory.consentGiverDetails}`
              : `Parental responsibility: ${state.medicalHistory.consentGiverDetails}`
          }
        />
      )}

      <SectionHeader>Eligibility</SectionHeader>
      <Row
        label="No history of chickenpox infection"
        value={state.eligibility.noPriorVaricella ? "Yes" : "No"}
      />
      <Row
        label="History of chickenpox (exclusion)"
        value={state.eligibility.historyOfChickenpox ? "Yes" : "No"}
      />
      <Row
        label="Completed two-dose course (exclusion)"
        value={state.eligibility.completedTwoDoseCourse ? "Yes" : "No"}
      />
      {state.eligibility.dose1GivenElsewhere && (
        <Row
          label={state.eligibility.dose1Where === "elsewhere" ? "Dose 1 given elsewhere" : "Dose 1 given at this pharmacy"}
          value={`${state.eligibility.dose1ElsewhereDate}, ${state.eligibility.dose1ElsewhereBrand}`}
        />
      )}
      <Row
        label="Seronegative"
        value={state.eligibility.seronegative ? "Yes" : "No"}
      />
      <Row
        label="Healthcare worker"
        value={state.eligibility.healthcareWorker ? "Yes" : "No"}
      />
      <Row
        label="Close contact of immunosuppressed"
        value={state.eligibility.closeContactImmunosuppressed ? "Yes" : "No"}
      />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Pregnancy"
        value={state.medicalHistory.pregnancy ? "Yes" : "No"}
      />
      <Row
        label="Immunosuppressed"
        value={state.medicalHistory.immunosuppressed ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to neomycin, gelatin or any component"
        value={
          state.medicalHistory.anaphylaxisNeomycin ||
          state.medicalHistory.anaphylaxisGelatin ||
          state.medicalHistory.hypersensitivityComponent
            ? "Yes"
            : "No"
        }
      />
      <Row label="Acute febrile illness" value={state.medicalHistory.severeFebrilIllness ? "Yes" : "No"} />
      <Row label="Active untreated tuberculosis" value={state.medicalHistory.activeTB ? "Yes" : "No"} />
      <Row label="Live vaccine within 4 weeks" value={state.medicalHistory.liveVaccineWithin4Weeks ? "Yes" : "No"} />
      <Row
        label="Immunoglobulin or blood products within 3 months"
        value={state.medicalHistory.bloodProductsWithin3Months ? `Yes: ${state.medicalHistory.bloodProductsReason}` : "No"}
      />

      <SectionHeader>Vaccine Administration</SectionHeader>
      {hasHardStops(state.alerts) ? (
        <p className="text-xs font-semibold text-red-800">Outcome: NOT SUPPLIED. Exclusion criteria met; no vaccine administered.</p>
      ) : (
      <>
      <Row label="Vaccine" value={state.vaccineAdmin.vaccine} />
      <Row label="Dose in course" value={state.vaccineAdmin.doseNumber === "2nd" ? "Dose 2" : "Dose 1"} />
      <Row label="Date of administration" value={state.vaccineAdmin.dose1Date} />
      <Row label="Dose, form and route" value={`0.5 mL suspension for injection, ${state.vaccineAdmin.route === "intramuscular" ? "intramuscular" : "subcutaneous"}; quantity administered one dose`} />
      <Row label="Anatomical site" value={state.vaccineAdmin.dose1Site} />
      <Row label="Batch number" value={state.vaccineAdmin.dose1Lot} />
      <Row label="Expiry date" value={state.vaccineAdmin.expiryDate} />
      {state.vaccineAdmin.doseNumber === "1st" && <Row label="Dose 2 due" value={state.vaccineAdmin.dose2Scheduled} />}
      {state.vaccineAdmin.intervalReason && <Row label="Reason for 4 to 6 week interval (Varilrix)" value={state.vaccineAdmin.intervalReason} />}
      <Row label="Administered by" value={state.vaccineAdmin.administeredBy} />
      <Row label="15 minute observation completed" value={state.postVaccine.observationCompleted ? "Yes" : "No"} />
      <Row label="Administered via PGD" value={`Yes, ${CHICKENPOX_PGD_VERSION}`} />
      </>
      )}

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["PIL supplied", state.postVaccine.leafletGiven],
          ["Two-dose course and dose 2 date explained", state.counselling.doseScheduleAdvice],
          ["Pregnancy avoidance (1 month)", state.postVaccine.pregnancyAdviceGiven],
          ["Mild rash may develop", state.counselling.mildRashAdvice],
          ["Avoid high-risk contacts 4 to 6 weeks if rash develops", state.postVaccine.contactWithImmunosuppressed],
          ["Side effects explained", state.counselling.sideEffectsExplained],
          ["Salicylate avoidance", state.postVaccine.salicylatesAvoided],
          ["Follow-up advice given", state.postVaccine.followUpAdviceGiven],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Chickenpox/Varicella"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      <p className="text-[10px] text-gray-500 text-center">{CHICKENPOX_PGD_VERSION}</p>
      <ReportFooter pgdName="Chickenpox/Varicella Vaccination" />
    </div>
  );
}
