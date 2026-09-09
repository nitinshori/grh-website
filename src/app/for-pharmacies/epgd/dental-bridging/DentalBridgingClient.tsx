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
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      painType: "",
      painDuration: "",
      painSeverity: "",
      localisedSwelling: false,
      pusDischarge: false,
      // ── Signs of SPREADING or SYSTEMIC infection ──────────────────────
      // Under v004 these are what makes an antibiotic indicated. Under v003
      // they were exclusions, which is why the indication was inverted.
      facialSwelling: false,
      lymphadenopathy: false,
      malaise: false,
      cellulitis: false,
      temperature38: false,
      // ── Higher risk of complications even if localised (CKS) ──────────
      immunosuppressed: false,
      poorlyControlledDiabetes: false,
      // ── EMERGENCY red flags: 999 or same-day, never a supply ──────────
      difficultSwallowingBreathing: false,
      floorOfMouthSwelling: false,
      trismus: false,
      periorbital: false,
      rapidlySpreading: false,
      sepsisSigns: false,
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
      // v004 supplies no analgesia. v003 offered ibuprofen and paracetamol
      // as "OTC Analgesics (Recommended)" while the document said ibuprofen
      // is not supplied under this PGD. Recorded now as advice given and a
      // pharmacy sale under the pharmacy's own protocol, which is what the
      // document actually authorises.
      analgesiaAdviceGiven: false,
      analgesiaSoldUnderProtocol: "",
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


  // ── Which of the three outcomes applies ───────────────────────────────
  //
  // Aligned to signed document v004 (9 Sep 2026). v003 had the indication
  // inverted: it required the ABSENCE of swelling, fever and systemic
  // features, so it authorised an antibiotic for the cohort SDCEP and NICE
  // CKS say should not receive one, and referred the cohort that is the
  // actual indication. This tool followed the same shape: fever was an
  // advisory "red flag" rather than anything that changed the outcome.
  //
  // v004: decide the outcome FIRST, then consider a medicine.
  const emergency = useMemo(() => {
    const a = state.assessment;
    return (
      a.difficultSwallowingBreathing ||
      a.floorOfMouthSwelling ||
      a.trismus ||
      a.periorbital ||
      a.rapidlySpreading ||
      a.sepsisSigns
    );
  }, [state.assessment]);

  const spreadingOrSystemic = useMemo(() => {
    const a = state.assessment;
    return a.facialSwelling || a.lymphadenopathy || a.malaise || a.cellulitis || a.temperature38;
  }, [state.assessment]);

  const higherRisk = useMemo(
    () => state.assessment.immunosuppressed || state.assessment.poorlyControlledDiabetes,
    [state.assessment]
  );

  const outcome = useMemo<"emergency" | "no-antibiotic" | "bridge">(() => {
    if (emergency) return "emergency";
    if (spreadingOrSystemic || higherRisk) return "bridge";
    return "no-antibiotic";
  }, [emergency, spreadingOrSystemic, higherRisk]);

  const clinicalAlerts = useMemo<ClinicalAlert[]>(() => {
    const alerts: ClinicalAlert[] = [];
    const a = state.assessment;

    // ── Outcome 3: emergency ────────────────────────────────────────────
    if (a.difficultSwallowingBreathing) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_AIRWAY",
        message: "EMERGENCY: call 999 now",
        detail:
          "Difficulty swallowing or breathing, or a change in the voice, suggests airway involvement or Ludwig's angina. Call 999. Do not supply an antibiotic and do not let arranging one delay the call.",
      });
    }
    if (a.floorOfMouthSwelling) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_LUDWIG",
        message: "EMERGENCY: call 999 now",
        detail:
          "Swelling of the floor of the mouth, or a raised or displaced tongue, suggests Ludwig's angina. Call 999.",
      });
    }
    if (a.trismus) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_TRISMUS",
        message: "Emergency: same-day assessment, do not supply",
        detail:
          "The patient cannot open their mouth more than about two finger widths. This suggests deep space infection. Same-day emergency assessment, not a dental appointment and not an antibiotic. v003 treated this as an advisory note only.",
      });
    }
    if (a.periorbital) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_PERIORBITAL",
        message: "Emergency: same-day assessment, do not supply",
        detail:
          "Swelling closing the eye, eye pain, double vision or reduced vision indicates periorbital or orbital involvement. Same-day emergency assessment.",
      });
    }
    if (a.rapidlySpreading) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_SPREADING",
        message: "Emergency: same-day assessment, do not supply",
        detail: "Rapidly spreading swelling, or swelling extending down the neck. Same-day emergency assessment.",
      });
    }
    if (a.sepsisSigns) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_SEPSIS",
        message: "EMERGENCY: possible sepsis",
        detail:
          "Rigors, confusion, very rapid breathing or heart rate, mottled or ashen skin, or not passing urine. Treat as sepsis and escalate immediately.",
      });
    }

    // ── Outcome 1: localised, no antibiotic indicated ───────────────────
    if (outcome === "no-antibiotic") {
      alerts.push({
        severity: "stop",
        code: "LOCALISED_NO_ANTIBIOTIC",
        message: "Localised infection: an antibiotic is NOT indicated",
        detail:
          "No sign of spreading or systemic infection, and no higher-risk factor. SDCEP and NICE CKS are consistent that antibiotics are not indicated for a localised dental infection in an otherwise healthy patient: the infection is being contained, and the abscess is largely walled off from the circulation so very little antibiotic reaches it. Give analgesia advice, sell analgesia under the pharmacy's own protocol if needed, and arrange urgent dental care. This is the service working correctly, not a refusal.",
      });
    }

    // ── Outcome 2: the bridging cohort ──────────────────────────────────
    if (outcome === "bridge") {
      alerts.push({
        severity: "caution",
        code: "BRIDGE_INDICATED",
        message: higherRisk && !spreadingOrSystemic
          ? "Higher-risk patient: bridging antibiotic may be supplied"
          : "Spreading or systemic infection: bridging antibiotic indicated",
        detail:
          "Supply under this PGD AND arrange an urgent dental appointment within 24 to 48 hours. The antibiotic is a bridge: it does not drain the infection or remove the cause. Record which sign of spread, or which higher-risk factor, justified the supply.",
      });
    }

    // ── Arm selection and arm-specific exclusions ───────────────────────
    if (a.penicillinAllergy && a.metronidazoleAllergy) {
      alerts.push({
        severity: "stop",
        code: "UNSUITABLE_BOTH_ALLERGIES",
        message: "No arm available: refer",
        detail: "Allergic to both penicillin and metronidazole. Refer for dental assessment and alternative management.",
      });
    } else if (a.penicillinAllergy) {
      alerts.push({
        severity: "caution",
        code: "PENICILLIN_ALLERGY_METRONIDAZOLE",
        message: "Penicillin allergy: metronidazole arm applies",
        detail:
          "Metronidazole 200mg three times daily for 5 days. NOT 400mg: 200mg is the licensed dose for acute dental infection and this PGD stays within the licence. Confirm the patient can avoid alcohol completely during the course and for 48 hours afterwards.",
      });
    }

    // Metronidazole arm exclusions. These are exclusions in v004, not
    // cautions: v003's tool listed warfarin as a caution to "inform the GP".
    if (a.penicillinAllergy && a.warfarin) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_WARFARIN",
        message: "Warfarin excludes the metronidazole arm",
        detail:
          "Metronidazole potentiates warfarin and other coumarins. This is an exclusion under v004, not a caution. Refer. The same applies to lithium, disulfiram, busulfan, 5-fluorouracil, ciclosporin, phenytoin, phenobarbital and QT-prolonging medicines.",
      });
    }
    if (a.penicillinAllergy && (a.pregnancy || a.breastfeeding)) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_PREGNANCY",
        message: "Pregnancy or breastfeeding excludes the metronidazole arm",
        detail:
          "The SPC advises metronidazole should not be given in pregnancy or lactation unless considered essential, which is a prescriber judgement and not a PGD one. Refer. Say plainly that the issue is the antibiotic and not the dental problem.",
      });
    }

    // Amoxicillin arm: pregnancy and breastfeeding PERMIT supply. v003
    // deleted these statements from the document altogether, and the tool
    // said metronidazole "should be avoided in first trimester", which is
    // not the position either the SPC or this PGD takes.
    if (!a.penicillinAllergy && (a.pregnancy || a.breastfeeding)) {
      alerts.push({
        severity: "caution",
        code: "AMOXICILLIN_PREGNANCY_OK",
        message: "Amoxicillin may be supplied in pregnancy and breastfeeding",
        detail:
          "Amoxicillin is well established in pregnancy and is the usual choice where an antibiotic is indicated. Small amounts appear in breast milk; that is not a reason to withhold it or to interrupt feeding.",
      });
    }

    if (a.otherAntibiotics) {
      alerts.push({
        severity: "stop",
        code: "CONCURRENT_ANTIBIOTICS",
        message: "Already taking an antibiotic: do not supply",
        detail:
          "An antibiotic already taken for this or any other indication is an exclusion under this PGD. One supply per episode. Refer.",
      });
    }

    return alerts;
  }, [state.assessment, outcome, higherRisk, spreadingOrSystemic]);

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
    // v004 authorises two arms: amoxicillin first line, metronidazole for
    // penicillin allergy. The comment that used to sit here said amoxicillin
    // was the only authorised antibiotic, directly above code selecting
    // metronidazole. It was left behind when the second arm was added.
    if (state.assessment.penicillinAllergy) {
      return "Metronidazole 200mg TDS";
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
            {/* ──────────────────────────────────────────────────────────
                Order matters here, and it is the order of signed document
                v004: emergency red flags, then spread, then higher risk.
                v003 asked about swelling and fever as things that STOPPED a
                supply, which inverted the indication. Under v004 they are
                what makes an antibiotic indicated at all.
               ────────────────────────────────────────────────────────── */}
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg space-y-3">
              <h3 className="text-base font-semibold text-red-900">
                Step 1. Emergency red flags. Any one of these is 999 or same-day care, never a supply.
              </h3>
              <Checkbox
                label="Difficulty breathing or swallowing, drooling, or any change in the voice"
                checked={state.assessment.difficultSwallowingBreathing}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, difficultSwallowingBreathing: v } }))}
                description="Call 999."
              />
              <Checkbox
                label="Swelling of the floor of the mouth, or a raised or displaced tongue"
                checked={state.assessment.floorOfMouthSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, floorOfMouthSwelling: v } }))}
                description="Suggests Ludwig's angina. Call 999."
              />
              <Checkbox
                label="Trismus: cannot open the mouth more than about two finger widths"
                checked={state.assessment.trismus}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, trismus: v } }))}
                description="Same-day emergency assessment. Earlier versions treated this as an advisory note only."
              />
              <Checkbox
                label="Periorbital or orbital involvement: swelling closing the eye, eye pain, double or reduced vision"
                checked={state.assessment.periorbital}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, periorbital: v } }))}
                description="Same-day emergency assessment."
              />
              <Checkbox
                label="Rapidly spreading swelling, or swelling extending down the neck"
                checked={state.assessment.rapidlySpreading}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, rapidlySpreading: v } }))}
              />
              <Checkbox
                label="Signs of sepsis: rigors, confusion, very rapid breathing or heart rate, mottled skin, not passing urine"
                checked={state.assessment.sepsisSigns}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, sepsisSigns: v } }))}
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
              <h3 className="text-base font-semibold text-amber-900">
                Step 2. Is the infection spreading, or is the patient systemically involved?
              </h3>
              <p className="text-xs text-amber-900">
                This is the question that decides whether an antibiotic is indicated at all. If none of
                these is present and the patient is not at higher risk, an antibiotic is NOT indicated:
                analgesia advice and urgent dental care are the correct answer.
              </p>
              <Checkbox
                label="Temperature 38C or above"
                checked={state.assessment.temperature38}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, temperature38: v } }))}
              />
              <Checkbox
                label="Facial swelling, or swelling beyond the tooth and its immediate gum"
                checked={state.assessment.facialSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, facialSwelling: v } }))}
                description="Tick this only where no emergency red flag above applies."
              />
              <Checkbox
                label="Regional lymphadenopathy: tender, enlarged nodes in the neck or under the jaw"
                checked={state.assessment.lymphadenopathy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, lymphadenopathy: v } }))}
              />
              <Checkbox
                label="Cellulitis: diffuse redness and swelling spreading into the soft tissues"
                checked={state.assessment.cellulitis}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, cellulitis: v } }))}
              />
              <Checkbox
                label="Malaise, rigors, or feeling generally unwell"
                checked={state.assessment.malaise}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, malaise: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Step 3. Higher risk of complications, even if the infection looks localised
              </h3>
              <Checkbox
                label="Significant immunosuppression"
                checked={state.assessment.immunosuppressed}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, immunosuppressed: v } }))}
                description="A bridging antibiotic may be supplied for an apparently localised infection. Record the reason."
              />
              <Checkbox
                label="Poorly controlled diabetes"
                checked={state.assessment.poorlyControlledDiabetes}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, poorlyControlledDiabetes: v } }))}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Local findings, for the record</h3>
              <Checkbox
                label="Localised swelling of the gum next to the tooth"
                checked={state.assessment.localisedSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, localisedSwelling: v } }))}
              />
              <Checkbox
                label="Purulent discharge from the gum"
                checked={state.assessment.pusDischarge}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pusDischarge: v } }))}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pain assessment, for the record</h3>
              <SelectInput
                label="Type of dental pain"
                value={state.assessment.painType}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painType: v } }))}
                options={[
                  { value: "", label: "Select..." },
                  { value: "toothache", label: "Toothache" },
                  { value: "abscess", label: "Abscess" },
                  { value: "swelling", label: "Swelling of gum or face" },
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
                  { value: "1-3d", label: "1 to 3 days" },
                  { value: "3-7d", label: "3 to 7 days" },
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
              <h3 className="text-lg font-semibold text-gray-900">Allergies, medicines and pregnancy</h3>
              <Checkbox
                label="Penicillin or beta-lactam allergy"
                checked={state.assessment.penicillinAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, penicillinAllergy: v } }))}
                description="Routes to the metronidazole arm. Record the allergy history in the patient's own words."
              />
              <Checkbox
                label="Metronidazole or nitroimidazole allergy"
                checked={state.assessment.metronidazoleAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, metronidazoleAllergy: v } }))}
              />
              <Checkbox
                label="Taking warfarin or another coumarin, lithium, disulfiram, phenytoin or a QT-prolonging medicine"
                checked={state.assessment.warfarin}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, warfarin: v } }))}
                description="Excludes the metronidazole arm under v004. Not relevant to amoxicillin."
              />
              <Checkbox
                label="Pregnant"
                checked={state.assessment.pregnancy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnancy: v } }))}
                description="Amoxicillin may be supplied. Metronidazole is excluded."
              />
              <Checkbox
                label="Breastfeeding"
                checked={state.assessment.breastfeeding}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, breastfeeding: v } }))}
                description="Amoxicillin may be supplied. Metronidazole is excluded."
              />
              <Checkbox
                label="Already taking an antibiotic, for this or any other indication"
                checked={state.assessment.otherAntibiotics}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, otherAntibiotics: v } }))}
                description="Exclusion. One supply per episode."
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dental care</h3>
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
                  // 200mg, the licensed dose for acute dental infection. The
                  // 400mg option this tool used to carry is off-label for this
                  // indication and is deliberately not offered.
                  { value: "Metronidazole 200mg TDS", label: "Metronidazole 200mg TDS (5 days), penicillin allergy" },
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
              <h3 className="text-lg font-semibold text-gray-900">Analgesia</h3>
              <p className="text-xs text-gray-600">
                This PGD supplies no analgesia. Where the patient needs pain relief, sell it as a
                pharmacy medicine under the pharmacy&apos;s own protocol and record that you did.
                Earlier versions of this tool offered ibuprofen and paracetamol here as
                &quot;recommended&quot;, while the signed document said ibuprofen is not supplied
                under this PGD.
              </p>
              <Checkbox
                label="Analgesia advice given"
                checked={state.treatment.analgesiaAdviceGiven}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, analgesiaAdviceGiven: v } }))}
              />
              <TextInput
                label="Analgesia sold under the pharmacy's own protocol (if any)"
                value={state.treatment.analgesiaSoldUnderProtocol}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, analgesiaSoldUnderProtocol: v } }))}
                placeholder="e.g. paracetamol 500mg, 32 tablets"
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
                <li>• For pain relief, ask us: we can sell you something suitable over the counter</li>
                <li>• THIS IS A BRIDGE, NOT A CURE. You still need an urgent dental appointment within 24 to 48 hours. The antibiotic cannot drain the abscess or fix the tooth</li>
                <li>• Seek urgent help the same day if the swelling spreads, your eye starts to close, you cannot open your mouth properly, or you feel much worse. Call 999 for any difficulty swallowing or breathing</li>
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
