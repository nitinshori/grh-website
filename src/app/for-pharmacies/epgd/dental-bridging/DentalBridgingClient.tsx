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
export default function DentalBridgingClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      painType: "",
      painDuration: "",
      painSeverity: "",
      localisedSwelling: false,
      pusDischarge: false,
      facialSwelling: false,
      difficultSwallowingBreathing: false,
      trismus: false,
      temperature38: false,
      penicillinAllergy: false,
      metronidazoleAllergy: false,
      warfarin: false,
      pregnancy: false,
      breastfeeding: false,
      otherAntibiotics: false,
      dentalAppointmentBooked: false,
      dentalAppointmentDate: "",
    },
    treatment: {
      antibiotic: "",
      quantity: 15 as number | null,
      batchNumber: "",
      expiryDate: "",
      paracetamol: false,
      ibuprofen: false,
    },
    counselling: {
      counsellingAcknowledged: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
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


  const clinicalAlerts = useMemo<ClinicalAlert[]>(() => {
    const alerts: ClinicalAlert[] = [];

    if (state.assessment.difficultSwallowingBreathing) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_REFERRAL",
        message: "Emergency Referral Required",
        detail: "Facial swelling with difficulty swallowing or breathing suggests Ludwig's angina. Refer immediately to emergency services (999).",
      });
    }

    if (state.assessment.penicillinAllergy && state.assessment.metronidazoleAllergy) {
      alerts.push({
        severity: "stop",
        code: "UNSUITABLE_BOTH_ALLERGIES",
        message: "Unsuitable for Bridging Treatment",
        detail: "Patient is allergic to both penicillin and metronidazole. Refer to dentist immediately for alternative management.",
      });
    }

    if (state.assessment.trismus) {
      alerts.push({
        severity: "red-flag",
        code: "TRISMUS_LIMITED_OPENING",
        message: "Red Flag: Limited Mouth Opening",
        detail: "Trismus (difficulty opening mouth) may indicate deeper infection. Ensure urgent dental assessment is arranged.",
      });
    }

    if (state.assessment.temperature38) {
      alerts.push({
        severity: "red-flag",
        code: "ELEVATED_TEMPERATURE",
        message: "Red Flag: Elevated Temperature",
        detail: "Temperature >38°C indicates systemic infection. Urgent dental assessment required. Advise patient to monitor temperature.",
      });
    }

    if (state.assessment.warfarin) {
      alerts.push({
        severity: "caution",
        code: "WARFARIN_INTERACTION",
        message: "Drug Interaction: Warfarin",
        detail: "Metronidazole may increase warfarin effect. Ensure GP is informed and INR monitoring arranged if prescribed.",
      });
    }

    if (state.assessment.pregnancy) {
      alerts.push({
        severity: "caution",
        code: "PREGNANCY_CONSIDERATION",
        message: "Pregnancy Consideration",
        detail: "Amoxicillin is safe. Metronidazole should be avoided in first trimester. Confirm treatment appropriately.",
      });
    }

    if (state.assessment.breastfeeding) {
      alerts.push({
        severity: "caution",
        code: "BREASTFEEDING_COMPAT",
        message: "Breastfeeding",
        detail: "Both amoxicillin and metronidazole are compatible with breastfeeding but present in breast milk.",
      });
    }

    if (state.assessment.otherAntibiotics) {
      alerts.push({
        severity: "caution",
        code: "CONCURRENT_ANTIBIOTICS",
        message: "Concurrent Antibiotic Use",
        detail: "Patient already taking other antibiotics. Verify compatibility and avoid duplication of therapy.",
      });
    }

    return alerts;
  }, [state.assessment]);

  const hasStopAlerts = clinicalAlerts.some(a => a.severity === "stop");
  const canProceedFromAssessment = !hasStopAlerts && !!state.assessment.painType && !!state.assessment.painDuration && !!state.assessment.painSeverity;

  const handleNext = useCallback(() => {
    if (currentStep === 2 && hasStopAlerts) return;
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [currentStep, hasStopAlerts]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const selectedAntibiotic = useMemo(() => {
    if (state.assessment.penicillinAllergy) {
      return "Metronidazole 400mg TDS";
    }
    return "Amoxicillin 500mg TDS";
  }, [state.assessment.penicillinAllergy]);

  useEffect(() => {
    if (currentStep === 3 && !state.treatment.antibiotic) {
      setState(prev => ({
        ...prev,
        treatment: { ...prev.treatment, antibiotic: selectedAntibiotic },
      }));
    }
  }, [currentStep, selectedAntibiotic, state.treatment.antibiotic]);

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
      <ProgressBar current={currentStep + 1} total={7} />

      {currentStep === 2 && clinicalAlerts.length > 0 && (
        <AlertBanner alerts={clinicalAlerts} />
      )}

      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={currentStep === 2 ? canProceedFromAssessment : true}
        validationError={currentStep === 2 && !canProceedFromAssessment ? "Complete required fields and resolve clinical alerts" : null}
       getConsultationData={getConsultationData}>
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState(prev => ({
                ...prev,
                patient: { ...prev.patient, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              setState(prev => ({
                ...prev,
                consent: { ...prev.consent, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pain Assessment</h3>
              <SelectInput
                label="Type of dental pain"
                value={state.assessment.painType}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painType: v } }))}
                options={[
                  { value: "", label: "Select..." },
                  { value: "toothache", label: "Toothache" },
                  { value: "abscess", label: "Abscess" },
                  { value: "swelling", label: "Swelling of gum/face" },
                  { value: "post-extraction", label: "Post-extraction pain" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
              <SelectInput
                label="Duration of symptoms"
                value={state.assessment.painDuration}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painDuration: v } }))}
                options={[
                  { value: "", label: "Select..." },
                  { value: "<24h", label: "Less than 24 hours" },
                  { value: "1-3d", label: "1-3 days" },
                  { value: "3-7d", label: "3-7 days" },
                  { value: ">7d", label: "More than 7 days" },
                ]}
                required
              />
              <SelectInput
                label="Severity of pain"
                value={state.assessment.painSeverity}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painSeverity: v } }))}
                options={[
                  { value: "", label: "Select..." },
                  { value: "mild", label: "Mild" },
                  { value: "moderate", label: "Moderate" },
                  { value: "severe", label: "Severe" },
                ]}
                required
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Signs of Dental Abscess</h3>
              <Checkbox
                label="Localised swelling"
                checked={state.assessment.localisedSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, localisedSwelling: v } }))}
              />
              <Checkbox
                label="Pus discharge"
                checked={state.assessment.pusDischarge}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pusDischarge: v } }))}
              />
              <Checkbox
                label="Facial swelling"
                checked={state.assessment.facialSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, facialSwelling: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Red Flags</h3>
              <Checkbox
                label="Facial swelling with difficulty swallowing or breathing"
                checked={state.assessment.difficultSwallowingBreathing}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, difficultSwallowingBreathing: v } }))}
              />
              <Checkbox
                label="Trismus (difficulty opening mouth)"
                checked={state.assessment.trismus}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, trismus: v } }))}
              />
              <Checkbox
                label="Temperature >38°C"
                checked={state.assessment.temperature38}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, temperature38: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Allergies</h3>
              <Checkbox
                label="Known allergy to penicillin"
                checked={state.assessment.penicillinAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, penicillinAllergy: v } }))}
              />
              <Checkbox
                label="Known allergy to metronidazole"
                checked={state.assessment.metronidazoleAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, metronidazoleAllergy: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Other Medical Factors</h3>
              <Checkbox
                label="Currently taking warfarin or other anticoagulants"
                checked={state.assessment.warfarin}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, warfarin: v } }))}
              />
              <Checkbox
                label="Pregnant"
                checked={state.assessment.pregnancy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnancy: v } }))}
              />
              <Checkbox
                label="Breastfeeding"
                checked={state.assessment.breastfeeding}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, breastfeeding: v } }))}
              />
              <Checkbox
                label="Currently taking any other antibiotics"
                checked={state.assessment.otherAntibiotics}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, otherAntibiotics: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Dental Care</h3>
              <Checkbox
                label="Patient already has a dental appointment booked"
                checked={state.assessment.dentalAppointmentBooked}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, dentalAppointmentBooked: v } }))}
              />
              {state.assessment.dentalAppointmentBooked && (
                <TextInput
                  label="Appointment date"
                  type="date"
                  value={state.assessment.dentalAppointmentDate}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, dentalAppointmentDate: v } }))}
                />
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Bridging Treatment Notice:</strong> This is bridging treatment only. The patient MUST see a dentist to address the underlying cause.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Antibiotic Prescription</h3>
              <SelectInput
                label="Antibiotic"
                value={state.treatment.antibiotic}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, antibiotic: v } }))}
                options={[
                  { value: "Amoxicillin 500mg TDS", label: "Amoxicillin 500mg TDS (5 days)" },
                  { value: "Metronidazole 400mg TDS", label: "Metronidazole 400mg TDS (5 days)" },
                ]}
                required
                disabled
              />
              <NumberInput
                label="Quantity (capsules/tablets)"
                value={state.treatment.quantity}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, quantity: v } }))}
                min={1}
                required
              />
              <TextInput
                label="Batch number"
                value={state.treatment.batchNumber}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, batchNumber: v } }))}
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, expiryDate: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">OTC Analgesics (Recommended)</h3>
              <Checkbox
                label="Paracetamol 1g QDS"
                checked={state.treatment.paracetamol}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, paracetamol: v } }))}
              />
              <Checkbox
                label="Ibuprofen 400mg TDS"
                checked={state.treatment.ibuprofen}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, ibuprofen: v } }))}
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Patient Counselling Points</h3>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>• Complete the full antibiotic course even if feeling better</li>
                <li>• Take antibiotic with or after food</li>
                {state.treatment.antibiotic.includes("Amoxicillin") && (
                  <>
                    <li>• May cause diarrhoea or nausea; take with food if stomach upset</li>
                    <li>• Report severe diarrhoea to GP</li>
                  </>
                )}
                {state.treatment.antibiotic.includes("Metronidazole") && (
                  <>
                    <li>• Strictly avoid alcohol during treatment and 48 hours after finishing</li>
                    <li>• May cause metallic taste or nausea</li>
                    <li>• Do not drive if feeling dizzy</li>
                  </>
                )}
                <li>• Use OTC paracetamol or ibuprofen regularly for pain relief</li>
                <li>• Arrange urgent dental appointment — antibiotics do not fix the underlying problem</li>
                <li>• Return immediately if facial swelling worsens, difficulty swallowing/breathing develops, or fever returns</li>
                <li>• Register with NHS dentist if not already registered</li>
              </ul>
            </div>

            <Checkbox
              label="Patient counselling acknowledged"
              checked={state.counselling.counsellingAcknowledged}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, counsellingAcknowledged: v } }))}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))}
              required
            />
            <TextInput
              label="GPhC registration"
              value={state.summary.pharmacistGPhC}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))}
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))}
            />
            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))}
              rows={3}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Dental Pain Bridging Consultation Complete</p>
            <p className="text-sm text-green-800 mt-2">
              Patient has received bridging treatment with antibiotic and counselling. Urgent dental appointment required.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
