'use client';

import React from 'react';
import type { ASConsultationState } from '../altitude-sickness-types';
import type { ClinicalAlert } from '../../shared/types';
import { AS_PGD_VERSION, calculateASQuantity } from '../altitude-sickness-clinical-logic';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';

interface AltitudeSicknessSummaryReportProps {
  state: ASConsultationState;
  /** The live alerts computed by the client. The old state.alerts was never written. */
  alerts: ClinicalAlert[];
}

export const AltitudeSicknessSummaryReport: React.FC<
  AltitudeSicknessSummaryReportProps
> = ({ state, alerts }) => {
  const {
    patient,
    travelAssessment,
    medicineSelection,
    counselling,
    summary,
  } = state;
  const hasStops = alerts.some((a) => a.severity === 'stop');
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB') : 'Not recorded');
  const calc = calculateASQuantity(travelAssessment, medicineSelection.includeTreatmentCourse);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Altitude Sickness ePGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acute Mountain Sickness Consultation Record
          </p>
          <p className="text-xs text-gray-500 mt-1">{AS_PGD_VERSION}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">{summary.consultationDate}</p>
          <p>{summary.consultationTime}</p>
        </div>
      </div>

      {/* Patient Information */}
      <SectionHeader>Patient Information</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={`${fmtDate(patient.dateOfBirth)} (${patient.age ?? '?'} years)`} />
        <Row label="Address" value={patient.address || 'Not recorded'} />
        <Row label="NHS Number" value={patient.nhsNumber || 'Not provided'} />
        <Row label="GP" value={patient.gpPractice || patient.gpName || 'Not recorded'} />
        <Row label="Consent" value={state.consent.informedConsentGiven ? 'Valid informed consent given by the patient' : 'Not recorded'} />
      </div>

      {/* Travel & Altitude Details */}
      <SectionHeader>Travel & Altitude Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={travelAssessment.destinationCountry} />
        <Row label="Destination Altitude" value={`${travelAssessment.destinationAltitude}m`} />
        <Row label="Current Altitude" value={travelAssessment.currentAltitude ? `${travelAssessment.currentAltitude}m` : 'Not specified'} />
        <Row label="Reason for request" value={travelAssessment.purpose === 'treatment' ? 'Symptomatic treatment of AMS' : travelAssessment.purpose === 'prevention' ? 'Prevention of AMS' : 'Not specified'} />
        <Row label="Departure" value={fmtDate(travelAssessment.departureDate)} />
        {travelAssessment.purpose === 'prevention' && (
          <Row label="Course calculation" value={calc.text} />
        )}
        <Row label="Ascent Rate" value={travelAssessment.ascentRate} />
        <Row label="Acclimatisation Plan" value={travelAssessment.acclimatisationPlan ? `Yes (${travelAssessment.acclimatisationDays} days)` : 'No'} />
        <Row label="Previous High Altitude Experience" value={travelAssessment.previousAltitudeExperience ? 'Yes' : 'No'} />
        <Row label="Previous Altitude Sickness" value={travelAssessment.previousAltitudeSickness ? 'Yes' : 'No'} />
        {travelAssessment.previousAltitudeSickness && (
          <Row label="Previous Sickness Details" value={travelAssessment.previousSicknessDetails} />
        )}
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Medicine Selection */}
      <SectionHeader>{hasStops ? 'Outcome' : 'Medicine Supplied under this PGD'}</SectionHeader>
      {hasStops ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met. Advised on alternative options and referred as appropriate." />
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Medicine" value={medicineSelection.selectedMedicine ? 'Acetazolamide 250 mg tablets (scored), oral' : 'Not supplied'} />
        <Row label="Brand" value={medicineSelection.brand || 'Not recorded'} />
        <Row label="Dose" value={medicineSelection.dose} />
        <Row label="Start Timing" value={medicineSelection.startTiming} />
        <Row label="Continue Until" value={medicineSelection.continuationTiming} />
        <Row label="Treatment course added" value={medicineSelection.includeTreatmentCourse ? 'Yes (6 tablets, 250 mg twice daily for 3 days)' : 'No'} />
        <Row label="Quantity supplied" value={medicineSelection.quantityTablets !== null ? `${medicineSelection.quantityTablets} tablets` : 'Not recorded'} />
        <Row label="Date of supply" value={summary.consultationDate} />
        <Row label="Off-label use explained" value={medicineSelection.offLabelExplained ? 'Yes, recorded' : 'No'} />
        <Row label="Clinical Reason" value={medicineSelection.reason} />
        <Row label="Supplied under" value={AS_PGD_VERSION} />
      </div>
      )}

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['Side effects explained; discontinue if severe', counselling.paraesthesiaExplained],
          ['Avoid alcohol at altitude', counselling.avoidAlcoholAdvice],
          ['Maintain adequate hydration', counselling.hydrateWellAdvice],
          ['Ascend gradually; do not ascend further while symptomatic', counselling.ascentAdvice],
          ['AMS symptoms and recognition', counselling.amsSymptomAdvice],
          ['HACE warning signs (confusion, unsteadiness, severe headache, reduced consciousness)', counselling.haceSymptomAdvice],
          ['HAPE warning signs (breathlessness at rest, cough with frothy sputum)', counselling.hapeSymptomAdvice],
          ['Descend and seek help urgently if not improving in 24 hours; acetazolamide is not a substitute for descent', counselling.descentAdvice],
          ['Patient information leaflet supplied', counselling.medicineCardProvided],
        ]}
      />

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <div className="bg-gray-50 rounded p-4 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {summary.clinicalNotes}
            </p>
          </div>
        </>
      )}

      {/* Pharmacist Declaration. The shared declaration asserts that no
          exclusion criteria applied, so it is only used when that is true. */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        {hasStops ? (
          <>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for
              acetazolamide for altitude sickness, that the patient met an exclusion criterion, that NO medicine was
              supplied, and that the advice recorded above was given.
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
            </div>
          </>
        ) : (
          <PharmacistDeclaration
            pgdName="Altitude Sickness ePGD"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Altitude Sickness ePGD" />
    </div>
  );
};
