"use client";
import type { PeriodDelayConsultationState } from "../lib/period-delay-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";
import { calculateBmi, isPregnancyExcluded, MAX_TREATMENT_DAYS } from "../lib/period-delay-clinical-logic";

function yesNo(v: boolean | null): string {
  return v === null ? "Not asked" : v ? "Yes" : "No";
}

export function PeriodDelaySummaryReport({ state }: { state: PeriodDelayConsultationState }) {
  const bmi = calculateBmi(state.medicalHistory.heightCm, state.medicalHistory.weightKg);
  const days = state.medicineSelection.daysToDelay;
  const stopped = state.alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && Boolean(state.doseRecommendation) && days !== null && days > 0;
  const a1 = state.medicalHistory.appendix1;
  const pregnancyExcludedBy = state.assessment.lastPeriodNormalOnTime && state.assessment.noUnprotectedSexSince
    ? "History: last period normal and on time, no unprotected sex since"
    : state.assessment.pregnancyTestNegative
      ? `Negative pregnancy test on ${state.assessment.pregnancyTestDate || "date not recorded"} (last unprotected sex ${state.assessment.lastUpsiDate || "date not recorded"})`
      : "Not excluded";
  const smokingStatus = state.medicalHistory.currentSmoker
    ? `Current smoker${state.medicalHistory.cigarettesPerDay !== null ? `, ${state.medicalHistory.cigarettesPerDay} a day` : ""}`
    : state.medicalHistory.stoppedSmokingUnderOneYear
      ? "Stopped smoking less than a year ago"
      : state.medicalHistory.stoppedSmokingOverOneYear
        ? "Stopped smoking a year or more ago"
        : "Non-smoker";
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Period Delay ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Period Delay (Norethisterone) PGD, version 009, issued 11 September 2026. Norethisterone 5mg tablets, short-term delay of menstruation</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth || "Not recorded"} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="Female confirmed" value={state.medicalHistory.femaleConfirmed ? "Yes" : "No"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        <Row label="GP" value={state.patient.gpName || state.patient.gpPractice ? `${state.patient.gpName} ${state.patient.gpPractice}`.trim() : "Not recorded"} />
        <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
      </div>
      <SectionHeader>Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Reason for delay" value={`${state.assessment.reasonForDelay || "Not recorded"}${state.assessment.reasonDetails ? `: ${state.assessment.reasonDetails}` : ""}`} />
        <Row label="Dates needed for" value={state.assessment.datesNeededFor || "Not recorded"} />
        <Row label="Last period started" value={state.assessment.lastPeriodDate || "Not recorded"} />
        <Row label="Regular, predictable cycle" value={state.assessment.cycleRegular ? "Yes" : "No"} />
        <Row label="Next period due" value={state.assessment.expectedPeriodDate || "Not recorded"} />
        <Row label="Days until expected period" value={state.assessment.daysUntilExpected?.toString() || "Not recorded"} />
        <Row label="How pregnancy was excluded" value={isPregnancyExcluded(state) ? pregnancyExcludedBy : "Not excluded"} />
        <Row label="Previous use of norethisterone" value={state.assessment.previousUse ? `Yes${state.assessment.previousIssues ? `: ${state.assessment.previousIssues}` : ""}` : "No"} />
        <Row label="Previous supplies for period delay in last 6 months" value={state.assessment.previousSuppliesLast6Months || "Not recorded"} />
        {state.assessment.daysSuppliedLast6Months !== null && (
          <Row label="Days supplied in last 6 months" value={`${state.assessment.daysSuppliedLast6Months} days`} />
        )}
      </div>
      <SectionHeader>Venous Thromboembolism Gate (Appendix 1)</SectionHeader>
      <div className="space-y-1.5">
        <Row label="1. DVT or venous clot" value={yesNo(a1.q1Dvt)} />
        <Row label="1. Pulmonary embolism" value={yesNo(a1.q1Pe)} />
        <Row label="1. Stroke or TIA" value={yesNo(a1.q1Stroke)} />
        <Row label="1. Heart attack or arterial disease" value={yesNo(a1.q1Arterial)} />
        <Row label="2. Thrombophilia or family clot under 45" value={yesNo(a1.q2Thrombophilia)} />
        <Row label="3. Current smoker" value={yesNo(a1.q3CurrentSmoker)} />
        <Row label="3. Stopped smoking less than a year ago" value={a1.q3CurrentSmoker === true ? "Not applicable" : yesNo(a1.q3StoppedUnderOneYear)} />
        <Row label="3. Smoking status as recorded" value={smokingStatus} />
        <Row label="4. Height and weight" value={state.medicalHistory.heightCm !== null && state.medicalHistory.weightKg !== null ? `${state.medicalHistory.heightCm} cm, ${state.medicalHistory.weightKg} kg` : "Not recorded"} />
        <Row label="BMI" value={bmi !== null ? `${bmi.toFixed(1)} kg/m2` : "Not calculated"} />
        <Row label="5. Journey of 4 hours or more during or within 2 weeks of the course" value={yesNo(a1.q5LongJourney)} />
        <Row label="6. Surgery under GA in last 6 weeks or planned" value={yesNo(a1.q6Surgery)} />
        <Row label="7. Current or expected immobility" value={yesNo(a1.q7Immobility)} />
        <Row label="8. Cancer now or treated in last 12 months" value={yesNo(a1.q8Cancer)} />
      </div>
      <SectionHeader>Medical History & Other Exclusions</SectionHeader>
      <CounsellingGrid items={[
        ["Known or suspected pregnancy", state.medicalHistory.pregnancy],
        ["Breastfeeding", state.medicalHistory.breastfeeding],
        ["Liver disease, jaundice in pregnancy or liver tumour", state.medicalHistory.liverDisease || state.medicalHistory.jaundiceInPregnancy],
        ["Hormone sensitive or breast cancer", state.medicalHistory.activeBreastCancer],
        ["BRCA1/BRCA2 carrier", state.medicalHistory.brcaCarrier],
        ["Undiagnosed, intermenstrual or post-coital bleeding", state.medicalHistory.abnormalVaginalBleeding],
        ["Migraine with aura or focal symptoms", state.medicalHistory.migraineWithAura],
        ["Acute porphyria or severe pruritus in pregnancy", state.medicalHistory.porphyria || state.medicalHistory.severePruritusInPregnancy],
        ["Hypersensitivity to norethisterone", state.medicalHistory.hypersensitivity],
        ["Diabetes with vascular complications", state.medicalHistory.diabetesWithVascularComplications],
        ["Hypertension (any grade) or hypertension in pregnancy", state.medicalHistory.hypertension],
        ["AF, valvular or congenital heart disease", state.medicalHistory.atrialFibrillationOrValvularDisease],
        ["SLE or antiphospholipid", state.medicalHistory.sleOrAntiphospholipid],
        ["Dyslipidaemia with another risk factor", state.medicalHistory.dyslipidaemiaWithRiskFactor],
        ["Enzyme inducing medicine", state.medicalHistory.enzymeInducer],
        ["Ciclosporin", state.medicalHistory.ciclosporin || state.medications.ciclosporin],
        ["Lamotrigine monotherapy", state.medicalHistory.lamotrigineMonotherapy],
        ["Hormonal contraception", state.medicalHistory.hormonalContraception],
        ["History of depression (counselled)", state.medicalHistory.historyOfDepression],
        ["Current severe depression or suicidal ideation", state.medicalHistory.severeDepressionOrSuicidalIdeation],
      ]} />
      <div className="space-y-1.5">
        <Row label="Blood pressure today" value={state.medicalHistory.systolicBP !== null && state.medicalHistory.diastolicBP !== null ? `${state.medicalHistory.systolicBP}/${state.medicalHistory.diastolicBP} mmHg` : "Not recorded"} />
        {state.medications.otherMedications && <Row label="Other medications" value={state.medications.otherMedications} />}
        {state.medications.allergies && <Row label="Allergies" value={state.medications.allergies} />}
      </div>
      {state.patient.age !== null && state.patient.age >= 16 && state.patient.age < 18 && (
        <>
          <SectionHeader>Patient aged 16 or 17: Competence and Safeguarding</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Competence assessed and satisfied" value={state.medicalHistory.under18AssessmentDone ? "Yes" : "No"} />
            <Row label="Safeguarding concern" value={state.medicalHistory.safeguardingConcern ? "Yes, local safeguarding route followed" : "None identified"} />
            <Row label="Assessment in full" value={state.medicalHistory.under18AssessmentNotes || "Not recorded"} />
          </div>
        </>
      )}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      <SectionHeader>Treatment Plan</SectionHeader>
      {supplied && state.doseRecommendation ? (
        <div className="space-y-1.5">
          <Row label="Medicine" value={state.doseRecommendation.medicine} />
          <Row label="Dose" value={state.doseRecommendation.dose} />
          <Row label="Frequency" value={state.doseRecommendation.frequency} />
          <Row label="Start date" value={state.medicineSelection.startDate || "Not recorded"} />
          <Row label="Days supplied" value={days !== null ? `${days} days` : "Not recorded"} />
          <Row label="Tablets supplied" value={days !== null ? `${Math.min(days, MAX_TREATMENT_DAYS) * 3} x norethisterone 5mg tablets` : "Not recorded"} />
          <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "Not recorded"} />
          <Row label="Date of supply" value={`${state.summary.consultationDate} ${state.summary.consultationTime}`.trim()} />
          <Row label="Supplied under" value="Period Delay (Norethisterone) PGD v009, 11 September 2026" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Row label="Outcome" value={stopped ? "NOT SUPPLIED: exclusion criteria met." : "No medicine supplied"} />
          <Row label="Appendix 2 alternatives explained" value={state.exclusionAdvice.appendix2Given ? "Yes" : "No"} />
          <Row label="Advice given and decision reached" value={state.exclusionAdvice.adviceNotes || "Not recorded"} />
        </div>
      )}
      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid items={[
        ["One tablet three times a day, every day", state.counselling.howToTake],
        ["Start 3 days before period due", state.counselling.startThreeDaysBefore],
        ["Maximum 14 days, 42 tablets, no extension", state.counselling.maxDuration],
        ["Period returns 2 to 3 days after last tablet", state.counselling.periodReturnsAfter],
        ["Told it is NOT contraception; use condoms or another method", state.counselling.notContraceptive],
        ["Told to do a pregnancy test if period does not arrive", state.counselling.pregnancyTestIfNoPeriod],
        ["Move around and keep hydrated", state.counselling.mobilityAndHydration],
        ["Common side effects discussed", state.counselling.sideEffects],
        ["Mood change: monitor, stop and seek advice if it drops", state.counselling.moodMonitoring],
        ["Same-day help for clot, liver or neurological symptoms", state.counselling.seekHelpIfUnwell],
      ]} />
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}
      {supplied ? (
        <PharmacistDeclaration pgdName="Period Delay (Norethisterone) PGD v009" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      ) : (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">No medicine was supplied under this PGD. Advice given and the decision reached are recorded above.</p>
          <div className="space-y-1.5">
            <Row label="Name" value={state.summary.pharmacistName || "Not recorded"} />
            <Row label="GPhC number" value={state.summary.pharmacistGPhC || "Not recorded"} />
            <Row label="Pharmacy" value={state.summary.pharmacyName || "Not recorded"} />
          </div>
        </>
      )}
      <ReportFooter pgdName="Period Delay (Norethisterone) v009" />
    </div>
  );
}
