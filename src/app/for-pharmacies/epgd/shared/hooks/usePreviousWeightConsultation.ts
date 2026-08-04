"use client";

import { useCallback, useState } from "react";
import type { BasePatientDetails } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// Weight management follow-up carry-forward.
//
// Raised via Janey (PPH, Jul 2026) by the pharmacist running their
// Mounjaro clinics: every follow-up meant re-entering the height and
// working through the whole initiation consultation again. Height does
// not change and the previous weight and dose are already on file.
//
// Given the patient just picked from the returning-patient search, this
// fetches the distilled values from their last weight management
// consultation at this pharmacy. The consuming tool decides what to do
// with them; nothing is written automatically without the pharmacist
// seeing it.
// ─────────────────────────────────────────────────────────────────────────

export interface PreviousWeightConsultation {
  consultationId: string;
  pgdSlug: string;
  consultationDate: string;
  consultationCount: number;
  heightCm: number | null;
  lastWeightKg: number | null;
  baselineWeightKg: number | null;
  product: string | null;
  dose: string | null;
}

export function usePreviousWeightConsultation() {
  const [previous, setPrevious] = useState<PreviousWeightConsultation | null>(null);
  const [loading, setLoading] = useState(false);

  const clear = useCallback(() => setPrevious(null), []);

  const lookup = useCallback(
    async (
      patient: Partial<BasePatientDetails>,
      onFound?: (p: PreviousWeightConsultation) => void,
    ) => {
      const { firstName, lastName, dateOfBirth } = patient;
      if (!firstName || !lastName || !dateOfBirth) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          firstName: String(firstName),
          lastName: String(lastName),
          dateOfBirth: String(dateOfBirth),
        });
        const res = await fetch(`/api/dashboard/previous-consultation?${qs}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          found: boolean;
          previous?: PreviousWeightConsultation;
        };
        if (data.found && data.previous) {
          setPrevious(data.previous);
          onFound?.(data.previous);
        } else {
          setPrevious(null);
        }
      } catch {
        // Silent: carry-forward is a convenience, never a blocker.
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { previous, loading, lookup, clear };
}

/** Human summary of what was carried forward, for the banner. */
export function describePrevious(p: PreviousWeightConsultation): string {
  const bits: string[] = [];
  if (p.heightCm !== null) bits.push(`height ${p.heightCm} cm`);
  if (p.lastWeightKg !== null) bits.push(`last weight ${p.lastWeightKg} kg`);
  if (p.dose) bits.push(`dose ${p.dose}`);
  return bits.length > 0 ? bits.join(", ") : "no measurements recorded";
}
