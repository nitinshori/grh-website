"use client";

import type { WegovyOralState } from "../WegovyOralClient";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

// The oral Wegovy tool used to print two input boxes and a grey box with
// visit type, weights, product, batch and "Stops present" (adversarial
// review, 11 Sep 2026). This is the records-row record: patient, address,
// GP, consent, ID, contraindication answers, cautions and alerts, medicine
// or "not supplied", batch, advice given, pharmacist and declaration.

const PGD_VERSION_LABEL =
  "Wegovy (semaglutide) Tablets PGD version 011, issued 11 September 2026";

const PRODUCT_LABEL: Record<string, string> = {
  "wegovy-oral-1.5": "Wegovy (semaglutide) 1.5 mg tablets",
  "wegovy-oral-4": "Wegovy (semaglutide) 4 mg tablets",
  "wegovy-oral-9": "Wegovy (semaglutide) 9 mg tablets",
  "wegovy-oral-25": "Wegovy (semaglutide) 25 mg tablets",
};

const CONTRAINDICATION_LABELS: [keyof WegovyOralState["contraindications"], string][] = [
  ["pregnancyOrTryingConceive", "Pregnant, planning pregnancy or trying to conceive"],
  ["breastfeeding", "Breastfeeding"],
  ["hypersensitivity", "Hypersensitivity to semaglutide or excipients"],
  ["mtcOrMen2", "Personal or family history of MTC, or MEN 2"],
  ["pancreatitisHistory", "History of pancreatitis"],
  ["severeGastroparesisOrIBD", "Severe GI disease, gastroparesis"],
  ["cholelithiasisOrCholecystectomy", "Cholelithiasis, cholecystitis or cholecystectomy within 3 months"],
  ["endocrineObesity", "Obesity caused by an endocrinological disorder"],
  ["concurrentGlp1", "Concurrent GLP-1 receptor agonist"],
  ["insulinSecretagogue", "Insulin secretagogue"],
  ["type1Diabetes", "Type 1 diabetes"],
  ["diabeticRetinopathy", "Diabetic retinopathy"],
  ["insulinTreated", "Insulin-treated diabetes"],
  ["severeRenalImpairment", "Severe renal impairment or ESRD"],
  ["severeHepaticImpairment", "Severe hepatic impairment"],
  ["heartFailureLowEf", "Heart failure with reduced EF below 40%"],
  ["eatingDisorder", "Active eating disorder"],
  ["clinicalJudgementUnsuitable", "Not suitable in clinical judgement"],
];

function yesNo(v: boolean): string {
  return v ? "Yes" : "No";
}

