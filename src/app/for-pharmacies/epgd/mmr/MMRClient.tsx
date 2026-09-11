"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  MMRConsultationState,
  MMRAction,
} from "./lib/mmr-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialMMRState } from "./lib/mmr-types";
import { getAllAlerts, hasHardStops } from "./lib/mmr-clinical-logic";
import { validateStep } from "./lib/mmr-validation";
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
  state: MMRConsultationState,
  action: MMRAction
): MMRConsultationState {
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

    case "UPDATE_CONSENT_BASIS":
      newState.consentBasis = { ...newState.consentBasis, [action.field]: action.value };
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
      return createInitialMMRState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function MMRClient() {
  const [state, dispatch] = useReducer(reducer, createInitialMMRState());
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

  // Can proceed?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

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
      outcome: hasStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

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
            title="Consent &amp; ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />

            {state.patient.age !== null && state.patient.age < 16 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  Patient is under 16: record the basis of consent
                </p>
                <p className="text-xs text-blue-900">
                  Valid consent must come from a person with parental responsibility, or from the young person where you assess them as Gillick competent. A parent accompanying a child does not automatically hold parental responsibility: ask.
                </p>
                <SelectInput
                  label="Consent given by"
                  value={state.consentBasis.basis}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_CONSENT_BASIS", field: "basis", value: v })
                  }
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                {state.consentBasis.basis === "parental" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Name of person with parental responsibility"
                      value={state.consentBasis.parentName}
                      onChange={(v) =>
                        dispatch({ type: "UPDATE_CONSENT_BASIS", field: "parentName", value: v })
                      }
                      placeholder="Full name"
                      required
                    />
                    <TextInput
                      label="Relationship to the patient"
                      value={state.consentBasis.parentRelationship}
                      onChange={(v) =>
                        dispatch({ type: "UPDATE_CONSENT_BASIS", field: "parentRelationship", value: v })
                      }
                      placeholder="Mother, father, guardian"
                      required
                    />
                  </div>
                )}
                {state.consentBasis.basis === "gillick" && (
                  <TextArea
                    label="Basis of the Gillick competence assessment"
                    value={state.consentBasis.gillickBasis}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_CONSENT_BASIS", field: "gillickBasis", value: v })
                    }
                    placeholder="What the young person understood about the vaccine, its benefits and risks, and the decision being made."
                    rows={3}
                    required
                  />
                )}
              </div>
            )}
          </StepWrapper>
        );

      case 2: // Eligibility
        return (
          <StepWrapper
            title="Eligibility Assessment"
            description="Individuals aged 12 months and over without two documented doses of MMR, or where protection is otherwise required. Confirm at least one criterion."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Born after 1970 without documented 2 doses"
                checked={state.eligibility.bornAfter1970}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "bornAfter1970",
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
                label="Travel to endemic area planned"
                checked={state.eligibility.travelToEndemicArea}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "travelToEndemicArea",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="No documented prior 2 doses of MMR (catch-up, students, outbreak contacts)"
                checked={state.eligibility.noPriorTwoDoses}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "noPriorTwoDoses",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Protection is otherwise required"
                checked={state.eligibility.protectionOtherwiseRequired}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "protectionOtherwiseRequired",
                    value: v,
                  })
                }
                description="PGD inclusion: where protection is otherwise required. Record the reason in the clinical notes."
              />

              {state.patient.age !== null && state.patient.age < 18 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                  <Checkbox
                    label="Told that they can be vaccinated free by their GP under the NHS childhood programme before any private supply"
                    checked={state.eligibility.nhsFreeOfferTold}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_ELIGIBILITY",
                        field: "nhsFreeOfferTold",
                        value: v,
                      })
                    }
                    description="Required by the PGD for children eligible for the NHS childhood programme. Record that this was done."
                    required
                  />
                </div>
              )}
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
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Exclusion criteria (any ticked item excludes)</p>

              <Checkbox
                label="Pregnant or planning pregnancy within one month"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="Excluded. Avoid pregnancy for 1 month after vaccination."
              />

              <Checkbox
                label="Immunocompromised or receiving immunosuppressive therapy"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "immunosuppressed",
                    value: v,
                  })
                }
                description="Live vaccine is contraindicated."
              />

              <Checkbox
                label="Blood dyscrasia, leukaemia, lymphoma or other malignant neoplasm of the haematopoietic or lymphatic system"
                checked={state.medicalHistory.haematologicalMalignancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "haematologicalMalignancy",
                    value: v,
                  })
                }
                description="Excluded."
              />

              <Checkbox
                label="Family history of congenital or hereditary immunodeficiency, and immune competence has not been demonstrated"
                checked={state.medicalHistory.familyImmunodeficiency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "familyImmunodeficiency",
                    value: v,
                  })
                }
                description="Excluded unless immune competence has been demonstrated."
              />

              <Checkbox
                label="Active untreated tuberculosis"
                checked={state.medicalHistory.activeUntreatedTB}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "activeUntreatedTB",
                    value: v,
                  })
                }
                description="Excluded."
              />

              <Checkbox
                label="Known hypersensitivity to neomycin"
                checked={state.medicalHistory.anaphylaxisNeomycin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisNeomycin",
                    value: v,
                  })
                }
                description="Contraindication to MMR vaccine."
              />

              <Checkbox
                label="Known hypersensitivity to gelatin"
                checked={state.medicalHistory.anaphylaxisGelatin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisGelatin",
                    value: v,
                  })
                }
                description="Contraindication to MMR vaccine."
              />

              <Checkbox
                label="Known hypersensitivity to any other component of the vaccine"
                checked={state.medicalHistory.hypersensitivityOtherComponent}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "hypersensitivityOtherComponent",
                    value: v,
                  })
                }
                description="Check the SmPC excipient list. Excluded."
              />

              <Checkbox
                label="Anaphylaxis to a previous measles, mumps or rubella containing vaccine"
                checked={state.medicalHistory.anaphylaxisPreviousMMR}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisPreviousMMR",
                    value: v,
                  })
                }
                description="Excluded."
              />

              <Checkbox
                label="Yellow fever or varicella vaccine within the previous 4 weeks"
                checked={state.medicalHistory.liveVaccineLast4Weeks}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "liveVaccineLast4Weeks",
                    value: v,
                  })
                }
                description="Defer. Never give yellow fever vaccine and MMR on the same day."
              />

              <Checkbox
                label="Acute febrile illness"
                checked={state.medicalHistory.severeFebrilIllness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeFebrilIllness",
                    value: v,
                  })
                }
                description="Vaccination should be postponed until recovery. Minor infections without fever are not a reason to delay."
              />

              <Checkbox
                label="Anaphylaxis to egg"
                checked={state.medicalHistory.anaphylaxisEgg}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisEgg",
                    value: v,
                  })
                }
                description="Egg allergy is not a contraindication to MMR (Green Book). This tool will not give MMRVaxPro after egg anaphylaxis; select Priorix (egg-free)."
              />

              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">Cautions</p>

              <Checkbox
                label="Blood products or immunoglobulin in the previous 3 months"
                checked={state.medicalHistory.recentBloodProducts}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "recentBloodProducts",
                    value: v,
                  })
                }
                description="Defer where possible; where protection is needed now, give and repeat after 3 months (Green Book). Record which applied."
              />

              {state.medicalHistory.recentBloodProducts && (
                <SelectInput
                  label="Which applied"
                  value={state.medicalHistory.bloodProductsAction}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICAL_HISTORY",
                      field: "bloodProductsAction",
                      value: v,
                    })
                  }
                  options={[
                    { value: "deferred", label: "Deferred until 3 months after the blood product or immunoglobulin" },
                    { value: "given-repeat-3-months", label: "Protection needed now: given, to be repeated after 3 months" },
                  ]}
                  required
                />
              )}

              <Checkbox
                label="History of thrombocytopenia or febrile seizures"
                checked={state.medicalHistory.thrombocytopeniaOrFebrileSeizures}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "thrombocytopeniaOrFebrileSeizures",
                    value: v,
                  })
                }
                description="Use caution in children with a history of thrombocytopenia or febrile seizures."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications &amp; Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present: cannot proceed to vaccine administration."
                : null
            }
            isBlocked={hasStops}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop: Cannot Vaccinate
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, MMR vaccination cannot be
                  administered. Refer the patient to their GP or specialist clinic for further
                  advice.
                </p>
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
                  { value: "Priorix", label: "Priorix (live attenuated, egg-free)" },
                  { value: "MMRVaxPro", label: "MMRVaxPro (live attenuated)" },
                ]}
                required
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                <p className="font-semibold">Dose: 0.5 mL by subcutaneous injection, preferably in the upper arm or thigh.</p>
                <p className="text-xs mt-1">
                  Two doses at least 4 weeks apart (at least 3 months apart where both doses are given under 18 months of age). Doses given before the first birthday do not count towards the course.
                </p>
              </div>

              <SelectInput
                label="Dose number"
                value={state.vaccineAdmin.doseNumber}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "doseNumber",
                    value: v,
                  })
                }
                options={[
                  { value: "1", label: "Dose 1 of 2" },
                  { value: "2", label: "Dose 2 of 2" },
                ]}
                required
              />

              <TextInput
                label="Vaccination date"
                value={state.vaccineAdmin.vaccinationDate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "vaccinationDate",
                    value: v,
                  })
                }
                type="date"
                required
              />

              {state.vaccineAdmin.doseNumber === "2" && (
                <TextInput
                  label="Date of first dose"
                  value={state.vaccineAdmin.previousDoseDate}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_VACCINE_ADMIN",
                      field: "previousDoseDate",
                      value: v,
                    })
                  }
                  type="date"
                  required
                />
              )}

              {state.vaccineAdmin.doseNumber === "1" && (
                <TextInput
                  label="Date the next dose is due"
                  value={state.vaccineAdmin.nextDoseDue}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_VACCINE_ADMIN",
                      field: "nextDoseDue",
                      value: v,
                    })
                  }
                  type="date"
                  required
                />
              )}

              <TextInput
                label="Injection site (anatomical site)"
                value={state.vaccineAdmin.injectionSite}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "injectionSite",
                    value: v,
                  })
                }
                placeholder="e.g. Left upper arm, right anterolateral thigh"
                required
              />

              <TextInput
                label="Batch number"
                value={state.vaccineAdmin.lotNumber}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "lotNumber",
                    value: v,
                  })
                }
                placeholder="Vaccine batch number"
                required
              />

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
                placeholder="e.g. Jane Smith, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Post-Vaccine Observations
        return (
          <StepWrapper
            title="Post-Vaccine Observations &amp; Counselling"
            description="Confirm post-vaccination observations and counselling provided."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
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

              <Checkbox
                label="Fever developed (7-12 days post-vaccine)"
                checked={state.postVaccine.feverDeveloped}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "feverDeveloped",
                    value: v,
                  })
                }
              />

              {state.postVaccine.feverDeveloped && (
                <TextInput
                  label="Date fever onset"
                  value={state.postVaccine.feverOnset}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_POST_VACCINE",
                      field: "feverOnset",
                      value: v,
                    })
                  }
                  type="date"
                />
              )}

              <Checkbox
                label="Rash observed (7-12 days post-vaccine)"
                checked={state.postVaccine.rashObserved}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "rashObserved",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Joint pain reported"
                checked={state.postVaccine.jointPainReported}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "jointPainReported",
                    value: v,
                  })
                }
                description="More common in adult females, usually mild and transient."
              />

              <Checkbox
                label="Pregnancy avoidance advice given"
                checked={state.postVaccine.pregnancyAdviceGiven}
                onChange={(v) => {
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "pregnancyAdviceGiven",
                    value: v,
                  });
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pregnancyAvoidanceAdvice",
                    value: v,
                  });
                }}
                description="Avoid pregnancy for 1 month after vaccination."
              />

              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">Counselling and follow-up (PGD v004)</p>

              <Checkbox
                label="Common side effects explained and when to seek further medical advice"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "sideEffectsExplained",
                    value: v,
                  })
                }
                description="Fever, rash (5 to 10 days after), irritability, swelling or pain at the injection site, mild parotid swelling. Rare: febrile convulsions, thrombocytopenia, allergic reactions. Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell."
                required
              />

              <Checkbox
                label="Common reactions explained (fever, rash)"
                checked={state.counselling.commonReactionsAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "commonReactionsAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Transient joint pain may occur (more common in adult women)"
                checked={state.counselling.jointPainAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "jointPainAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Patient information leaflet (PIL) supplied"
                checked={state.counselling.pilSupplied}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pilSupplied",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="Told when the next dose is due"
                checked={state.counselling.reviewScheduleAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "reviewScheduleAdvice",
                    value: v,
                  })
                }
                description={
                  state.vaccineAdmin.doseNumber === "1"
                    ? `Second dose due ${state.vaccineAdmin.nextDoseDue || "(date not recorded)"}: at least 4 weeks after this dose, or 3 months where both doses are given under 18 months of age.`
                    : "Course complete after dose 2."
                }
                required={state.vaccineAdmin.doseNumber === "1"}
              />

              <Checkbox
                label="MMR is not linked to autism"
                checked={state.counselling.autismMythDebunked}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "autismMythDebunked",
                    value: v,
                  })
                }
              />
            </div>
          </StepWrapper>
        );

      case 7: // Summary & Print
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-navy-900">
                Summary &amp; Consultation Record
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4 mb-6">
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
                <p className="text-sm text-gray-600 mb-4">
                  Review the summary below before printing the consultation record.
                </p>
                <MMRSummaryReport state={updatedState} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: "PREV_STEP" })}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
              >
                &larr; Previous
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
              >
                Print Consultation Record
              </button>
            </div>
          </div>
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

