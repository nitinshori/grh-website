"use client";

import type { STIConsultationState } from "../lib/sti-types";
import type { ClinicalAlert } from "../../shared/types";
import { getWindowPeriodInfo, getTreatmentPlan } from "../lib/sti-clinical-logic";
import { PGD_VERSION_LABEL } from "../lib/sti-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface STISummaryReportProps {
  state: STIConsultationState;
  alerts: ClinicalAlert[];
}

const PGD_NAME = "the Treatment of Chlamydia (doxycycline or azithromycin)";

const REFERRED_LABELS: Record<string, string> = {
  "sexual-health": "Sexual health service (same day)",
  gp: "GP (same day)",
  safeguarding: "Local safeguarding pathway",
  other: "Other",
};

export function STISummaryReport({ state, alerts }: STISummaryReportProps) {
  const windowPeriods = getWindowPeriodInfo();
  const treatmentPlan = getTreatmentPlan(state);
  const isMinor = state.patient.age !== null && state.patient.age >= 13 && state.patient.age <= 15;
  // A stop anywhere means nothing was supplied under this PGD: the treatment
  // rows and the "no exclusion criteria applied" declaration must not print.
  const hasStop = alerts.some((a) => a.severity === "stop");

  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          STI Testing and Chlamydia Treatment Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Test Requisition, Treatment and Counselling Record
        </p>
        <p className="text-[10px] text-gray-400 mt-1">{PGD_VERSION_LABEL}</p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="Gender Identity" value={state.patient.genderIdentity || "—"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}, ${state.patient.gpPractice}` : "—"} />
        {isMinor && (
          <>
            <Row label="Fraser competence" value={state.patient.fraserCompetent ? "All five criteria recorded" : "Not established"} />
            <Row label="Understands the advice" value={state.patient.fraserUnderstandsAdvice ? "Yes" : "No"} />
            <Row label="Cannot be persuaded to inform parents" value={state.patient.fraserCannotBePersuaded ? "Yes" : "No"} />
            <Row label="Likely to continue intercourse regardless" value={state.patient.fraserLikelyToContinue ? "Yes" : "No"} />
            <Row label="Health likely to suffer without treatment" value={state.patient.fraserHealthWouldSuffer ? "Yes" : "No"} />
            <Row label="Best interests require treatment" value={state.patient.fraserBestInterests ? "Yes" : "No"} />
            <Row
              label="Safeguarding assessment"
              value={
                state.patient.safeguardingAssessed
                  ? state.patient.safeguardingConcern
                    ? "Completed: concern identified, referred"
                    : "Completed: no concern"
                  : "Not completed"
              }
            />
            <Row label="Safeguarding record" value={state.patient.safeguardingNotes || "Not recorded"} />
          </>
        )}
      </div>

      {/* Consent */}
      <div>
        <SectionHeader>Consent</SectionHeader>
        <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes (${state.consent.idType})` : "No"} />
        <Row
          label="Private service awareness"
          value={state.consent.patientAwarePrivateService ? "Yes" : "No"}
        />
      </div>

      {/* Risk Assessment */}
      <div>
        <SectionHeader>Risk Assessment</SectionHeader>
        <Row
          label="Number of sexual partners (3 months)"
          value={state.riskAssessment.numberOfPartners !== null ? state.riskAssessment.numberOfPartners : "—"}
        />
        <Row
          label="Condom usage"
          value={state.riskAssessment.condomUsage ? state.riskAssessment.condomUsage.charAt(0).toUpperCase() + state.riskAssessment.condomUsage.slice(1) : "—"}
        />
        <Row
          label="Previous STIs"
          value={state.riskAssessment.previousSTIs ? "Yes" : "No"}
        />
        {state.riskAssessment.previousSTIs && (
          <Row label="Details" value={state.riskAssessment.previousStiDetail || "—"} />
        )}
        <Row
          label="Current symptoms"
          value={state.riskAssessment.currentSymptoms ? "Yes" : "No"}
        />
        {state.riskAssessment.currentSymptoms && (
          <Row label="Details" value={state.riskAssessment.symptomDetail || "—"} />
        )}
        <Row label="MSM status" value={state.riskAssessment.msmStatus ? "Yes" : "No"} />
        <Row label="Sex worker" value={state.riskAssessment.sexWorker ? "Yes" : "No"} />
        <Row label="PWID" value={state.riskAssessment.pwid ? "Yes" : "No"} />
      </div>

      {/* Clinical Assessment */}
      <div>
        <SectionHeader>Clinical Assessment</SectionHeader>
        <Row
          label="Urethral discharge"
          value={state.clinicalAssessment.urethralDischarge ? "Yes" : "No"}
        />
        <Row
          label="Genital pain"
          value={state.clinicalAssessment.genitalPain ? "Yes" : "No"}
        />
        <Row
          label="Rectal symptoms"
          value={state.clinicalAssessment.rectalSymptoms ? "Yes" : "No"}
        />
        <Row
          label="Pharyngeal symptoms"
          value={state.clinicalAssessment.pharyngealSymptoms ? "Yes" : "No"}
        />
        <Row
          label="Systemic symptoms"
          value={state.clinicalAssessment.systemicSymptoms ? "Yes" : "No"}
        />
        {state.clinicalAssessment.systemicSymptoms && (
          <Row label="Details" value={state.clinicalAssessment.systemicDetail || "—"} />
        )}
      </div>

      {/* Tests Ordered */}
      <div>
        <SectionHeader>Tests Ordered</SectionHeader>
        {state.testSelection.ctGc && (
          <Row
            label="Chlamydia/Gonorrhoea"
            value={`Sample: ${state.testSelection.ctGcSampleType}`}
          />
        )}
        {state.testSelection.hiv && (
          <Row
            label="HIV"
            value={`Type: ${state.testSelection.hivTestType}`}
          />
        )}
        {state.testSelection.syphilis && <Row label="Syphilis serology" value="Yes" />}
        {state.testSelection.hepatitisB && <Row label="Hepatitis B serology" value="Yes" />}
        {state.testSelection.hepatitisC && <Row label="Hepatitis C serology" value="Yes" />}
      </div>

      {/* Window Periods */}
      <div>
        <SectionHeader>Window Period Information</SectionHeader>
        <div className="space-y-2">
          {state.testSelection.ctGc && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">CT/GC:</span> {windowPeriods["Chlamydia/Gonorrhoea"]}
            </p>
          )}
          {state.testSelection.hiv && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">HIV:</span> {windowPeriods.HIV}
            </p>
          )}
          {state.testSelection.syphilis && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Syphilis:</span> {windowPeriods.Syphilis}
            </p>
          )}
          {state.testSelection.hepatitisB && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Hepatitis B:</span> {windowPeriods["Hepatitis B"]}
            </p>
          )}
          {state.testSelection.hepatitisC && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Hepatitis C:</span> {windowPeriods["Hepatitis C"]}
            </p>
          )}
        </div>
      </div>

      {/* Outcome when excluded */}
      {hasStop && (
        <div>
          <SectionHeader>Outcome: Not Supplied</SectionHeader>
          <Row label="Medicine supplied" value="None. Exclusion criteria met; see clinical notes below." />
          <Row label="Referred to" value={REFERRED_LABELS[state.exclusionOutcome.referredTo] || "Not recorded"} />
          <Row label="Safeguarding referral made" value={state.exclusionOutcome.safeguardingReferralMade ? "Yes" : "No"} />
          <Row label="Advice given and decision reached" value={state.exclusionOutcome.adviceGiven || "Not recorded"} />
        </div>
      )}

      {/* Treatment supplied under the PGD */}
      <div>
        <SectionHeader>Chlamydia Treatment (PGD)</SectionHeader>
        {hasStop ? (
          <p className="text-xs text-gray-500">No medicine supplied under the PGD: exclusion criteria met.</p>
        ) : state.treatment.treatUnderPgd ? (
          <>
            <Row
              label="Diagnosis"
              value={
                state.treatment.chlamydiaDiagnosis === "confirmed"
                  ? "Confirmed genital chlamydia"
                  : state.treatment.chlamydiaDiagnosis === "strongly-suspected"
                    ? "Strongly suspected genital chlamydia"
                    : "Not recorded"
              }
            />
            <Row
              label="Exclusions checked"
              value={[
                state.treatment.pregnant && "pregnant",
                state.treatment.breastfeeding && "breastfeeding",
                state.treatment.severeHepaticImpairment && "severe hepatic impairment",
                state.treatment.complicatedInfection && "complicated infection",
                state.treatment.tetracyclineHypersensitivity && "tetracycline hypersensitivity",
                state.treatment.unableToComplyOrSwallow && "unable to comply with 7 days or swallow capsules",
                state.treatment.macrolideHypersensitivity && "macrolide hypersensitivity",
                state.treatment.qtProlongation && "QT prolongation or interacting drugs",
                state.treatment.ergotDerivatives && "ergot derivatives",
              ]
                .filter(Boolean)
                .join(", ") || "None identified"}
            />
            {state.treatment.doxycyclineUnsuitable && (
              <Row label="Doxycycline unsuitable" value={state.treatment.doxycyclineUnsuitableReason || "Yes"} />
            )}
            <Row label="Current medicines" value={state.treatment.currentMedicines || "Not recorded"} />
            <Row label="Known allergies" value={state.treatment.knownAllergies || "Not recorded"} />
            {treatmentPlan ? (
              <>
                <Row label="Medicine supplied" value={treatmentPlan.product} />
                <Row label="Brand" value={state.treatment.brand || "Not recorded"} />
                <Row label="Dose and frequency" value={treatmentPlan.dose} />
                <Row label="Route" value={treatmentPlan.route} />
                <Row label="Quantity supplied" value={treatmentPlan.quantity} />
                <Row label="Treatment period" value={treatmentPlan.duration} />
                <Row label="Supplied under" value={PGD_VERSION_LABEL} />
              </>
            ) : (
              <Row label="Medicine supplied" value="None" />
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500">No medicine supplied under the PGD (testing only).</p>
        )}
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <AlertSummary alerts={alerts} />
        </div>
      )}

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <div className="space-y-1.5 text-xs">
          <p>
            {state.counselling.windowPeriods ? "✓" : "—"} Window period information explained
          </p>
          <p>
            {state.counselling.partnerNotification ? "✓" : "—"} Partner notification discussed
          </p>
          <p>
            {state.counselling.safeSex ? "✓" : "—"} Safe sex practices advised
          </p>
          <p>
            {state.counselling.resultsTimeline ? "✓" : "—"} Results timeline explained
          </p>
          <p>
            {state.counselling.positiveTestMeaning ? "✓" : "—"} Positive test results explained
          </p>
          <p>
            {state.counselling.followUp ? "✓" : "—"} Follow-up procedures explained
          </p>
          {treatmentPlan && (
            <>
              <p>
                {state.counselling.medicineAdvice ? "✓" : "[ ]"}{" "}
                {treatmentPlan.medicine === "doxycycline"
                  ? "Take with water, remain upright 30 minutes, avoid sun exposure"
                  : "No antacids 2 hours before or after a dose"}
              </p>
              <p>
                {state.counselling.abstinenceAdvice ? "✓" : "[ ]"}{" "}
                {treatmentPlan.medicine === "doxycycline"
                  ? "Abstain until treatment and partner treatment completed"
                  : "Abstain for 7 days after treatment and until partners are treated"}
              </p>
              {treatmentPlan.medicine === "doxycycline" && (
                <p>
                  {state.counselling.contraceptionAdvice ? "✓" : "[ ]"} Effective contraception during and for 7 days after the course
                </p>
              )}
              {treatmentPlan.medicine === "azithromycin" && (
                <p>
                  {state.counselling.testOfCureAdvice ? "✓" : "[ ]"} Test of cure if symptoms persist or in pregnancy
                </p>
              )}
              <p>
                {state.counselling.worseningAdvice ? "✓" : "[ ]"} Seek medical advice if symptoms worsen, do not improve in 3 to 4 weeks, or systemically very unwell
              </p>
              <p>
                {state.counselling.retestAdvice ? "✓" : "[ ]"} Retest at 3 months; test of cure at least 3 weeks after treatment where required
              </p>
              <p>{state.counselling.pilSupplied ? "✓" : "[ ]"} PIL supplied</p>
            </>
          )}
          <p className="text-gray-600 pt-1">
            Adverse effects: report suspected adverse effects via the Yellow Card scheme (https://yellowcard.mhra.gov.uk) and inform the GP as appropriate.
          </p>
        </div>
      </div>

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </div>
      )}

      {/* Consultation Details */}
      <div>
        <SectionHeader>Consultation Details</SectionHeader>
        <Row label="Date" value={state.summary.consultationDate} />
        <Row label="Time" value={state.summary.consultationTime} />
      </div>

      {/* Pharmacist Declaration */}
      {hasStop ? (
        <>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the Patient Group Direction for {PGD_NAME},
            that exclusion criteria applied, that no medicine was supplied under the PGD, and that the advice given, the
            decision reached and any referral made are recorded above.
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
        </>
      ) : (
        <PharmacistDeclaration
          pgdName={PGD_NAME}
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      {/* Footer */}
      <ReportFooter pgdName="Chlamydia Treatment" />
    </div>
  );
}
