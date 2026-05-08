"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
export default function PaediatricUTIClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null as number | null,
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
    assessment: {
      gender: "",
      symptoms: {
        dysuria: false,
        frequency: false,
        urgency: false,
        abdominalPain: false,
        loinPain: false,
        fever: false,
        bloodInUrine: false,
        bedWetting: false,
        offensive: false,
        cloudy: false,
      },
      temperatureC: null as number | null,
      recurrentUTI: false,
      knownAbnormality: false,
      systemic: false,
      vomiting: false,
      allergyTrimethoprim: false,
      folateAntagonists: false,
      pregnancy: false,
    },
    treatment: {
      dose: null as number | null,
      doseUnit: "mg",
      frequency: "BD",
      duration: "3",
      concentration: "50mg/5ml",
      batch: "",
      expiry: "",
    },
    counselling: {
      completeFullCourse: false,
      fluidIntake: false,
      returnIfWorsens: false,
      returnIfFever: false,
      returnIfNoImprovement: false,
      hygieneAdvised: false,
      wipeFrontToBack: false,
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
          if (age !== null) {
            const newDose = calculateTrimethoprimDose(age);
            newState.treatment = { ...prev.treatment, dose: newDose };
          }
        }

        return newState;
      });
    },
    [calculateAge]
  );

  const calculateTrimethoprimDose = (age: number): number | null => {
    if (age < 1 / 12) return null; // less than 1 month
    if (age < 5 / 12) return 25; // 3-5 months
    if (age < 6) return 50; // 6 months to 5 years
    if (age < 12) return 100; // 6-11 years
    return 200; // 12+ years
  };

  const alerts = useMemo((): ClinicalAlert[] => {
    const clinicalAlerts: ClinicalAlert[] = [];
    const age = state.patient.age;

    if (age !== null && age < 3 / 12) {
      clinicalAlerts.push({
        severity: "stop",
        code: "URGENT_REFERRAL_UNDER_3M",
        message: "Urgent Referral Required",
        detail:
          "Child under 3 months with UTI symptoms. Refer urgently to paediatric assessment.",
      });
    }

    if (age !== null && age >= 3 / 12 && age < 3) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "LOWER_THRESHOLD_REFERRAL",
        message: "Lower Threshold for Referral",
        detail:
          "Child aged 3 months to 3 years requires careful assessment. Lower threshold for referral to specialist.",
      });
    }

    if (state.assessment.gender === "male") {
      clinicalAlerts.push({
        severity: "stop",
        code: "MALE_UTI_INVESTIGATION",
        message: "Urgent Investigation Required",
        detail:
          "All males with UTI in childhood require urgent urological investigation. Refer to urology.",
      });
    }

    if (state.assessment.knownAbnormality) {
      clinicalAlerts.push({
        severity: "stop",
        code: "KNOWN_ABNORMALITY",
        message: "Refer to Specialist",
        detail:
          "Known urinary tract abnormality. This patient requires specialist assessment.",
      });
    }

    if (state.assessment.vomiting) {
      clinicalAlerts.push({
        severity: "stop",
        code: "CANNOT_PRESCRIBE_ORAL",
        message: "Cannot Prescribe Oral",
        detail:
          "Patient unable to keep down oral medication. Requires parenteral antibiotics and medical assessment.",
      });
    }

    if (state.assessment.allergyTrimethoprim) {
      clinicalAlerts.push({
        severity: "stop",
        code: "ALLERGY_CONTRAINDICATED",
        message: "Contraindicated",
        detail:
          "Known allergy to trimethoprim. Alternative antibiotics required.",
      });
    }

    if (state.assessment.folateAntagonists) {
      clinicalAlerts.push({
        severity: "stop",
        code: "DRUG_INTERACTION",
        message: "Drug Interaction",
        detail:
          "Patient currently taking folate antagonists (e.g., methotrexate). Trimethoprim is contraindicated.",
      });
    }

    if (age !== null && age >= 12 && state.assessment.pregnancy) {
      clinicalAlerts.push({
        severity: "stop",
        code: "PREGNANCY_TERATOGENIC",
        message: "Teratogenic",
        detail:
          "Pregnancy confirmed. Trimethoprim is teratogenic. Alternative antibiotics required.",
      });
    }

    if (state.assessment.recurrentUTI) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "RECURRENT_UTI",
        message: "Recurrent UTI",
        detail:
          "Child has had 2 or more UTI episodes. Requires investigation for structural or functional abnormality.",
      });
    }

    if (state.assessment.systemic || (state.assessment.symptoms.fever && state.assessment.temperatureC && state.assessment.temperatureC > 38.5)) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "SYSTEMIC_ILLNESS",
        message: "Systemic Illness",
        detail:
          "High fever or systemically unwell. May require parenteral antibiotics and medical assessment.",
      });
    }

    if (state.assessment.symptoms.bloodInUrine) {
      clinicalAlerts.push({
        severity: "red-flag",
        code: "HAEMATURIA",
        message: "Blood in Urine",
        detail:
          "Haematuria present. Requires further investigation to exclude other pathology.",
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
      return !hardStops && (Object.values(state.assessment.symptoms).some((v) => v) || state.assessment.systemic);
    }
    if (currentStep === 3) {
      return !!(state.treatment.dose && state.treatment.batch && state.treatment.expiry);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput
                label="Gender"
                value={state.assessment.gender}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    assessment: { ...prev.assessment, gender: v },
                  }))
                }
                options={[
                  { label: "Select...", value: "" },
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
                required
              />
              {state.patient.age !== null && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-900 font-semibold">
                    Age: {state.patient.age} years
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3">Symptoms</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "dysuria", label: "Dysuria (pain on passing urine)" },
                  {
                    key: "frequency",
                    label: "Frequency (passing urine more often)",
                  },
                  { key: "urgency", label: "Urgency (need to pass urine suddenly)" },
                  { key: "abdominalPain", label: "Abdominal pain" },
                  { key: "loinPain", label: "Loin pain" },
                  { key: "fever", label: "Fever" },
                  { key: "bloodInUrine", label: "Blood in urine" },
                  {
                    key: "bedWetting",
                    label: "Bed-wetting (previously dry child)",
                  },
                  { key: "offensive", label: "Offensive smelling urine" },
                  { key: "cloudy", label: "Cloudy urine" },
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
                <NumberInput
                  label="Temperature (°C)"
                  value={state.assessment.temperatureC}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, temperatureC: v },
                    }))
                  }
                  min={35}
                  max={42}
                />
                <Checkbox
                  label="Systemically unwell"
                  checked={state.assessment.systemic}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, systemic: v },
                    }))
                  }
                />
                <Checkbox
                  label="Recurrent UTI (2+ episodes)"
                  checked={state.assessment.recurrentUTI}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, recurrentUTI: v },
                    }))
                  }
                />
                <Checkbox
                  label="Known urinary tract abnormality"
                  checked={state.assessment.knownAbnormality}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, knownAbnormality: v },
                    }))
                  }
                />
                <Checkbox
                  label="Vomiting (cannot keep down oral medication)"
                  checked={state.assessment.vomiting}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, vomiting: v },
                    }))
                  }
                />
                <Checkbox
                  label="Known allergy to trimethoprim"
                  checked={state.assessment.allergyTrimethoprim}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        allergyTrimethoprim: v,
                      },
                    }))
                  }
                />
                <Checkbox
                  label="Currently taking folate antagonists (e.g., methotrexate)"
                  checked={state.assessment.folateAntagonists}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        folateAntagonists: v,
                      },
                    }))
                  }
                />
                {state.patient.age !== null && state.patient.age >= 12 && (
                  <Checkbox
                    label="Pregnancy (if applicable)"
                    checked={state.assessment.pregnancy}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: { ...prev.assessment, pregnancy: v },
                      }))
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Trimethoprim Suspension
              </p>
              <p className="text-sm text-blue-800">
                50mg/5ml suspension, 3-day course
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2">Calculated Dose</p>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm">
                  {state.treatment.dose ? (
                    <p className="text-gray-900">
                      {state.treatment.dose}mg BD for 3 days
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Enter patient DOB to calculate dose
                    </p>
                  )}
                </div>
              </div>
              <NumberInput
                label="Dose (mg)"
                value={state.treatment.dose}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, dose: v },
                  }))
                }
                required={true}
              />
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
              <p className="text-sm font-semibold mb-2">Duration</p>
              <p className="text-sm text-gray-700">3 days (lower urinary tract)</p>
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
                label="Complete the full 3-day course even if symptoms improve"
                checked={state.counselling.completeFullCourse}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: {
                      ...prev.counselling,
                      completeFullCourse: v,
                    },
                  }))
                }
              />
              <Checkbox
                label="Encourage increased fluid intake"
                checked={state.counselling.fluidIntake}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, fluidIntake: v },
                  }))
                }
              />
              <Checkbox
                label="Return if symptoms worsen"
                checked={state.counselling.returnIfWorsens}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: {
                      ...prev.counselling,
                      returnIfWorsens: v,
                    },
                  }))
                }
              />
              <Checkbox
                label="Return if fever develops or persists"
                checked={state.counselling.returnIfFever}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, returnIfFever: v },
                  }))
                }
              />
              <Checkbox
                label="Return if no improvement after 48 hours"
                checked={state.counselling.returnIfNoImprovement}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: {
                      ...prev.counselling,
                      returnIfNoImprovement: v,
                    },
                  }))
                }
              />
              <Checkbox
                label="Advised on hygiene measures"
                checked={state.counselling.hygieneAdvised}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, hygieneAdvised: v },
                  }))
                }
              />
              <Checkbox
                label="Advised to wipe front to back after toilet (especially important for girls)"
                checked={state.counselling.wipeFrontToBack}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, wipeFrontToBack: v },
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
                Paediatric UTI Consultation Record Complete
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
