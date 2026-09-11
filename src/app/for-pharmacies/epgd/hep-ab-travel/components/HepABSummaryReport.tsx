"use client"

import {
  SectionHeader,
  Row,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell"
import { PGD_VERSION, PRODUCT_LABEL, SCHEDULE_LABEL, type HepABState } from "../hep-ab-travel-types"

const PGD_NAME = "Hepatitis A and Hepatitis B Vaccination (Havrix, Avaxim, Engerix B and Twinrix)"

const SITE_LABEL: Record<string, string> = {
  "left-deltoid": "Left deltoid",
  "right-deltoid": "Right deltoid",
  "anterolateral-thigh": "Anterolateral thigh",
}

const DOSE_LABEL: Record<string, string> = {
  "1": "Dose 1 (primary)",
  "2": "Dose 2",
  "3": "Dose 3",
  booster: "Booster or 12-month dose",
}

const REFERRAL_LABEL: Record<string, string> = {
  "": "Not recorded",
  gp: "Referred to GP",
  "occupational-health": "Referred to occupational health",
  "travel-clinic": "Referred to a travel clinic",
  "hpt-urgent": "Urgent same-day referral (post-exposure)",
  declined: "Patient declined referral; advice given",
}

interface Props {
  state: HepABState
  blocked: boolean
  blockReason: string
  nextDoseDueDate: string
  courseComplete: boolean
  offLabelUsed: boolean
}

/**
 * Printed consultation record, rendered as the content of the final step so
 * that Save & Print prints the record the document requires (patient,
 * consent, risk factors, product with strength, schedule, dose number,
 * batch, expiry, site, observation, next due date, advice, pharmacist, PGD
 * version) rather than a green box. With a stop present it prints "not
 * supplied", no vaccine, and a declaration that does not claim no exclusion
 * criteria applied.
 */
export function HepABSummaryReport({ state, blocked, blockReason, nextDoseDueDate, courseComplete, offLabelUsed }: Props) {
  const { patient, consent, travel, eligibility, administration: a, advice, summary } = state
  const given = a.vaccineGiven
  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">Hepatitis A / B Travel ePGD. {PGD_VERSION}</p>
        {blocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6 print:space-y-4">
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
            <Row label="Date of birth" value={patient.dateOfBirth} />
            <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
            <Row label="Address" value={patient.address || "Not provided"} />
            <Row label="NHS number" value={patient.nhsNumber || "Not provided"} />
            <Row label="GP" value={[patient.gpName, patient.gpPractice].filter(Boolean).join(", ") || "Not provided"} />
          </div>
        </div>

        <div>
          <SectionHeader>Consent</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consent given by" value={travel.consentBasis === "parental" ? `Person with parental responsibility: ${travel.consentGivenBy || "not recorded"}` : travel.consentBasis === "gillick" ? `The young person, assessed as Gillick competent. Basis: ${travel.consentGivenBy || "not recorded"}` : travel.consentBasis === "self" ? "The patient (16 and over)" : "Not recorded"} />
          </div>
          <div className="mt-2">
            <CounsellingGrid items={[
              ["Informed consent obtained", consent.informedConsentGiven],
              ["ID verified", consent.idVerified],
              ["Aware this is a private service", consent.patientAwarePrivateService],
            ]} />
          </div>
        </div>

        <div>
          <SectionHeader>Travel and Risk Factors</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Destination(s)" value={travel.destinations || "Not recorded"} />
            <Row label="Departure date" value={travel.departureDate || "Not recorded"} />
            <Row label="Duration" value={travel.durationWeeks ? `${travel.durationWeeks} weeks` : "Not recorded"} />
            <Row label="Previous vaccination" value={[
              travel.previousHepAVaccine ? `Hepatitis A${travel.previousHepACourseComplete ? " (course complete)" : ""}` : null,
              travel.previousHepBVaccine ? `Hepatitis B${travel.previousHepBCourseComplete ? " (course complete)" : ""}` : null,
            ].filter(Boolean).join("; ") || "None"} />
            {travel.previousVaccineDetails && <Row label="Previous vaccine details" value={travel.previousVaccineDetails} />}
          </div>
          <div className="mt-2">
            <CounsellingGrid items={[
              ["Hepatitis A: travel to moderate or high endemicity area", travel.hepARisk],
              ["Hepatitis A: non-travel risk factor", travel.hepANonTravelRisk],
              ["Hepatitis B: travel with risk factor, or lifestyle risk", travel.hepBRisk],
              ["Longer stay or expatriate posting", travel.longerStay],
              ["Rural or remote, or medical or dental care likely", travel.ruralOrRemote],
              ["Relief or aid healthcare work", travel.healthcareWorkerExposure],
              ["Sexual or blood-borne exposure risk", travel.sexualOrBloodExposureRisk],
              ["Tattooing, piercing or acupuncture abroad", travel.bodyModificationRisk],
            ]} />
          </div>
        </div>

        <div>
          <SectionHeader>Eligibility Screen</SectionHeader>
          <CounsellingGrid items={[
            ["Hypersensitivity to vaccine or excipients", eligibility.hypersensitivityToVaccine],
            ["Acute severe febrile illness", eligibility.acuteFebrileIllness],
            ["Previous anaphylaxis to a hepatitis vaccine", eligibility.previousAnaphylaxisToHepVaccine],
            ["Previous hypersensitivity to a hepatitis vaccine", eligibility.previousHypersensitivityToHepVaccine],
            ["Out of scope situation", eligibility.outOfScope],
            ["Proof of immunity required", eligibility.proofOfImmunityRequired],
            ["Neomycin allergy", eligibility.neomycinAllergy],
            ["Yeast allergy", eligibility.yeastAllergy],
            ["Pregnant", eligibility.pregnant],
            ["Breastfeeding", eligibility.breastfeeding],
            ["Immunosuppression", eligibility.immunocompromised],
            ["Anticoagulants", eligibility.onAnticoagulants],
            ["Bleeding disorder", eligibility.bleedingDisorder],
            ["Chronic liver disease", eligibility.chronicLiverDisease],
            ["Latex allergy", eligibility.latexAllergy],
            ["Other vaccines same visit", eligibility.otherVaccinesSameVisit],
          ]} />
          {eligibility.pregnant && eligibility.pregnancyRiskAssessment && (
            <div className="mt-2"><Row label="Pregnancy risk assessment" value={eligibility.pregnancyRiskAssessment} /></div>
          )}
          {eligibility.breastfeeding && eligibility.breastfeedingDecision && (
            <Row label="Breastfeeding decision" value={eligibility.breastfeedingDecision} />
          )}
        </div>

        {blocked ? (
          <div>
            <SectionHeader>Exclusion Outcome</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Reason" value={blockReason} />
              <Row label="Advice given and decision reached" value={eligibility.exclusionAdvice || "Not recorded"} />
              <Row label="Referral" value={REFERRAL_LABEL[eligibility.exclusionReferral] ?? eligibility.exclusionReferral} />
              <Row label="Vaccine" value="Not supplied" />
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader>Vaccine Administered Under This PGD</SectionHeader>
            {!given ? (
              <p className="text-xs text-gray-500">No vaccine recorded.</p>
            ) : (
              <div className="space-y-1.5">
                <Row label="Vaccine (name, brand, strength)" value={PRODUCT_LABEL[given]} />
                <Row label="Route" value="Intramuscular" />
                <Row label="Schedule" value={a.schedule ? SCHEDULE_LABEL[a.schedule] : "Not recorded"} />
                {offLabelUsed && <Row label="Off-label schedule" value={a.offLabelScheduleConsented ? "Very rapid schedule in a 16 or 17 year old: explained and consented to, recorded as an explicit decision" : "Off-label: consent NOT recorded"} />}
                <Row label="Dose number" value={DOSE_LABEL[a.doseNumberThisVisit] || "Not recorded"} />
                {a.previousDoseDate && <Row label="Date of previous dose" value={a.previousDoseDate} />}
                <Row label="Batch number" value={a.batchNumber || "Not recorded"} />
                <Row label="Expiry date" value={a.expiryDate || "Not recorded"} />
                <Row label="Site" value={SITE_LABEL[a.injectionSite] || "Not recorded"} />
                <Row label="Date and time of administration" value={`${summary.consultationDate} ${a.administeredAt}`} />
                <Row label="Next dose due" value={courseComplete ? "Course complete with this dose" : nextDoseDueDate || "Not recorded"} />
                <Row label="Adrenaline 1 in 1,000 and anaphylaxis protocol available" value={a.anaphylaxisKitChecked ? "Confirmed" : "Not confirmed"} />
                <Row label="Observation" value={a.patientWell ? `${a.postObsMinutes || "15"} minutes, seated; patient remained well` : "Not completed"} />
                <Row label="Adverse reaction" value={a.adverseReaction ? a.adverseReactionDetails || "Yes, details not recorded" : "None observed"} />
                <Row label="Administered via PGD" value="Yes" />
              </div>
            )}
          </div>
        )}

        {!blocked && (
          <div>
            <SectionHeader>Advice Given</SectionHeader>
            <CounsellingGrid items={[
              ["Side effects and when to seek help", advice.sideEffectsCounselled],
              ["Patient information leaflet given", advice.pilGiven],
              ["Yellow Card scheme discussed", advice.yellowCardLeafletGiven],
              ["Written record given (brand, strength, batch, date)", advice.vaccineRecordCardIssued],
              ["Schedule in writing with the date each dose is due", advice.followUpScheduleAgreed],
              ["Protection by travel date explained", advice.protectionByTravelExplained],
              ["Hepatitis C not covered", advice.hepCNotCoveredExplained],
              ["Food and water hygiene (hepatitis A)", advice.foodAndWaterHygieneCounselled],
              ["Sexual health and blood-borne risk reduction (hepatitis B)", advice.sexualHealthCounselling],
              ["Wider travel health advice", advice.travelHealthAdviceProvided],
            ]} />
            <div className="mt-2">
              <Row label="GP informed" value={advice.gpInformedDecision === "informed" ? "Yes" : advice.gpInformedDecision === "declined" ? "Patient declined" : "Not recorded"} />
            </div>
          </div>
        )}

        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
          </div>
        </div>

        {blocked ? (
          <div>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this patient was assessed under the Patient Group Direction for {PGD_NAME}, that exclusion criteria applied, that no vaccine was administered under the PGD, and that the advice given and the decision reached are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </div>
        ) : (
          <PharmacistDeclaration
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName="Hepatitis A and B Travel" />
      </div>
    </div>
  )
}
