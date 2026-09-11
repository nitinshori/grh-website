"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  HPVConsultationState,
  HPVAction,
} from "./lib/hpv-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hpv-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  selectSchedule,
} from "./lib/hpv-clinical-logic";
import { validateStep } from "./lib/hpv-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HPVSummaryReport } from "./components/HPVSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: HPVConsultationState, action: HPVAction): HPVConsultationState {
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

    case "UPDATE_CONSENT16":
      newState.consent16 = { ...newState.consent16, [action.field]: action.value };
      break;

    case "UPDATE_ADMINISTRATION":
      newState.administration = {
        ...newState.administration,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_ASSESSMENT":
      newState.assessment = {
        ...newState.assessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;
  }

  return newState;
}

export default function HPVClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
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

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const schedule = useMemo(() => selectSchedule(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

  const handleNext = useCallback(() => {
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);


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
      outcome: hardStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hardStops]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field, value: value ?? "" })
            }
            requireAdult={false}
          />
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                HPV vaccination is for all sexes
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Gardasil 9 is licensed from 9 years of age for males and
                females. National policy specifically covers gay, bisexual and
                other men who have sex with men up to and including 45 years of
                age. Do not treat this as a female-only service.
              </p>
            </div>
            <SelectInput
              label="Sex (for the clinical record)"
              value={state.patient.sex}
              onChange={(v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "sex", value: v })
              }
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "other", label: "Other / prefer to self-describe" },
              ]}
            />
            <Checkbox
              label="Immunosuppressed, or known to be living with HIV"
              checked={state.assessment.immunosuppressedOrHIV}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "immunosuppressedOrHIV",
                  value: v,
                })
              }
              description="This is the question that decides the schedule: a three-dose course at 0, 1 and 4 to 6 months. Ask it directly. Vaccinate regardless of CD4 count, antiretroviral therapy or viral load."
            />
            <SelectInput
              label="Previous HPV vaccine doses"
              value={state.assessment.priorDoses}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "priorDoses",
                  value: v,
                })
              }
              options={[
                { value: "none", label: "None" },
                { value: "one", label: "One dose" },
                { value: "two", label: "Two doses" },
                { value: "three", label: "Three or more doses" },
                { value: "unknown", label: "Unknown / unable to confirm" },
              ]}
              required
            />
            <Checkbox
              label="Received at least one HPV vaccine dose BEFORE their 25th birthday"
              checked={state.assessment.doseBefore25}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "doseBefore25",
                  value: v,
                })
              }
              description="Under current UK policy a single dose given before the 25th birthday completes the course, whatever the patient's age now. If this applies, no further dose is required and none should be charged for."
            />
            <SelectInput
              label="Pregnancy status"
              value={state.assessment.pregnancyStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "pregnancyStatus",
                  value: v,
                })
              }
              options={[
                { value: "not-applicable", label: "Not applicable" },
                { value: "not-pregnant", label: "Not known to be pregnant" },
                { value: "confirmed", label: "Known to be pregnant" },
              ]}
              required
            />
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                Do NOT ask about the last menstrual period and do NOT pregnancy
                test. Green Book chapter 18a states that neither is required
                before offering HPV vaccine. Vaccination is postponed only where
                the patient is already known to be pregnant.
              </p>
            </div>
            <Checkbox
              label="Acute severe febrile illness or systemic upset"
              checked={state.assessment.currentFebrileIllness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "currentFebrileIllness",
                  value: v,
                })
              }
              description="A minor illness without fever is NOT a reason to defer."
            />
            <Checkbox
              label="Bleeding disorder, thrombocytopenia or on anticoagulation"
              checked={state.assessment.bleedingDisorderOrAnticoagulated}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "bleedingDisorderOrAnticoagulated",
                  value: v,
                })
              }
              description="Not an exclusion. Changes technique: 23 gauge or finer needle, firm pressure without rubbing for at least two minutes."
            />
            <Checkbox
              label="Immunoglobulin or blood products received within the previous three months"
              checked={state.assessment.bloodProductsLast3Months}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "bloodProductsLast3Months",
                  value: v,
                })
              }
              description="Not studied. Not a contraindication, but the PGD requires it to be recorded."
            />
            <Checkbox
              label="Told the patient whether they could have this free on the NHS"
              checked={state.assessment.nhsEligibilityDiscussed}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "nhsEligibilityDiscussed",
                  value: v,
                })
              }
              description="Required before proceeding. Adolescents of any sex from 11 years in school year 8; eligible cohorts until their 25th birthday; all GBMSM up to and including 45 at specialist sexual health or HIV services. Where the patient is NHS-eligible, tell them so and record that you did."
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Check exclusion criteria:
            </p>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                Yeast allergy is NOT a contraindication
              </p>
              <p className="text-xs text-green-800 mt-1">
                Green Book chapter 18a states this in terms. Gardasil 9 is grown
                in yeast cells but the finished vaccine contains no yeast as an
                ingredient, at most trace protein below 0.007 micrograms. Earlier
                versions of this tool refused to vaccinate on this basis, which
                was wrong. Vaccinate.
              </p>
            </div>
            <Checkbox
              label="Confirmed anaphylaxis to a previous HPV vaccine dose: NOT documented"
              checked={!state.assessment.anaphylaxisToPreviousDose}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToPreviousDose",
                  value: !v,
                })
              }
              description="Contraindicated if a confirmed anaphylactic reaction to any HPV vaccine is documented."
            />
            <Checkbox
              label="Confirmed anaphylaxis to a component of Gardasil 9, or hypersensitivity following previous administration of Gardasil 9 or Gardasil / Silgard: NOT documented"
              checked={!state.assessment.anaphylaxisToComponent}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToComponent",
                  value: !v,
                })
              }
              description="Excipients: sodium chloride, histidine, polysorbate 80, borax, water for injections, with amorphous aluminium hydroxyphosphate sulfate adjuvant. Untick if either applies: refer, do not vaccinate."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {schedule ? (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg">
                <p className="text-sm font-semibold text-[color:var(--tenant-primary)]">
                  Schedule for this patient: {schedule.label}
                </p>
                <p className="text-xs text-[color:var(--tenant-primary)] mt-2">
                  {schedule.intervals}
                </p>
                <p className="text-xs text-[color:var(--tenant-primary)] mt-2 italic">
                  {schedule.basis}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Enter the patient&apos;s date of birth and immune status to
                determine the schedule.
              </p>
            )}

            {schedule?.offLabel && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-amber-900">
                  This is an off-label schedule. Consent must be taken and
                  recorded.
                </p>
                <p className="text-xs text-amber-900">
                  The Gardasil 9 SPC contains no one-dose schedule and specifies
                  three doses from 15 years of age. The UK one-dose and two-dose
                  schedules come from JCVI, not from the product licence. Green
                  Book chapter 18a recommends them without flagging their
                  licensing status.
                </p>
                <Checkbox
                  label="Explained the off-label position to the patient"
                  checked={state.consent16.offLabelExplained}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CONSENT16",
                      field: "offLabelExplained",
                      value: v,
                    })
                  }
                  description="That the number of doses follows current UK national recommendations; that this differs from the manufacturer's licence, which specifies more doses; that the recommendation reflects evidence published since the licence was granted; and that they may choose the licensed schedule instead."
                />
                <Checkbox
                  label={`Consent to off-label use given and recorded (${schedule.label})`}
                  checked={state.consent16.offLabelConsentGiven}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CONSENT16",
                      field: "offLabelConsentGiven",
                      value: v,
                    })
                  }
                  description="A general consent to vaccination is not sufficient. The consent must name the schedule."
                />
              </div>
            )}

            {state.patient.age !== null && state.patient.age < 16 && (
              <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  Patient is under 16: record the basis of consent
                </p>
                <SelectInput
                  label="Consent given by"
                  value={state.consent16.basis}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_CONSENT16", field: "basis", value: v })
                  }
                  options={[
                    {
                      value: "parental",
                      label: "A person with parental responsibility",
                    },
                    {
                      value: "gillick",
                      label: "The young person, assessed as Gillick competent",
                    },
                  ]}
                  required
                />
                {state.consent16.basis === "parental" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Name of person with parental responsibility"
                      value={state.consent16.parentName}
                      onChange={(v) =>
                        dispatch({
                          type: "UPDATE_CONSENT16",
                          field: "parentName",
                          value: v,
                        })
                      }
                      placeholder="Full name"
                      required
                    />
                    <TextInput
                      label="Relationship to the patient"
                      value={state.consent16.parentRelationship}
                      onChange={(v) =>
                        dispatch({
                          type: "UPDATE_CONSENT16",
                          field: "parentRelationship",
                          value: v,
                        })
                      }
                      placeholder="Mother, father, guardian"
                    />
                  </div>
                )}
                {state.consent16.basis === "gillick" && (
                  <TextArea
                    label="Basis of the Gillick competence assessment"
                    value={state.consent16.gillickBasis}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CONSENT16",
                        field: "gillickBasis",
                        value: v,
                      })
                    }
                    placeholder="What the young person understood about the vaccine, its benefits and risks, and the decision being made."
                    rows={3}
                    required
                  />
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Counselling delivered:
            </p>
            <Checkbox
              label="Explained the schedule that applies to this patient"
              checked={state.counselling.explainedDoseSchedule}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedDoseSchedule",
                  value: v,
                })
              }
              description={
                schedule
                  ? `${schedule.label} ${schedule.intervals}`
                  : "Determined by age at first dose and immune status."
              }
            />
            <Checkbox
              label="Explained protection against HPV types"
              checked={state.counselling.explainedProtection}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedProtection",
                  value: v,
                })
              }
              description="Protects against HPV 6, 11, 16, 18, 31, 33, 45, 52 and 58: most cervical and other anogenital cancers, most HPV-related throat cancers, and most genital warts. It works best before exposure to the virus, but is still worth having later."
            />
            <Checkbox
              label="Discussed common reactions"
              checked={state.counselling.discussedCommonReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "discussedCommonReactions",
                  value: v,
                })
              }
              description="Arm soreness, mild fever, headache, tiredness for a day or two. Fainting around injections is common, especially in adolescents, which is why the patient stays seated for 15 minutes. Serious reactions are rare."
            />
            <Checkbox
              label="Clarified this is not a treatment for an existing infection"
              checked={state.counselling.explainedNotTreatment}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedNotTreatment",
                  value: v,
                })
              }
              description="The vaccine is prophylactic only. It will not clear an existing infection, existing warts or abnormal cells."
            />
            <Checkbox
              label="Explained that cervical screening is still needed, and barrier protection still matters"
              checked={state.counselling.explainedScreeningStillNeeded}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedScreeningStillNeeded",
                  value: v,
                })
              }
              description="The vaccine does not cover every HPV type, and protects against HPV only, not other sexually transmitted infections or pregnancy."
            />
            <Checkbox
              label="Offered written information"
              checked={state.counselling.offeredWrittenInfo}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "offeredWrittenInfo",
                  value: v,
                })
              }
              description="Patient information leaflet, plus a written record of the vaccine, batch, date, site, dose number and either the next dose date or a clear statement that the course is complete. Follow-up: seek medical advice for any severe or persistent reaction, any rash or swelling that spreads, or any breathing difficulty; for routine queries contact the pharmacy."
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg">
              <p className="text-sm font-medium text-[color:var(--tenant-primary)]">
                Gardasil 9, 0.5 mL intramuscular
              </p>
              <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                Deltoid area of the upper arm, or the higher anterolateral thigh.
                Shake well before use. Never intravascularly, subcutaneously or
                intradermally, and never mixed in a syringe with another vaccine.
                Where another vaccine is given at the same visit, use a separate
                site, preferably a different limb, or at least 2.5 cm apart, and
                record the site of each.
              </p>
            </div>

            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
              <Checkbox
                label="Adrenaline 1 in 1,000 is immediately available in this room, in date, with a written anaphylaxis protocol and a telephone"
                checked={state.administration.adrenalineAvailable}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "adrenalineAvailable",
                    value: v,
                  })
                }
                description="Required before any vaccine is administered under this PGD. Do not proceed without it."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.administration.batchNumber}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "batchNumber",
                    value: v,
                  })
                }
                placeholder="e.g. X012345"
                required
              />
              <TextInput
                label="Vaccine expiry date"
                value={state.administration.expiryDate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "expiryDate",
                    value: v,
                  })
                }
                placeholder="MM/YYYY"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <SelectInput
                label="Anatomical site"
                value={state.administration.site}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "site",
                    value: v,
                  })
                }
                options={[
                  { value: "Left deltoid", label: "Left deltoid" },
                  { value: "Right deltoid", label: "Right deltoid" },
                  {
                    value: "Left anterolateral thigh",
                    label: "Left anterolateral thigh",
                  },
                  {
                    value: "Right anterolateral thigh",
                    label: "Right anterolateral thigh",
                  },
                ]}
                required
              />
              <SelectInput
                label="Dose number in the course"
                value={state.administration.doseNumber}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "doseNumber",
                    value: v,
                  })
                }
                options={[
                  { value: "1", label: "Dose 1" },
                  { value: "2", label: "Dose 2" },
                  { value: "3", label: "Dose 3" },
                ]}
                required
              />
            </div>

            <TextInput
              label={
                schedule && schedule.doses === 1
                  ? "Next dose due (leave blank: this single dose completes the course)"
                  : "Next dose due"
              }
              value={state.administration.nextDoseDue}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ADMINISTRATION",
                  field: "nextDoseDue",
                  value: v,
                })
              }
              placeholder={
                schedule && schedule.doses === 1
                  ? "No further dose required"
                  : "DD/MM/YYYY"
              }
            />

            <TextInput
              label="Other vaccine given at this visit, and its site (leave blank if none)"
              value={state.administration.otherVaccineSameVisit}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ADMINISTRATION",
                  field: "otherVaccineSameVisit",
                  value: v,
                })
              }
              placeholder="e.g. MenACWY, right deltoid"
            />

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <Checkbox
                label="Patient observed, seated, for 15 minutes after vaccination"
                checked={state.administration.observedFifteenMinutes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ADMINISTRATION",
                    field: "observedFifteenMinutes",
                    value: v,
                  })
                }
                description="Required by the Gardasil 9 SPC because of syncope, which is commonest in adolescents. Tick only once the period has actually been completed."
              />
            </div>

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
              placeholder="Any additional observations or patient concerns..."
              rows={4}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacist Details
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
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
                  placeholder="Jane Smith"
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
                  placeholder="2123456"
                  required
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacy Details
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
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
                  placeholder="High Street Pharmacy"
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
                  placeholder="123 High Street, London"
                />
              </div>
            </div>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </div>
        );

      case 7:
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[color:var(--tenant-primary)]/10 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-[color:var(--tenant-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              Consultation Complete
            </h3>
            <p className="text-sm text-gray-600">
              The HPV vaccination ePGD consultation has been recorded successfully.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              {schedule && schedule.doses === 1
                ? "This single dose completes the course. The patient does not need to return for a further dose and should not be charged for one."
                : state.administration.nextDoseDue
                  ? `Next dose due ${state.administration.nextDoseDue}. Make sure the patient has this in writing.`
                  : "Where a further dose is due, book it now and give the date in writing."}
            </p>
          </div>
        );

      case 8:
        return (
          <HPVSummaryReport
            state={state}
            alerts={alerts}
            doseRecommendation={doseRecommendation}
          />
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
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

      <StepWrapper
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        title={STEP_LABELS[state.currentStep]}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
       getConsultationData={getConsultationData}>
        {renderStep()}
      </StepWrapper>
    </div>
  );
}