function MMRSummaryReport({
  state,
}: {
  state: MMRConsultationState;
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
      <Row label="GP" value={state.patient.gpName} />

      {state.patient.age !== null && state.patient.age < 16 && (
        <>
          <SectionHeader>Consent (under 16)</SectionHeader>
          <Row
            label="Consent given by"
            value={
              state.consentBasis.basis === "parental"
                ? `Person with parental responsibility: ${state.consentBasis.parentName} (${state.consentBasis.parentRelationship})`
                : state.consentBasis.basis === "gillick"
                  ? "Young person, assessed as Gillick competent"
                  : "Not recorded"
            }
          />
          {state.consentBasis.basis === "gillick" && (
            <Row label="Gillick assessment basis" value={state.consentBasis.gillickBasis || "Not recorded"} />
          )}
        </>
      )}

      <SectionHeader>Eligibility</SectionHeader>
      <Row
        label="Born after 1970"
        value={state.eligibility.bornAfter1970 ? "Yes" : "No"}
      />
      <Row
        label="No documented 2 doses"
        value={state.eligibility.noPriorTwoDoses ? "Yes" : "No"}
      />
      <Row
        label="Healthcare worker"
        value={state.eligibility.healthcareWorker ? "Yes" : "No"}
      />
      <Row
        label="Travel to endemic area"
        value={state.eligibility.travelToEndemicArea ? "Yes" : "No"}
      />
      <Row
        label="Protection otherwise required"
        value={state.eligibility.protectionOtherwiseRequired ? "Yes" : "No"}
      />
      {state.patient.age !== null && state.patient.age < 18 && (
        <Row
          label="Told NHS vaccination is free from GP"
          value={state.eligibility.nhsFreeOfferTold ? "Yes, recorded" : "No"}
        />
      )}

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Pregnant or planning pregnancy"
        value={state.medicalHistory.pregnancy ? "Yes" : "No"}
      />
      <Row
        label="Immunocompromised / immunosuppressive therapy"
        value={state.medicalHistory.immunosuppressed ? "Yes" : "No"}
      />
      <Row
        label="Haematological or lymphatic malignancy"
        value={state.medicalHistory.haematologicalMalignancy ? "Yes" : "No"}
      />
      <Row
        label="Family history of immunodeficiency"
        value={state.medicalHistory.familyImmunodeficiency ? "Yes" : "No"}
      />
      <Row
        label="Active untreated TB"
        value={state.medicalHistory.activeUntreatedTB ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to components / previous MMR anaphylaxis"
        value={
          state.medicalHistory.anaphylaxisNeomycin ||
          state.medicalHistory.anaphylaxisGelatin ||
          state.medicalHistory.anaphylaxisEgg ||
          state.medicalHistory.hypersensitivityOtherComponent ||
          state.medicalHistory.anaphylaxisPreviousMMR
            ? "Yes"
            : "No"
        }
      />
      <Row
        label="Yellow fever or varicella vaccine in last 4 weeks"
        value={state.medicalHistory.liveVaccineLast4Weeks ? "Yes" : "No"}
      />
      <Row
        label="Acute febrile illness"
        value={state.medicalHistory.severeFebrilIllness ? "Yes" : "No"}
      />
      <Row
        label="Blood products / immunoglobulin in last 3 months"
        value={
          state.medicalHistory.recentBloodProducts
            ? state.medicalHistory.bloodProductsAction === "deferred"
              ? "Yes: deferred"
              : state.medicalHistory.bloodProductsAction === "given-repeat-3-months"
                ? "Yes: given, repeat after 3 months"
                : "Yes: action not recorded"
            : "No"
        }
      />
      <Row
        label="Thrombocytopenia or febrile seizures"
        value={state.medicalHistory.thrombocytopeniaOrFebrileSeizures ? "Yes" : "No"}
      />

      <SectionHeader>Vaccine Administration</SectionHeader>
      <Row label="Vaccine" value={state.vaccineAdmin.vaccine} />
      <Row label="Dose and route" value="0.5 mL subcutaneous injection" />
      <Row label="Dose number" value={state.vaccineAdmin.doseNumber ? `${state.vaccineAdmin.doseNumber} of 2` : ""} />
      <Row label="Date" value={state.vaccineAdmin.vaccinationDate} />
      {state.vaccineAdmin.doseNumber === "2" && (
        <Row label="Date of first dose" value={state.vaccineAdmin.previousDoseDate} />
      )}
      {state.vaccineAdmin.doseNumber === "1" && (
        <Row label="Next dose due" value={state.vaccineAdmin.nextDoseDue} />
      )}
      <Row label="Injection site" value={state.vaccineAdmin.injectionSite} />
      <Row label="Batch number" value={state.vaccineAdmin.lotNumber} />
      <Row label="Administered by" value={state.vaccineAdmin.administeredBy} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Side effects and when to seek further medical advice", state.counselling.sideEffectsExplained],
          ["Common reactions explained (fever, rash)", state.counselling.commonReactionsAdvice],
          ["Pregnancy avoidance (1 month)", state.counselling.pregnancyAvoidanceAdvice],
          ["Joint pain may occur", state.counselling.jointPainAdvice],
          ["Patient information leaflet supplied", state.counselling.pilSupplied],
          ["Told when the next dose is due", state.counselling.reviewScheduleAdvice],
          ["Not linked to autism", state.counselling.autismMythDebunked],
        ]}
      />

      <p className="text-[10px] text-gray-500">
        Patient Group Direction for MMRVaxPRO or Priorix (MMR), version 004, issued 11 September 2026.
      </p>

      <PharmacistDeclaration
        pgdName="MMR Top-up"
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

      <ReportFooter pgdName="MMR Top-up Vaccination" />
    </div>
  );
}
