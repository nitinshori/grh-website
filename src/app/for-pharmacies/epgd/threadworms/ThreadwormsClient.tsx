"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, NumberInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
export default function ThreadwormsClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null as number | null,
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
    assessment: {
      symptoms: {
        perianialItching: false,
        nightItching: false,
        visibleWorms: false,
        disturbedSleep: false,
        irritability: false,
      },
      bloodInStool: false,
      persistentAbdominalPain: false,
      pregnancy: false,
      breastfeeding: false,
      allergyMebendazole: false,
      ibd: false,
      metronidazole: false,
      carbamazepine: false,
      phenytoin: false,
      recurrentInfection: false,
    },
    treatment: {
      dose: "100",
      doseUnit: "mg",
      frequency: "single",
      batch: "",
      expiry: "",
      repeatDose: true,
      repeatAfterWeeks: "2",
      householdMembers: "",
      householdTreatment: false,
    },
    counselling: {
      singleDoseInformed: false,
      withoutFood: false,
      householdTreated: false,
      hygieneWashHands: false,
      scrubbNails: false,
      showerMorning: false,
      changeUnderwear: false,
      dontShareTowels: false,
      keepNailsShort: false,
      repeatDoseIn2Weeks: false,
      strictHygiene: false,
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
  });

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);


  const calculateAge = useCallback((dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  const handlePatientChange = useCallback(
    (field: string, value: any) => {
      setState((prev) => {
        const newState = { ...prev };
        newState.patient = { ...prev.patient, [field]: value };

        if (field === "dateOfBirth") {
          const age = calculateAge(value);
          newState.patient.age = age;
        }

        return newState;
      });
    },
    [calculateAge]
  );

  const alerts = useMemo((): ClinicalAlert[] => {
    const clinicalAlerts: ClinicalAlert[] = [];
    const age = state.patient.age;

    if (age !== null && age < 2) {
      clinicalAlerts.push({
        severity: "stop",
        code: "AGE_UNDER_2",
        message: "Not Licensed",
        detail:
          "Mebendazole is not licensed for children under 2 years of age. Refer to GP for alternative treatment.",
      });
    }

    if (state.assessment.pregnancy) {
      clinicalAlerts.push({
        severity: "stop",
        code: "PREGNANCY",
        message: "Contraindicated in Pregnancy",
        detail:
          "Mebendazole is contraindicated in pregnancy. Alternative treatment required.",
      });
    }

    if (state.assessment.allergyMebendazole) {
      clinicalAlerts.push({
        severity: "stop",
        code: "ALLERGY",
        message: "Known Allergy",
        detail:
          "Known allergy to mebendazole. Alternative anthelmintic required.",
      });
    }

    if (state.assessment.breastfeeding) {
      clinicalAlerts.push({
        severity: "caution",
        code: "BREASTFEEDING",
        message: "Caution in Breastfeeding",
        detail:
          "Caution with mebendazole in breastfeeding. Minimal excretion but consider alternatives if available.",
      });
    }

    if (state.assessment.ibd) {
      clinicalAlerts.push({
        severity: "caution",
        code: "IBD",
        message: "IBD/Crohn's Disease",
        detail:
          "Use with caution in inflammatory bowel disease or Crohn's disease.",
      });
    }

    if (
      state.assessment.metronidazole ||
      state.assessment.carbamazepine ||
      state.assessment.phenytoin
    ) {
      clinicalAlerts.push({
        severity: "caution",
        code: "DRUG_INTERACTION",
        message: "Drug Interaction",
        detail:
          "Current medication may interact with mebendazole. Verify compatibility.",
      });
    }

    if (state.assessment.recurrentInfection) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "RECURRENT",
        message: "Recurrent Infection",
        detail:
          "3+ episodes in 12 months. Emphasise strict hygiene measures for 2 weeks post-treatment.",
      });
    }

    if (state.assessment.bloodInStool || state.assessment.persistentAbdominalPain) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "ATYPICAL",
        message: "Atypical Presentation",
        detail:
          "Blood in stool or persistent abdominal pain. May not be simple threadworms. Refer if symptoms persist.",
      });
    }

    return clinicalAlerts;
  }, [state.patient.age, state.assessment]);

  const canProceed = useMemo((): boolean => {
    if (currentStep === 0) {
      return !!(
        state.patient.firstName &&
        state.patient.lastName &&
        state.patient.dateOfBirth &&
        state.patient.age !== null &&
        state.patient.gpName &&
        state.patient.gpPractice
      );
    }
    if (currentStep === 1) {
      return state.consent.informedConsentGiven && state.consent.idVerified;
    }
    if (currentStep === 2) {
      const hardStops = alerts.some((a) => a.severity === "stop");
      return (
        !hardStops &&
        Object.values(state.assessment.symptoms).some((v) => v)
      );
    }
    if (currentStep === 3) {
      return !!(state.treatment.batch && state.treatment.expiry);
    }
    if (currentStep === 4) {
      return Object.values(state.counselling).some((v) => v);
    }
    if (currentStep === 5) {
      return !!(
        state.summary.pharmacistName &&
        state.summary.pharmacistGPhC &&
        state.summary.pharmacyName
      );
    }
    return true;
  }, [currentStep, state, alerts]);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const stepTitles = [
    "Patient Details",
    "Consent",
    "Assessment",
    "Treatment",
    "Counselling",
    "Summary",
    "Consultation Complete",
  ];


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
      outcome: alerts.some((a) => a.severity === "stop") ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, alerts]);

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={7} />

      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={!canProceed ? "Please complete all required fields" : null}
       getConsultationData={getConsultationData}>
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={handlePatientChange}
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                consent: { ...prev.consent, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            {state.patient.age !== null && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-900 font-semibold">
                  Age: {state.patient.age} years
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3">Symptoms</p>
              <div className="space-y-3">
                {[
                  { key: "perianialItching", label: "Perianal itching" },
                  {
                    key: "nightItching",
                    label: "Itching especially at night",
                  },
                  { key: "visibleWorms", label: "Visible worms in stool/underwear" },
                  { key: "disturbedSleep", label: "Disturbed sleep due to itching" },
                  { key: "irritability", label: "Irritability and restlessness" },
                ].map(({ key, label }) => (
                  <Checkbox
                    key={key}
                    label={label}
                    checked={
                      state.assessment.symptoms[
                        key as keyof typeof state.assessment.symptoms
                      ]
                    }
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: {
                          ...prev.assessment,
                          symptoms: {
                            ...prev.assessment.symptoms,
                            [key]: v,
                          },
                        },
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3">Additional Assessment</p>
              <div className="space-y-3">
                <Checkbox
                  label="Blood in stool"
                  checked={state.assessment.bloodInStool}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, bloodInStool: v },
                    }))
                  }
                />
                <Checkbox
                  label="Persistent abdominal pain"
                  checked={state.assessment.persistentAbdominalPain}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        persistentAbdominalPain: v,
                      },
                    }))
                  }
                />
                <Checkbox
                  label="Pregnancy"
                  checked={state.assessment.pregnancy}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, pregnancy: v },
                    }))
                  }
                />
                <Checkbox
                  label="Currently breastfeeding"
                  checked={state.assessment.breastfeeding}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, breastfeeding: v },
                    }))
                  }
                />
                <Checkbox
                  label="Known allergy to mebendazole"
                  checked={state.assessment.allergyMebendazole}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        allergyMebendazole: v,
                      },
                    }))
                  }
                />
                <Checkbox
                  label="Inflammatory bowel disease or Crohn's disease"
                  checked={state.assessment.ibd}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, ibd: v },
                    }))
                  }
                />
                <Checkbox
                  label="Currently taking metronidazole"
                  checked={state.assessment.metronidazole}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, metronidazole: v },
                    }))
                  }
                />
                <Checkbox
                  label="Currently taking carbamazepine"
                  checked={state.assessment.carbamazepine}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, carbamazepine: v },
                    }))
                  }
                />
                <Checkbox
                  label="Currently taking phenytoin"
                  checked={state.assessment.phenytoin}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, phenytoin: v },
                    }))
                  }
                />
                <Checkbox
                  label="Recurrent infection (3+ episodes in 12 months)"
                  checked={state.assessment.recurrentInfection}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, recurrentInfection: v },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Mebendazole 100mg Tablet
              </p>
              <p className="text-sm text-blue-800">
                Single dose for all ages 2+ years
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2">Standard Dose</p>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm">
                  <p className="text-gray-900">100mg single dose</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Administration</p>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm">
                  <p className="text-gray-900">With or without food</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.treatment.batch}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, batch: v },
                  }))
                }
                required
              />
              <TextInput
                label="Expiry date"
                value={state.treatment.expiry}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, expiry: v },
                  }))
                }
                type="date"
                required
              />
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <Checkbox
                  label="Repeat dose after 2 weeks if reinfection likely"
                  checked={state.treatment.repeatDose}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      treatment: { ...prev.treatment, repeatDose: v },
                    }))
                  }
                />
                <Checkbox
                  label="All household members should be treated simultaneously"
                  checked={state.treatment.householdTreatment}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      treatment: { ...prev.treatment, householdTreatment: v },
                    }))
                  }
                />
                {state.treatment.householdTreatment && (
                  <TextInput
                    label="Number of household members to treat"
                    value={state.treatment.householdMembers}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        treatment: { ...prev.treatment, householdMembers: v },
                      }))
                    }
                    type="number"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-semibold text-amber-900">
                Patient/Carer Counselling Provided
              </p>
            </div>

            <div className="space-y-3">
              <Checkbox
                label="Single dose only - can be taken with or without food"
                checked={state.counselling.singleDoseInformed}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, singleDoseInformed: v },
                  }))
                }
              />
              <Checkbox
                label="Advised all household members should be treated at the same time"
                checked={state.counselling.householdTreated}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, householdTreated: v },
                  }))
                }
              />
              <Checkbox
                label="Wash hands and scrub nails before eating and after toilet"
                checked={state.counselling.hygieneWashHands}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, hygieneWashHands: v },
                  }))
                }
              />
              <Checkbox
                label="Shower or bath each morning to remove eggs laid overnight"
                checked={state.counselling.showerMorning}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, showerMorning: v },
                  }))
                }
              />
              <Checkbox
                label="Change and wash underwear, nightwear and bed linen daily"
                checked={state.counselling.changeUnderwear}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, changeUnderwear: v },
                  }))
                }
              />
              <Checkbox
                label="Do not share towels"
                checked={state.counselling.dontShareTowels}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, dontShareTowels: v },
                  }))
                }
              />
              <Checkbox
                label="Keep fingernails short"
                checked={state.counselling.keepNailsShort}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, keepNailsShort: v },
                  }))
                }
              />
              <Checkbox
                label="Advised to repeat dose in 2 weeks to prevent reinfection"
                checked={state.counselling.repeatDoseIn2Weeks}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, repeatDoseIn2Weeks: v },
                  }))
                }
              />
              <Checkbox
                label="Strict hygiene measures to be maintained for 2 weeks post-treatment"
                checked={state.counselling.strictHygiene}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, strictHygiene: v },
                  }))
                }
              />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, pharmacistName: v },
                }))
              }
              required
            />
            <TextInput
              label="GPhC registration"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, pharmacistGPhC: v },
                }))
              }
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, pharmacyName: v },
                }))
              }
              required
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, pharmacyAddress: v },
                }))
              }
            />
            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, clinicalNotes: v },
                }))
              }
              rows={4}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900">
                Threadworms Consultation Record Complete
              </p>
              <p className="text-xs text-green-800 mt-2">
                Consultation recorded for {state.patient.firstName}{" "}
                {state.patient.lastName} on{" "}
                {new Date(state.summary.consultationDate).toLocaleDateString(
                  "en-GB"
                )}{" "}
                at {state.summary.consultationTime}
              </p>
            </div>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
