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
export default function EarInfectionClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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
      earAffected: "" as "" | "left" | "right" | "both",
      symptomDuration: "" as "" | "<48h" | "2-7d" | ">7d" | ">14d",
      earPain: false,
      discharge: false,
      reducedHearing: false,
      itching: false,
      earSurgeryHistory: false,
      grommetsInPlace: false,
      foreignBodySuspected: false,
      quinoloneAllergy: false,
      otherEarDrops: false,
      immunosuppressed: false,
      highTemperature: false,
      pregnancy: false,
    },
    treatment: {
      dose: "0.25ml (one single-dose container)",
      frequency: "Twice daily",
      duration: 7,
      quantity: "1 box (10 single-dose containers)",
      batchNumber: "",
      expiryDate: "",
    },
    counselling: {
      warmDrops: false,
      liedPosition: false,
      instilTechnique: false,
      completeCourse: false,
      avoidWater: false,
      seekAdvice: false,
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


  const alerts: ClinicalAlert[] = useMemo(() => {
    const issues: ClinicalAlert[] = [];

    // HARD STOP: Ear surgery history
    if (state.assessment.earSurgeryHistory) {
      issues.push({
        severity: "stop",
        code: "EAR_SURGERY_HISTORY",
        message: "Ear surgery history - Cetraxal contraindicated",
        detail:
          "This patient has a history of ear surgery and cannot use Cetraxal. Refer to GP or ENT specialist.",
      });
    }

    // HARD STOP: Grommets in place
    if (state.assessment.grommetsInPlace) {
      issues.push({
        severity: "stop",
        code: "GROMMETS_IN_PLACE",
        message: "Grommets in ear canal - Cetraxal contraindicated",
        detail:
          "Ciprofloxacin drops are contraindicated when grommets are present. Refer to GP or ENT.",
      });
    }

    // HARD STOP: Foreign body suspected
    if (state.assessment.foreignBodySuspected) {
      issues.push({
        severity: "stop",
        code: "FOREIGN_BODY",
        message: "Foreign body suspected - refer for removal",
        detail:
          "Suspected foreign body in ear canal. Refer for ENT assessment and removal.",
      });
    }

    // HARD STOP: Quinolone allergy
    if (state.assessment.quinoloneAllergy) {
      issues.push({
        severity: "stop",
        code: "QUINOLONE_ALLERGY",
        message: "Known quinolone allergy - contraindicated",
        detail:
          "Patient has known allergy to quinolone antibiotics. Cetraxal cannot be supplied.",
      });
    }

    // RED FLAG: High temperature / systemic symptoms
    if (state.assessment.highTemperature) {
      issues.push({
        severity: "red-flag",
        code: "HIGH_TEMP_SYSTEMIC",
        message: "Temperature >38°C or systemic symptoms - refer to GP",
        detail:
          "Signs of systemic infection. Patient requires GP or hospital assessment.",
      });
    }

    // RED FLAG: Symptoms >14 days
    if (state.assessment.symptomDuration === ">14d") {
      issues.push({
        severity: "red-flag",
        code: "LONG_DURATION",
        message: "Symptoms >14 days - refer for further investigation",
        detail:
          "Persistent symptoms suggest need for GP assessment and possible ENT referral.",
      });
    }

    // CAUTION: Other ear drops in use
    if (state.assessment.otherEarDrops) {
      issues.push({
        severity: "caution",
        code: "OTHER_EAR_DROPS",
        message: "Patient currently using other ear drops",
        detail:
          "Advise to discontinue other drops. Allow 24 hours between different medications.",
      });
    }

    // CAUTION: Immunosuppressed
    if (state.assessment.immunosuppressed) {
      issues.push({
        severity: "caution",
        code: "IMMUNOSUPPRESSED",
        message: "Patient is immunosuppressed",
        detail:
          "Consider referral to GP. Enhanced monitoring recommended during treatment.",
      });
    }

    // CAUTION: Pregnancy / breastfeeding
    if (state.assessment.pregnancy) {
      issues.push({
        severity: "caution",
        code: "PREGNANCY_BREASTFEEDING",
        message: "Patient is pregnant or breastfeeding",
        detail:
          "Discuss risks/benefits. Cetraxal minimal systemic absorption but verify with patient.",
      });
    }

    return issues;
  }, [state.assessment]);

  const hasStopAlerts = alerts.some((a) => a.severity === "stop");

  const handleNext = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, [currentStep]);

  const handlePrev = useCallback(
    () => setCurrentStep((prev) => Math.max(prev - 1, 0)),
    []
  );

  const handleStepClick = useCallback(
    (step: number) => {
      if (completedSteps.has(step) || step <= currentStep) {
        setCurrentStep(step);
      }
    },
    [completedSteps, currentStep]
  );

  const stepTitles = [
    "Patient Details",
    "Consent",
    "Assessment",
    "Treatment",
    "Counselling",
    "Summary",
    "Consultation Complete",
  ];

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setState({
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
        earAffected: "" as "" | "left" | "right" | "both",
        symptomDuration: "" as "" | "<48h" | "2-7d" | ">7d" | ">14d",
        earPain: false,
        discharge: false,
        reducedHearing: false,
        itching: false,
        earSurgeryHistory: false,
        grommetsInPlace: false,
        foreignBodySuspected: false,
        quinoloneAllergy: false,
        otherEarDrops: false,
        immunosuppressed: false,
        highTemperature: false,
        pregnancy: false,
      },
      treatment: {
        dose: "0.25ml (one single-dose container)",
        frequency: "Twice daily",
        duration: 7,
        quantity: "1 box (10 single-dose containers)",
        batchNumber: "",
        expiryDate: "",
      },
      counselling: {
        warmDrops: false,
        liedPosition: false,
        instilTechnique: false,
        completeCourse: false,
        avoidWater: false,
        seekAdvice: false,
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
      outcome: "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state]);

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={stepTitles}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={currentStep === 2 && hasStopAlerts}
      />
      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={currentStep !== 2 || !hasStopAlerts}
        isBlocked={currentStep === 2 && hasStopAlerts}
        validationError={
          currentStep === 2 && hasStopAlerts
            ? "Cannot proceed: contraindications present"
            : null
        }
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {/* Step 0: Patient Details */}
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, [field]: value },
              }))
            }
            requireAdult={false}
          />
        )}

        {/* Step 1: Consent */}
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

        {/* Step 2: Assessment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which ear is affected? *
                </label>
                <SelectInput
                  label="Which ear is affected?"
                  value={state.assessment.earAffected}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, earAffected: v as any },
                    }))
                  }
                  options={[
                    { value: "", label: "Select..." },
                    { value: "left", label: "Left" },
                    { value: "right", label: "Right" },
                    { value: "both", label: "Both" },
                  ]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration of symptoms *
                </label>
                <SelectInput
                  label="Duration of symptoms"
                  value={state.assessment.symptomDuration}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        symptomDuration: v as any,
                      },
                    }))
                  }
                  options={[
                    { value: "", label: "Select..." },
                    { value: "<48h", label: "Less than 48 hours" },
                    { value: "2-7d", label: "2-7 days" },
                    { value: ">7d", label: "7-14 days" },
                    { value: ">14d", label: "More than 14 days" },
                  ]}
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Which symptoms is the patient experiencing?
                </p>
                <div className="space-y-2">
                  <Checkbox
                    label="Ear pain"
                    checked={state.assessment.earPain}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: { ...prev.assessment, earPain: v },
                      }))
                    }
                  />
                  <Checkbox
                    label="Discharge from ear"
                    checked={state.assessment.discharge}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: { ...prev.assessment, discharge: v },
                      }))
                    }
                  />
                  <Checkbox
                    label="Reduced hearing"
                    checked={state.assessment.reducedHearing}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: { ...prev.assessment, reducedHearing: v },
                      }))
                    }
                  />
                  <Checkbox
                    label="Itching in the ear"
                    checked={state.assessment.itching}
                    onChange={(v) =>
                      setState((prev) => ({
                        ...prev,
                        assessment: { ...prev.assessment, itching: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Medical and treatment history
                </p>
                <Checkbox
                  label="History of ear surgery or perforated eardrum"
                  checked={state.assessment.earSurgeryHistory}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, earSurgeryHistory: v },
                    }))
                  }
                />
                <Checkbox
                  label="Grommets currently in place"
                  checked={state.assessment.grommetsInPlace}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, grommetsInPlace: v },
                    }))
                  }
                />
                <Checkbox
                  label="Foreign body suspected in ear"
                  checked={state.assessment.foreignBodySuspected}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: {
                        ...prev.assessment,
                        foreignBodySuspected: v,
                      },
                    }))
                  }
                />
                <Checkbox
                  label="Known allergy to quinolone antibiotics"
                  checked={state.assessment.quinoloneAllergy}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, quinoloneAllergy: v },
                    }))
                  }
                />
                <Checkbox
                  label="Currently using other ear drops"
                  checked={state.assessment.otherEarDrops}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, otherEarDrops: v },
                    }))
                  }
                />
                <Checkbox
                  label="Patient is immunosuppressed"
                  checked={state.assessment.immunosuppressed}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, immunosuppressed: v },
                    }))
                  }
                />
                <Checkbox
                  label="Temperature >38°C or systemic symptoms (fever, general malaise)"
                  checked={state.assessment.highTemperature}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, highTemperature: v },
                    }))
                  }
                />
                <Checkbox
                  label="Patient is pregnant or breastfeeding"
                  checked={state.assessment.pregnancy}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      assessment: { ...prev.assessment, pregnancy: v },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Treatment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-900 mb-3">
                Medicine: Cetraxal (Ciprofloxacin 0.2% ear drops)
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Dose:</dt>
                  <dd className="font-medium text-gray-900">
                    {state.treatment.dose}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Frequency:</dt>
                  <dd className="font-medium text-gray-900">
                    {state.treatment.frequency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Duration:</dt>
                  <dd className="font-medium text-gray-900">
                    {state.treatment.duration} days
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Quantity supplied:</dt>
                  <dd className="font-medium text-gray-900">
                    {state.treatment.quantity}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-4">
              <TextInput
                label="Batch number"
                value={state.treatment.batchNumber}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, batchNumber: v },
                  }))
                }
                placeholder="e.g., LOT123456"
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, expiryDate: v },
                  }))
                }
                required
              />
            </div>
          </div>
        )}

        {/* Step 4: Counselling */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Confirm that the following counselling points have been provided
              to the patient:
            </p>
            <div className="space-y-3">
              <Checkbox
                label="Warm drops to body temperature before use (hold container in hand for a minute)"
                checked={state.counselling.warmDrops}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, warmDrops: v },
                  }))
                }
              />
              <Checkbox
                label="Lie on side with affected ear facing upwards"
                checked={state.counselling.liedPosition}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, liedPosition: v },
                  }))
                }
              />
              <Checkbox
                label="Instil drops gently into the ear canal and remain lying for 5 minutes"
                checked={state.counselling.instilTechnique}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, instilTechnique: v },
                  }))
                }
              />
              <Checkbox
                label="Complete the full 7-day course even if symptoms improve"
                checked={state.counselling.completeCourse}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, completeCourse: v },
                  }))
                }
              />
              <Checkbox
                label="Avoid getting water in the ear during treatment"
                checked={state.counselling.avoidWater}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, avoidWater: v },
                  }))
                }
              />
              <Checkbox
                label="Advised when to seek further medical advice (worsening symptoms, no improvement after 48 hours, fever, or if symptoms persist)"
                checked={state.counselling.seekAdvice}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    counselling: { ...prev.counselling, seekAdvice: v },
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Pharmacist details
              </h3>
              <div className="space-y-3">
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
                  label="GPhC registration number"
                  value={state.summary.pharmacistGPhC}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, pharmacistGPhC: v },
                    }))
                  }
                  required
                  placeholder="e.g., 2123456"
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
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Consultation details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {state.summary.consultationDate}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {state.summary.consultationTime}
                  </p>
                </div>
              </div>
            </div>

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
              placeholder="Record any additional clinical notes or observations..."
            />
          </div>
        )}

        {/* Step 6: Consultation Complete */}
        {currentStep === 6 && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-4xl text-green-600 mb-2">✓</div>
            <p className="text-lg font-semibold text-green-900 mb-2">
              Consultation Record Complete
            </p>
            <p className="text-sm text-green-700">
              The ear infection ePGD consultation for Cetraxal (Ciprofloxacin
              0.2% ear drops) has been successfully recorded.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