export function WegovyOralSummaryReport({
  state,
  alerts,
  pctChange,
}: {
  state: WegovyOralState;
  alerts: ClinicalAlert[];
  pctChange: number | null;
}) {
  const stopsExist = alerts.some((a) => a.severity === "stop");
  const supplied = !stopsExist && state.doseSelection.product !== "";
  const e = state.eligibility;
  const c = state.counselling;
  const visitLabel =
    e.visitType === "initiation"
      ? "New initiation"
      : e.visitType === "continuation"
        ? "Continuing treatment"
        : e.visitType === "restart"
          ? `Restart after stopping (${e.restartOver2Months ? "more than" : "within"} 2 months)`
          : "Not recorded";

  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          Wegovy (Semaglutide) Tablets Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">ePGD Consultation Record. {PGD_VERSION_LABEL}</p>
        <p className="text-xs text-gray-400">
          Date: {state.summary.consultationDate} | Time: {state.summary.consultationTime}
        </p>
      </div>

      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of birth" value={state.patient.dateOfBirth || "Not recorded"} />
        <Row label="Age" value={state.patient.age !== null ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="NHS number" value={state.patient.nhsNumber || "Not recorded"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row
          label="GP"
          value={
            state.patient.gpName
              ? `${state.patient.gpName}${state.patient.gpPractice ? `, ${state.patient.gpPractice}` : ""}`
              : state.patient.gpPractice || "Not recorded"
          }
        />
      </div>

      <div>
        <SectionHeader>Consent and Identity</SectionHeader>
        <Row label="Informed consent" value={yesNo(state.consent.informedConsentGiven)} />
        <Row
          label="Written informed consent to treatment obtained and filed"
          value={yesNo(state.treatmentConsent.writtenConsentObtained)}
        />
        <Row label="Treatment and administration explained" value={yesNo(state.treatmentConsent.treatmentExplained)} />
        <Row label="Risk-benefit discussion completed" value={yesNo(state.treatmentConsent.riskBenefitDiscussed)} />
        <Row label="Alternatives discussed" value={yesNo(state.treatmentConsent.alternativesDiscussed)} />
        <Row
          label="ID verified"
          value={state.consent.idVerified ? `Yes (${state.consent.idType || "type not recorded"})` : "No"}
        />
        <Row label="Aware this is a private service" value={yesNo(state.consent.patientAwarePrivateService)} />
      </div>

      <div>
        <SectionHeader>Eligibility and Weight</SectionHeader>
        <Row label="Visit type" value={visitLabel} />
        <Row label="Adult aged 18 to 85 confirmed" value={yesNo(e.age18To85)} />
        <Row label="Height" value={e.heightCm !== null ? `${e.heightCm} cm` : "Not recorded"} />
        <Row label="Weight today" value={e.weightKg !== null ? `${e.weightKg} kg` : "Not recorded"} />
        <Row label="BMI today" value={e.bmi !== null ? `${e.bmi.toFixed(1)} kg/m²` : "Not recorded"} />
        <Row
          label="Baseline weight"
          value={
            e.baselineWeightKg !== null
              ? `${e.baselineWeightKg} kg${pctChange !== null ? ` (change from baseline ${pctChange > 0 ? "+" : ""}${pctChange}%)` : ""}`
              : "Not recorded"
          }
        />
        <Row label="Agreed target weight" value={e.targetWeightKg !== null ? `${e.targetWeightKg} kg` : "Not recorded"} />
        <Row
          label="Weight-related comorbidity"
          value={e.hasComorbidity === "yes" ? `Yes${e.comorbidities ? `: ${e.comorbidities}` : ""}` : e.hasComorbidity === "no" ? "No" : "Not answered"}
        />
        <Row label="Initial assessment completed and documented" value={yesNo(e.initialAssessmentDone)} />
        <Row label="Able to follow empty-stomach administration" value={yesNo(e.ableEmptyStomach)} />
        <Row label="Willing to follow the agreed lifestyle plan" value={yesNo(e.willingLifestyleChange)} />
        <Row label="Previous lifestyle attempts without adequate result" value={yesNo(e.tried6MonthLifestyle)} />
        {e.visitType === "continuation" && (
          <Row
            label="Current established dose"
            value={
              e.currentDose
                ? `${e.currentDose} mg once daily${e.monthsAtCurrentDose !== null ? `, ${e.monthsAtCurrentDose} months on this dose` : ""}`
                : "Not recorded"
            }
          />
        )}
        {e.switchingFromInjection && (
          <Row
            label="Switch from semaglutide injection"
            value={`${e.injectionDose ? `${e.injectionDose} mg weekly` : "dose not recorded"}; evidence: ${e.injectionDoseEvidence || "none recorded"}${e.injectionStoppedOver2Months ? "; injection stopped more than 2 months ago" : ""}`}
          />
        )}
      </div>

      <div>
        <SectionHeader>Contraindications</SectionHeader>
        {CONTRAINDICATION_LABELS.map(([key, label]) => (
          <Row key={key} label={label} value={yesNo(state.contraindications[key])} />
        ))}
      </div>

      <div>
        <SectionHeader>Cautions and Interactions</SectionHeader>
        <Row
          label="History of suicidal ideation or severe mental illness"
          value={
            state.cautions.mentalHealthHistory
              ? `Yes; psychiatric oversight: ${state.cautions.psychiatricOversight === "yes" ? "Yes" : state.cautions.psychiatricOversight === "no" ? "No" : "not answered"}; current concern: ${yesNo(state.cautions.mentalHealthConcern)}`
              : "No"
          }
        />
        <Row label="Mild to moderate renal impairment" value={yesNo(state.cautions.mildModerateRenal)} />
        <Row label="Pre-existing raised heart rate" value={yesNo(state.cautions.raisedHeartRate)} />
        <Row label="Sodium-restricted diet" value={yesNo(state.cautions.sodiumRestrictedDiet)} />
        <Row label="Levothyroxine" value={yesNo(state.interactions.levothyroxine)} />
        <Row label="Warfarin or other coumarin" value={yesNo(state.interactions.warfarin)} />
        <Row label="Sulfonylurea, meglitinide or insulin" value={yesNo(state.interactions.sulfonylureaOrInsulin)} />
        <Row label="Type 2 diabetes on metformin, SGLT2 or DPP-4 inhibitor" value={yesNo(state.interactions.metforminSglt2Dpp4)} />
        <Row label="Oral contraception" value={yesNo(state.interactions.oralContraception)} />
        <Row label="Oral HRT" value={yesNo(state.interactions.oralHrt)} />
        {state.interactions.other && <Row label="Other medicines" value={state.interactions.other} />}
      </div>

      <div>
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div>
        <SectionHeader>{supplied ? "Medicine Supplied" : "Outcome"}</SectionHeader>
        {supplied ? (
          <>
            <Row label="Medicine" value={`${PRODUCT_LABEL[state.doseSelection.product] ?? state.doseSelection.product}, once daily, oral`} />
            <Row label="Quantity" value="1 calendar pack of 30 tablets (one month of treatment)" />
            <Row label="Batch number" value={state.doseSelection.batchNumber || "Not recorded"} />
            <Row label="Supplied under" value={PGD_VERSION_LABEL} />
            {state.doseSelection.rationale && (
              <Row label="Clinical rationale" value={state.doseSelection.rationale} />
            )}
          </>
        ) : (
          <>
            <Row
              label="Medicine"
              value={
                stopsExist
                  ? "NOT SUPPLIED: exclusion criteria met (see clinical alerts above)"
                  : "No medicine supplied"
              }
            />
            <Row label="PGD" value={PGD_VERSION_LABEL} />
            {state.doseSelection.rationale && (
              <Row label="Clinical rationale" value={state.doseSelection.rationale} />
            )}
          </>
        )}
      </div>

      <div>
        <SectionHeader>Advice Given</SectionHeader>
        <CounsellingGrid
          items={[
            ["Empty stomach, at least 8 hours fasting", c.emptyStomachExplained],
            ["No more than 120 mL water", c.waterLimit120ml],
            ["Wait 30 minutes before food, drink, other medicines", c.waitBeforeFood],
            ["Swallow whole; one tablet a day", c.swallowWholeOneTablet],
            ["Missed dose advice", c.missedDose],
            ["Diet and activity", c.dietAndActivity],
            ["GI effects and fluids", c.gastrointestinalSe],
            ["Pancreatitis red flag", c.pancreatitisRedFlag],
            ["Persistent vomiting with dehydration", c.urgentVomitingDehydration],
            ["Jaundice", c.gallbladderRedFlag],
            ["Sudden loss of vision", c.visionLoss],
            ["Sustained rise in resting heart rate", c.heartRateRise],
            ["Tell anaesthetist, dentist or surgeon", c.anaesthetistWarning],
            ["Hypoglycaemia (type 2 diabetes)", c.hypoRiskIfDiabetic],
            ["Contraception and pregnancy", c.pregnancyWarning],
            ["Storage", c.storedTablet],
            ["PIL and written lifestyle advice supplied", c.writtenInfoSupplied],
            ["Review and the 5% rule", c.followUpPlan],
            ["GP informed", c.gpInformed],
          ]}
        />
      </div>

      {state.summary.clinicalNotes && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </div>
      )}

      {stopsExist ? (
        <div>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the
            Patient Group Direction for Wegovy (Semaglutide) Tablets, that exclusion
            criteria applied, that no medicine was supplied, and that the patient was
            given the advice recorded above.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistGPhC || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacyName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
              <div className="border-b border-gray-300 min-h-[2rem]" />
            </div>
          </div>
        </div>
      ) : (
        <PharmacistDeclaration
          pgdName="Wegovy (Semaglutide) Tablets"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      <ReportFooter pgdName="Wegovy (Semaglutide) Tablets" />
    </div>
  );
}
