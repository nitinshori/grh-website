"use client";

import type { BaseConsent } from "../types";
import { Checkbox, SelectInput } from "../components/FormInputs";

interface ConsentStepProps {
  consent: BaseConsent;
  onChange: (field: keyof BaseConsent, value: BaseConsent[keyof BaseConsent]) => void;
}

export function ConsentStep({ consent, onChange }: ConsentStepProps) {
  return (
    <div className="space-y-4">
      <Checkbox
        label="Informed consent obtained"
        checked={consent.informedConsentGiven}
        onChange={(v) => onChange("informedConsentGiven", v)}
        description="The patient has been informed about the treatment, including benefits, risks, and alternatives, and has given verbal or written consent."
      />
      <Checkbox
        label="ID verification completed"
        checked={consent.idVerified}
        onChange={(v) => onChange("idVerified", v)}
        description="The patient's identity has been confirmed."
      />
      {consent.idVerified && (
        <SelectInput
          label="ID type"
          value={consent.idType}
          onChange={(v) => onChange("idType", v)}
          options={[
            { value: "Driving licence", label: "Driving licence" },
            { value: "Passport", label: "Passport" },
            { value: "Known to pharmacist", label: "Known to pharmacist" },
            { value: "Other", label: "Other" },
          ]}
        />
      )}
      <Checkbox
        label="Patient aware this is a private service"
        checked={consent.patientAwarePrivateService}
        onChange={(v) => onChange("patientAwarePrivateService", v)}
        description="The patient understands there will be a consultation fee and the medication is not available on NHS prescription through this service."
      />
    </div>
  );
}
