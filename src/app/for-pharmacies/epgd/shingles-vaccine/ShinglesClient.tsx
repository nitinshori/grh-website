"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ShinglesConsultationState, ShinglesAction } from "./lib/shingles-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/shingles-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/shingles-clinical-logic";
import { validateStep } from "./lib/shingles-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { ShinglesSummaryReport } from "./components/ShinglesSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: ShinglesConsultationState, action: ShinglesAction): ShinglesConsultationState {
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
    case "UPDATE_ASSESSMENT":
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
      break;
    case "UPDATE_SUPPLY":
      newState.supply = { ...newState.supply, [action.field]: action.value };
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
    case "RESET":
      return createInitialConsultationState();
  }
  return newState;
}

export default function ShinglesClient() {
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

  const validationError = useMemo(() => validateStep(state, state.currentStep), [state]);

  // A stop anywhere blocks Next on every step and the final Save & Print
  // (adversarial review, 11 Sep 2026). The progress bar only moves backwards.
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  const handleNext = useCallback(() => {
    if (hardStops) return;
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps, hardStops]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [state.currentStep]);

  // When a stop appears, forget every step after the one being edited.
  useEffect(() => {
    if (!hardStops) return;
    setCompletedSteps((prev) => {
      const next = new Set<number>();
      prev.forEach((s) => {
        if (s < state.currentStep) next.add(s);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [hardStops, state.currentStep]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


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
      medicine:
        !hardStops && state.supply.doseNumber
          ? {
              name: "Shingrix",
              dose: "0.5 mL intramuscular",
              quantity: `dose ${state.supply.doseNumber} of 2`,
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
  }, [state, hardStops, __pharmProfile]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value: value ?? "" })}
          />
        );

      case 1:
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Aged 50 years or older and eligible under national immunisation guidelines"
              checked={state.assessment.ageEligible}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "ageEligible",
                  value: v,
                })
              }
              description="This PGD covers individuals aged 50 and over only. An immunosuppressed adult aged 18 to 49 is not covered: refer."
            />
            <Checkbox
              label="Patient is immunosuppressed"
              checked={state.assessment.immunosuppressed}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "immunosuppressed",
                  value: v,
                })
              }
              description="HIV, cancer treatment, organ transplant, immunosuppressive therapy. Shingrix (non-live) is the preferred vaccine; must still be aged 50 or over."
            />
            <SelectInput
              label="Pregnancy or breastfeeding status"
              value={state.assessment.pregnancyStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "pregnancyStatus",
                  value: v,
                })
              }
              options={[
                { value: "not-pregnant", label: "Not pregnant and not breastfeeding (or not applicable)" },
                { value: "unknown", label: "Pregnancy status unknown" },
                { value: "confirmed", label: "Confirmed pregnant (excluded)" },
                { value: "breastfeeding", label: "Breastfeeding (excluded)" },
              ]}
              required
            />

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">Vaccine history (check before administration)</p>
            <Checkbox
              label="Two-dose course of Shingrix already completed"
              checked={state.assessment.completedCourse}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "completedCourse",
                  value: v,
                })
              }
              description="Excluded: the PGD covers individuals who have not completed a two-dose course"
            />
            <Checkbox
              label="Dose 1 of Shingrix already given (here or elsewhere)"
              checked={state.assessment.previousShingrix}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousShingrix",
                  value: v,
                })
              }
              description="Dose 2 may be given under this PGD where dose 1 was given elsewhere; record the date of dose 1"
            />
            {state.assessment.previousShingrix && (
              <TextInput
                label="Date of dose 1"
                value={state.assessment.previousShingrixDate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "previousShingrixDate",
                    value: v,
                  })
                }
                type="date"
                required
              />
            )}
            <Checkbox
              label="Previous Zostavax (live) vaccine"
              checked={state.assessment.previousZostavax}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousZostavax",
                  value: v,
                })
              }
              description="Not an exclusion under the PGD; a full two-dose Shingrix course may be given"
            />
            <Checkbox
              label="Shingles (herpes zoster) within the past 12 months"
              checked={state.assessment.previousShinglesHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousShinglesHistory",
                  value: v,
                })
              }
              description="Inclusion requires no history of shingles in the past 12 months. Not for treatment of acute shingles."
            />
            <Checkbox
              label="Another vaccine (e.g. COVID-19 or influenza) given today or recently"
              checked={state.assessment.recentOtherVaccine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "recentOtherVaccine",
                  value: v,
                })
              }
              description="Caution: allow appropriate spacing from other vaccines based on clinical judgement"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Check contraindications. Each question needs an explicit answer.
            </p>
            <SelectInput
              label="Hypersensitivity to any component of Shingrix?"
              value={state.assessment.anaphylaxisToComponent}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToComponent",
                  value: v,
                })
              }
              options={[
                { value: "no", label: "No: no known hypersensitivity to any component of the vaccine" },
                { value: "yes", label: "Yes: hypersensitivity documented (excluded)" },
              ]}
              required
            />
            <SelectInput
              label="Acute illness with fever today?"
              value={state.assessment.severeAcuteIllness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "severeAcuteIllness",
                  value: v,
                })
              }
              options={[
                { value: "no", label: "No: well enough to be vaccinated today" },
                { value: "yes", label: "Yes: acute illness with fever (delay until recovered)" },
              ]}
              required
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Counselling delivered:
            </p>
            <Checkbox
              label="Explained the 2-dose schedule"
              checked={state.counselling.explainedDoseSchedule}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedDoseSchedule",
                  value: v,
                })
              }
              description="Two doses of 0.5 mL, the second 2 to 6 months after the first"
            />
            <Checkbox
              label="Discussed local injection reactions"
              checked={state.counselling.explainedLocalReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedLocalReactions",
                  value: v,
                })
              }
              description="Localised pain, redness and swelling at the injection site"
            />
            <Checkbox
              label="Counselled that systemic side effects are common and generally self-limiting"
              checked={state.counselling.explainedSystemicReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedSystemicReactions",
                  value: v,
                })
              }
              description="Fatigue, headache, myalgia, shivering, fever, gastrointestinal symptoms (PGD v006 caution)"
            />
            <Checkbox
              label="Explained effectiveness"
              checked={state.counselling.explainedEffectiveness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedEffectiveness",
                  value: v,
                })
              }
              description="Over 90% effective in preventing shingles and postherpetic neuralgia"
            />
            <Checkbox
              label="Clarified NOT a live vaccine"
              checked={state.counselling.explainedNotLiveVaccine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedNotLiveVaccine",
                  value: v,
                })
              }
              description="Safe for immunocompromised patients (unlike Zostavax)"
            />
            <Checkbox
              label="Patient information leaflet (PIL) supplied"
              checked={state.counselling.offeredWrittenInfo}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "offeredWrittenInfo",
                  value: v,
                })
              }
              description="Supply the PIL provided with the medication"
            />
            <Checkbox
              label="Follow-up advice given"
              checked={state.counselling.followUpAdviceGiven}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "followUpAdviceGiven",
                  value: v,
                })
              }
              description="Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg">
              <p className="text-sm font-medium text-[color:var(--tenant-primary)]">
                Shingrix (recombinant zoster vaccine, non-live)
              </p>
              <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                0.5 mL intramuscular injection, preferably in the deltoid muscle
              </p>
              <p className="text-xs text-[color:var(--tenant-primary)] mt-2">
                Two doses of 0.5 mL, the second 2 to 6 months after the first. Record date, site, batch number and brand.
              </p>
            </div>
            <SelectInput
              label="Dose number"
              value={state.supply.doseNumber}
              onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "doseNumber", value: v })}
              options={[
                { value: "1", label: "Dose 1 of 2" },
                { value: "2", label: "Dose 2 of 2 (2 to 6 months after dose 1)" },
              ]}
              required
            />
            <TextInput
              label="Vaccination date"
              value={state.supply.vaccinationDate}
              onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "vaccinationDate", value: v })}
              type="date"
              required
            />
            {state.supply.doseNumber === "1" && (
              <TextInput
                label="Second dose due (2 to 6 months after today)"
                value={state.supply.nextDoseDue}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "nextDoseDue", value: v })}
                type="date"
                required
              />
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.supply.batchNumber}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "batchNumber", value: v })}
                placeholder="e.g. X012345"
                required
              />
              <TextInput
                label="Expiry date"
                value={state.supply.expiryDate}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "expiryDate", value: v })}
                type="date"
                required
              />
            </div>
            <SelectInput
              label="Anatomical site"
              value={state.supply.site}
              onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "site", value: v })}
              options={[
                { value: "left-deltoid", label: "Left deltoid, intramuscular" },
                { value: "right-deltoid", label: "Right deltoid, intramuscular" },
              ]}
              required
            />
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Observation and adverse reactions (PGD v006 safety block)</p>
              <Checkbox
                label="Patient observed, seated, for 15 minutes after vaccination and the observation period has been completed"
                checked={state.supply.observedFifteenMinutes}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "observedFifteenMinutes", value: v })}
                description="Tick only once the period has actually been completed. The PGD requires the completed observation to be recorded."
                required
              />
              <TextArea
                label="Adverse reaction observed (leave blank if none)"
                value={state.supply.adverseReaction}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "adverseReaction", value: v })}
                placeholder="Describe any adverse reaction, including the time it started"
                rows={2}
              />
              {state.supply.adverseReaction.trim() && (
                <>
                  <TextArea
                    label="Action taken"
                    value={state.supply.adverseReactionAction}
                    onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "adverseReactionAction", value: v })}
                    placeholder="Treatment given, referral made, GP informed"
                    rows={2}
                    required
                  />
                  <Checkbox
                    label="Reported to the MHRA Yellow Card scheme (https://yellowcard.mhra.gov.uk) and the GP informed as appropriate"
                    checked={state.supply.yellowCardSubmitted}
                    onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "yellowCardSubmitted", value: v })}
                    description="Report suspected anaphylaxis even where the diagnosis is uncertain"
                  />
                </>
              )}
              <p className="text-xs text-gray-600">
                Report any suspected adverse reaction via the Yellow Card scheme: https://yellowcard.mhra.gov.uk
              </p>
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
              placeholder="Patient reactions or concerns..."
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
            <p className="text-xs text-gray-600 print:hidden">
              Check the record below, then press Save &amp; Print Record. The record is saved when that button is pressed, not before.
              {state.supply.doseNumber === "2"
                ? " Two-dose course complete."
                : state.supply.nextDoseDue
                  ? ` Second dose due ${state.supply.nextDoseDue}: book it now and give the date in writing.`
                  : ""}
            </p>
            <ShinglesSummaryReport
              state={state}
              alerts={alerts}
              doseRecommendation={doseRecommendation}
            />
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
        isBlocked={hardStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStep()}
      </StepWrapper>
    </div>
  );
}
