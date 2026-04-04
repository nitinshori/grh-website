"use client";

import React, { useEffect } from "react";
import { calculateHoursSinceUPSI } from "../lib/ec-clinical-logic";

interface TimeCalculatorProps {
  upsiDate: string;
  upsiTime: string;
  onHoursUpdate: (hours: number | null) => void;
}

export function TimeCalculator({
  upsiDate,
  upsiTime,
  onHoursUpdate,
}: TimeCalculatorProps) {
  const hours = calculateHoursSinceUPSI(upsiDate, upsiTime);

  // Trigger callback on calculation
  useEffect(() => {
    onHoursUpdate(hours);
  }, [hours, onHoursUpdate]);

  if (!upsiDate || !upsiTime) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
        Enter date and time to calculate hours elapsed
      </div>
    );
  }

  const getStatus = () => {
    if (hours === null) return { label: "", color: "", available: "" };
    if (hours <= 72) {
      return {
        label: "Both medicines available",
        color: "bg-green-50 border-green-200",
        available: "✓ Levonorgestrel (LNG) and Ulipristal (UPA) available",
      };
    }
    if (hours <= 120) {
      return {
        label: "Ulipristal preferred",
        color: "bg-amber-50 border-amber-200",
        available: "✓ Ulipristal (UPA) only (more effective in this window)",
      };
    }
    return {
      label: "Too late for emergency hormonal contraception",
      color: "bg-red-50 border-red-200",
      available: "✗ Refer for copper IUD assessment",
    };
  };

  const status = getStatus();

  return (
    <div className={`p-4 border rounded-lg ${status.color} space-y-3`}>
      <div>
        <p className="text-2xl font-bold text-navy-900">
          {hours !== null ? `${Math.round(hours * 10) / 10} hours` : "—"}
        </p>
        <p className="text-xs text-gray-600 mt-1">since unprotected intercourse</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              hours === null
                ? "bg-gray-300"
                : hours <= 72
                  ? "bg-green-500"
                  : hours <= 120
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
          />
          <span className="text-sm font-semibold text-navy-900">
            {status.label}
          </span>
        </div>

        <p className="text-sm text-gray-700 ml-4">{status.available}</p>
      </div>

      {hours !== null && hours > 120 && (
        <div className="pt-2 border-t border-current/10">
          <p className="text-xs text-gray-600">
            Emergency hormonal contraception is only effective within 120 hours
            of UPSI. Refer patient to GP or sexual health clinic for copper
            intrauterine device (Cu-IUD) assessment.
          </p>
        </div>
      )}
    </div>
  );
}
