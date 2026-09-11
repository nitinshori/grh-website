"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { CovidBoosterConsultationState, CovidBoosterAction } from "./lib/covid-booster-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/covid-booster-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation, intervalTooShort } from "./lib/covid-booster-clinical-logic";
import { validateStep } from "./lib/covid-booster-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { CovidBoosterSummaryReport } from "./components/CovidBoosterSummaryReport";
import { TextInput, Checkbox, TextArea, SelectInput } from "../shared/components/FormInputs";
import { COVID_PRODUCTS } from "./lib/covid-booster-types";
import type { CovidVaccineProduct, CovidBoosterSupply } from "./lib/covid-booster-types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: CovidBoosterConsultationState, action: CovidBoosterAction): CovidBoosterConsultationState {
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

    case "UPDATE_SUPPLY":
      newState.supply = { ...newState.supply, [action.field]: action.value };
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

export default function CovidBoosterClient() {
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

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

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
      // Brand AND variant designation, written in full (PGD v008 records row).
      medicine:
        !hardStops && state.supply.vaccineProduct
          ? {
              name: COVID_PRODUCTS[state.supply.vaccineProduct].label,
              dose: `${COVID_PRODUCTS[state.supply.vaccineProduct].volume} intramuscular`,
              quantity: "1 dose",
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
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field, value: value ?? "" })
            }
            requireAdult={false}
          />
        );

      case 1:
        return (
          <div className="space-y-6">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />

            {state.patient.age !== null && state.patient.age < 16 && (
              <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  Patient is under 16: record the basis of consent
                </p>
                <p className="text-xs text-blue-900">
                  Valid consent must come from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis of any Gillick assessment recorded.
                </p>
                <SelectInput
                  label="Consent given by"
                  value={state.supply.consentBasis}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_SUPPLY", field: "consentBasis", value: v })
                  }
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                {state.supply.consentBasis === "parental" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Name of person with parental responsibility"
                      value={state.supply.parentName}
                      onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "parentName", value: v })}
                      placeholder="Full name"
                      required
                    />
                    <TextInput
                      label="Relationship to the patient"
                      value={state.supply.parentRelationship}
                      onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "parentRelationship", value: v })}
                      placeholder="Mother, father, guardian"
                      required
                    />
                  </div>
                )}
                {state.supply.consentBasis === "gillick" && (
                  <TextArea
                    label="Basis of the Gillick competence assessment"
                    value={state.supply.gillickBasis}
                    onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "gillickBasis", value: v })}
                    placeholder="What the young person understood about the vaccine, its benefits and risks, and the decision being made."
                    rows={3}
                    required
                  />
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Confirmed aged 12 years or over"
              checked={state.assessment.ageConfirmed}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "ageConfirmed",
                  value: v,
                })
              }
              description="This PGD covers 12 years and over, with no upper age limit. Under 12s need age-specific presentations and dose volumes and must be referred."
            />
            <Checkbox
              label="Previous COVID-19 vaccination received"
              checked={state.assessment.previousCovidVaccine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousCovidVaccine",
                  value: v,
                })
              }
              description="A previous dose is not required. Leave unticked for a first dose. The PGD only excludes a primary course where the patient is also immunosuppressed."
            />
            {state.assessment.previousCovidVaccine && (
              <div className="pl-6 space-y-3">
                <TextInput
                  label="Date of the previous COVID-19 vaccine dose"
                  type="date"
                  value={state.assessment.previousDoseDate}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_ASSESSMENT", field: "previousDoseDate", value: v })
                  }
                  required={!state.assessment.previousDoseDateUnknown}
                />
                {!state.assessment.previousDoseDate && (
                  <Checkbox
                    label="Date not known: the individual states the last dose was more than 3 months ago"
                    checked={state.assessment.previousDoseDateUnknown}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_ASSESSMENT", field: "previousDoseDateUnknown", value: v })
                    }
                    description="The 3 month minimum interval is an exclusion. Where no date can be established this statement is printed on the record as the basis for proceeding."
                  />
                )}
              </div>
            )}
            {intervalTooShort(state) && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <Checkbox
                  label="A shorter interval than 3 months is specifically advised in national guidance for this individual"
                  checked={state.assessment.shorterIntervalNationalGuidance}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_ASSESSMENT",
                      field: "shorterIntervalNationalGuidance",
                      value: v,
                    })
                  }
                  description="Otherwise excluded. Record the guidance relied on in the clinical notes."
                />
              </div>
            )}
            <Checkbox
              label="Immunosuppressed"
              checked={state.assessment.immunosuppressed}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "immunosuppressed",
                  value: v,
                })
              }
              description="As defined in the COVID-19 chapter of the Green Book. Determines both NHS eligibility and which Comirnaty formulation must be used."
            />
            <Checkbox
              label="Resident in a care home for older adults"
              checked={state.assessment.careHomeResident}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "careHomeResident",
                  value: v,
                })
              }
              description="NHS-eligible cohort for autumn 2026, with adults aged 75 and over and the immunosuppressed."
            />
            <SelectInput
              label="NHS entitlement (PGD inclusion)"
              value={state.assessment.nhsStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "nhsStatus",
                  value: v,
                })
              }
              options={[
                { value: "not-eligible", label: "Requires vaccination and does not qualify for NHS vaccination" },
                { value: "eligible-prefers-private", label: "Qualifies for NHS vaccination but prefers to be vaccinated privately, having been told of their NHS entitlement" },
              ]}
              required
            />
            <Checkbox
              label="At least 3 months since the last COVID-19 vaccine dose, or this is a first dose"
              checked={state.assessment.timelinessEligible}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "timelinessEligible",
                  value: v,
                })
              }
              description="The PGD requires a minimum interval of 3 months between COVID-19 vaccine doses, not 6. Defer for 4 weeks after a positive test or symptom onset, and 12 weeks in 5 to 17 year olds who are not in a risk group."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Check exclusion and caution criteria. Each exclusion needs an explicit answer.
            </p>
            <SelectInput
              label="Anaphylaxis to a previous dose of the same vaccine or any of its components?"
              value={state.assessment.anaphylaxisToPreviousDose}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "anaphylaxisToPreviousDose", value: v })
              }
              options={[
                { value: "no", label: "No: not documented" },
                { value: "yes", label: "Yes: anaphylaxis documented (excluded)" },
              ]}
              required
            />
            <SelectInput
              label="Known hypersensitivity to polyethylene glycol (PEG)?"
              value={state.assessment.anaphylaxisToPEG}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "anaphylaxisToPEG", value: v })
              }
              options={[
                { value: "no", label: "No: not documented" },
                { value: "yes", label: "Yes: PEG hypersensitivity (excluded; PEG is an excipient of Comirnaty and Spikevax)" },
              ]}
              required
            />
            <SelectInput
              label="Known hypersensitivity to polysorbate 80?"
              value={state.assessment.anaphylaxisToPolysorbate}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "anaphylaxisToPolysorbate", value: v })
              }
              options={[
                { value: "no", label: "No: not documented" },
                { value: "yes", label: "Yes: polysorbate 80 hypersensitivity (excluded; excipient of Nuvaxovid)" },
              ]}
              required
            />
            <SelectInput
              label="Acute severe febrile illness today?"
              value={state.assessment.severeFebrilIllness}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "severeFebrilIllness", value: v })
              }
              options={[
                { value: "no", label: "No: well enough to be vaccinated (a minor infection without fever is not a contraindication)" },
                { value: "yes", label: "Yes: postpone until recovered" },
              ]}
              required
            />
            <Checkbox
              label="Confirmed current COVID-19 infection"
              checked={state.assessment.currentCovidInfection}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "currentCovidInfection",
                  value: v,
                })
              }
              description="Exclusion: defer until recovered (4 weeks from a positive test or symptom onset is commonly applied; 12 weeks in 5 to 17 year olds not in a risk group)."
            />
            <Checkbox
              label="History of myocarditis or pericarditis after a previous mRNA COVID-19 vaccine"
              checked={state.assessment.myocarditisHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "myocarditisHistory",
                  value: v,
                })
              }
              description="Exclusion: refer for specialist advice. Do not give a further mRNA dose under this PGD."
            />
            <Checkbox
              label="Bleeding disorder"
              checked={state.assessment.bleedingDisorder}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "bleedingDisorder",
                  value: v,
                })
              }
              description="Exclusion unless intramuscular injection has been assessed as safe by a clinician familiar with the individual's bleeding risk."
            />
            {state.assessment.bleedingDisorder && (
              <div className="pl-6">
                <Checkbox
                  label="Intramuscular injection assessed as safe by a clinician familiar with the bleeding risk"
                  checked={state.assessment.bleedingDisorderAssessedSafe}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_ASSESSMENT",
                      field: "bleedingDisorderAssessedSafe",
                      value: v,
                    })
                  }
                  description="Record who assessed it in the clinical notes."
                />
              </div>
            )}
            <Checkbox
              label="Patient on anticoagulants"
              checked={state.assessment.onAnticoagulants}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "onAnticoagulants",
                  value: v,
                })
              }
              description="Caution: stable anticoagulation may be vaccinated IM with a 23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes; advise on haematoma risk."
            />
            <Checkbox
              label="Pregnant"
              checked={state.assessment.pregnant}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "pregnant",
                  value: v,
                })
              }
              description="Pregnancy is not itself an eligible group. A pregnant patient is vaccinated under this PGD only where they are in an NHS-eligible group (75 and over, care home resident or immunosuppressed), with an mRNA vaccine, Comirnaty XFG in preference; otherwise excluded, refer to the GP or maternity service. Breastfeeding is not an exclusion."
            />
            <Checkbox
              label="History of capillary leak syndrome"
              checked={state.assessment.capillaryLeakHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "capillaryLeakHistory",
                  value: v,
                })
              }
              description="Caution: flare-ups reported after Spikevax. Vaccination should be planned with appropriate medical experts; Spikevax cannot be selected."
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
              label="Explained booster rationale"
              checked={state.counselling.explainedBoosterRationale}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedBoosterRationale",
                  value: v,
                })
              }
              description="Variant coverage and benefit of the updated formulation. Protection develops over about 1 to 2 weeks and wanes over time; vaccines do not provide 100% protection and vaccination does not remove the need to seek advice if unwell."
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
              description="Injection site soreness, tiredness, headache, aching muscles, chills and mild fever are common in the first day or two and settle on their own"
            />
            <Checkbox
              label="Explained 15-minute observation period"
              checked={state.counselling.explainedObservationPeriod}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedObservationPeriod",
                  value: v,
                })
              }
              description="Remain in pharmacy for 15 minutes post-injection"
            />
            <Checkbox
              label="Discussed serious reactions and reporting"
              checked={state.counselling.discussedSeriousReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "discussedSeriousReactions",
                  value: v,
                })
              }
              description="Seek urgent medical attention for chest pain, shortness of breath, palpitations or a fluttering heartbeat after vaccination (myocarditis and pericarditis, very rare after mRNA vaccines). Anaphylaxis and when to contact emergency services."
            />
            <Checkbox
              label="Explained Yellow Card self-reporting"
              checked={state.counselling.explainedYellowCard}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedYellowCard",
                  value: v,
                })
              }
              description="Report any suspected side effect via the Yellow Card scheme at yellowcard.mhra.gov.uk. For a routine query about the vaccine, contact the pharmacy."
            />
            <Checkbox
              label="Provided written information for the product and variant given"
              checked={state.counselling.providedWrittenInfo}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "providedWrittenInfo",
                  value: v,
                })
              }
              description="The marketing authorisation holder's leaflet for the product and variant administered (the Comirnaty XFG leaflet is not the LP.8.1 leaflet), plus a written record of the vaccine given with date, brand, variant designation and batch number."
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-sm font-medium text-amber-900">
                Check the variant printed on the syringe label before you inject.
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Comirnaty XFG and Comirnaty LP.8.1 are both 30 micrograms in 0.3 mL and the
                packaging is closely similar. The variant designation is the only thing that tells
                them apart. Record what you actually gave, not what you meant to give.
              </p>
            </div>

            <SelectInput
              label="Vaccine product given"
              value={state.supply.vaccineProduct}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUPPLY",
                  field: "vaccineProduct",
                  value: v as CovidVaccineProduct,
                })
              }
              options={[
                { value: "comirnaty-xfg", label: `${COVID_PRODUCTS["comirnaty-xfg"].label}, vaccine of choice` },
                { value: "comirnaty-lp81", label: `${COVID_PRODUCTS["comirnaty-lp81"].label}, existing stock only` },
                { value: "spikevax-lp81", label: COVID_PRODUCTS["spikevax-lp81"].label },
                { value: "nuvaxovid-jn1", label: COVID_PRODUCTS["nuvaxovid-jn1"].label },
              ]}
            />

            {state.supply.vaccineProduct && (
              <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg">
                <p className="text-sm font-medium text-[color:var(--tenant-primary)]">
                  {COVID_PRODUCTS[state.supply.vaccineProduct].label}
                </p>
                <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                  {COVID_PRODUCTS[state.supply.vaccineProduct].volume} intramuscular injection into
                  the deltoid. Single dose for the 2026/27 season.
                </p>
                <p className="text-xs text-[color:var(--tenant-primary)] mt-2">
                  Observe for 15 minutes where there is a history of allergy or previous vaccine
                  reaction. Vaccinate seated.
                </p>
              </div>
            )}

            {state.supply.vaccineProduct === "comirnaty-lp81" && (
              <Checkbox
                label="Patient told this is the previous seasonal formulation"
                checked={state.supply.lp81FormulationExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUPPLY",
                    field: "lp81FormulationExplained",
                    value: v,
                  })
                }
                description="Explained that Comirnaty XFG is the current 2026/27 formulation, that both are licensed in the UK, and that the WHO named LP.8.1 as a preferred antigen for this season. Patient accepted."
              />
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.supply.batchNumber}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUPPLY", field: "batchNumber", value: v })
                }
                placeholder="As printed on the syringe or vial"
              />
              <TextInput
                label="Vaccine expiry date"
                type="date"
                value={state.supply.expiryDate}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUPPLY", field: "expiryDate", value: v })
                }
              />
              <SelectInput
                label="Administration site"
                value={state.supply.administrationSite}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUPPLY",
                    field: "administrationSite",
                    value: v as CovidBoosterSupply["administrationSite"],
                  })
                }
                options={[
                  { value: "left-deltoid", label: "Left deltoid" },
                  { value: "right-deltoid", label: "Right deltoid" },
                ]}
              />
              <TextInput
                label="Time administered"
                type="time"
                value={state.supply.administrationTime}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUPPLY", field: "administrationTime", value: v })
                }
              />
            </div>

            <TextInput
              label="Other vaccine given at this visit and its site (if any)"
              value={state.supply.coAdministeredVaccine}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUPPLY", field: "coAdministeredVaccine", value: v })
              }
              placeholder="e.g. Influenza vaccine, right deltoid. Use separate sites, preferably different limbs, or at least 2.5 cm apart."
            />

            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Observation and adverse reactions (PGD v008)</p>
              <Checkbox
                label="Patient observed, seated, for 15 minutes after vaccination and the observation period has been completed"
                checked={state.supply.observedFifteenMinutes}
                onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "observedFifteenMinutes", value: v })}
                description="Required by the PGD where there is a history of allergy or previous vaccine reaction. Tick only once the period has actually been completed."
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
                    label="Reported via the MHRA Yellow Card scheme (https://yellowcard.mhra.gov.uk), stating the variant designation, and the GP informed"
                    checked={state.supply.yellowCardSubmitted}
                    onChange={(v) => dispatch({ type: "UPDATE_SUPPLY", field: "yellowCardSubmitted", value: v })}
                  />
                </>
              )}
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
            <p className="text-xs text-gray-600 print:hidden">
              Check the record below, then press Save &amp; Print Record. The record is saved when that button is pressed, not before.
            </p>
            <CovidBoosterSummaryReport
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
