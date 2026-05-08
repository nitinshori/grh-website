"use client";

import { useState, useCallback, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, TextArea } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
export default function AlopeciaMinoxidilClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
  });

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);

  const handleNext = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, 6)), []);
  const handlePrev = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

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
      <StepWrapper title={["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Complete"][currentStep]} currentStep={currentStep} totalSteps={7} onNext={handleNext} onPrev={handlePrev} canProceed={true} validationError={null} getConsultationData={getConsultationData}>
        {currentStep === 0 && <PatientDetailsStep patient={state.patient} onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))} />}
        {currentStep === 1 && <ConsentStep consent={state.consent} onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))} />}
        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))} rows={3} />
          </div>
        )}
        {currentStep === 6 && <div className="p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm font-semibold text-green-900">Consultation Record Complete</p></div>}
      </StepWrapper>
    </div>
  );
}
