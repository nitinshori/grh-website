"use client";

import React, { useMemo } from "react";
import { SmokingAssessment } from "../lib/smoking-types";
import { calculateFagerstromScore, interpretFagerstromScore } from "../lib/smoking-clinical-logic";

interface FagerstromScoreProps {
  assessment: SmokingAssessment;
  onChange: (updatedAssessment: SmokingAssessment) => void;
}

export const FagerstromScore: React.FC<FagerstromScoreProps> = ({
  assessment,
  onChange,
}) => {
  const score: number = useMemo(
    () => calculateFagerstromScore(assessment),
    [assessment]
  );

  const interpretation = useMemo(
    () => interpretFagerstromScore(score),
    [score]
  );

  const handleTimeToFirstCigaretteChange = (value: string): void => {
    onChange({
      ...assessment,
      timeToFirstCigarette: value as
        | "within-5"
        | "6-30"
        | "31-60"
        | ">60"
        | "",
    });
  };

  const handleDifficultToRefrain = (value: boolean): void => {
    onChange({
      ...assessment,
      difficultToRefrain: value,
    });
  };

  const handleWhichCigaretteMostHate = (value: string): void => {
    onChange({
      ...assessment,
      whichCigaretteMostHateToGiveUp: value as "first-morning" | "other" | "",
    });
  };

  const handleHowManyPerDay = (value: string): void => {
    onChange({
      ...assessment,
      howManyPerDay: value as "10-or-less" | "11-20" | "21-30" | "31+" | "",
    });
  };

  const handleSmokeMoreInMorning = (value: boolean): void => {
    onChange({
      ...assessment,
      smokeMoreInMorning: value,
    });
  };

  const handleSmokeWhenIll = (value: boolean): void => {
    onChange({
      ...assessment,
      smokeWhenIll: value,
    });
  };

  const getScoreColor = (): string => {
    if (score <= 2) return "bg-green-100 border-green-300";
    if (score <= 4) return "bg-amber-100 border-amber-300";
    if (score <= 6) return "bg-orange-100 border-orange-300";
    if (score <= 8) return "bg-red-100 border-red-300";
    return "bg-red-200 border-red-400";
  };

  const getBadgeColor = (): string => {
    if (score <= 2) return "bg-green-500 text-white";
    if (score <= 4) return "bg-amber-500 text-white";
    if (score <= 6) return "bg-orange-500 text-white";
    if (score <= 8) return "bg-red-500 text-white";
    return "bg-red-700 text-white";
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 border-2 rounded-lg ${getScoreColor()}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Fagerström Test Score</h3>
            <p className="text-sm text-gray-700 mt-1">{interpretation.category}</p>
          </div>
          <div className={`text-4xl font-bold px-4 py-2 rounded ${getBadgeColor()}`}>
            {score}/10
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Question 1 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            1. How soon after waking do you smoke your first cigarette?
          </label>
          <div className="space-y-2">
            {[
              { value: "within-5", label: "Within 5 minutes (3 points)", points: 3 },
              { value: "6-30", label: "6-30 minutes (2 points)", points: 2 },
              { value: "31-60", label: "31-60 minutes (1 point)", points: 1 },
              { value: ">60", label: "More than 60 minutes (0 points)", points: 0 },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="timeToFirstCigarette"
                  value={option.value}
                  checked={assessment.timeToFirstCigarette === option.value}
                  onChange={(e) =>
                    handleTimeToFirstCigaretteChange(e.target.value)
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={assessment.difficultToRefrain}
              onChange={(e) => handleDifficultToRefrain(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-900">
              2. Do you find it difficult to refrain from smoking in places where
              it is forbidden (e.g., church, library, cinema)? (1 point if yes)
            </span>
          </label>
        </div>

        {/* Question 3 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            3. Which cigarette would be most difficult to give up?
          </label>
          <div className="space-y-2">
            {[
              { value: "first-morning", label: "The first one in the morning (1 point)" },
              { value: "other", label: "Any other (0 points)" },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="whichCigaretteMostHate"
                  value={option.value}
                  checked={
                    assessment.whichCigaretteMostHateToGiveUp === option.value
                  }
                  onChange={(e) => handleWhichCigaretteMostHate(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 4 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            4. How many cigarettes per day do you smoke?
          </label>
          <div className="space-y-2">
            {[
              { value: "10-or-less", label: "10 or less (0 points)", points: 0 },
              { value: "11-20", label: "11-20 (1 point)", points: 1 },
              { value: "21-30", label: "21-30 (2 points)", points: 2 },
              { value: "31+", label: "31 or more (3 points)", points: 3 },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="howManyPerDay"
                  value={option.value}
                  checked={assessment.howManyPerDay === option.value}
                  onChange={(e) => handleHowManyPerDay(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 5 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={assessment.smokeMoreInMorning}
              onChange={(e) => handleSmokeMoreInMorning(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-900">
              5. Do you smoke more in the morning than in the afternoon?
              (1 point if yes)
            </span>
          </label>
        </div>

        {/* Question 6 */}
        <div className="border rounded-lg p-4 bg-white">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={assessment.smokeWhenIll}
              onChange={(e) => handleSmokeWhenIll(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-900">
              6. Do you smoke when you are ill and have to stay in bed?
              (1 point if yes)
            </span>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">Fagerström Score Interpretation:</span>
        </p>
        <ul className="text-xs text-gray-700 mt-2 space-y-1">
          <li>
            <span className="text-green-600 font-semibold">0-2:</span> Low dependence
          </li>
          <li>
            <span className="text-amber-600 font-semibold">3-4:</span> Low to moderate
            dependence
          </li>
          <li>
            <span className="text-orange-600 font-semibold">5-6:</span> Moderate dependence
          </li>
          <li>
            <span className="text-red-600 font-semibold">7-8:</span> High dependence
          </li>
          <li>
            <span className="text-red-700 font-semibold">9-10:</span> Very high dependence
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3">
          Higher scores indicate greater nicotine dependence and may require more intensive
          support and monitoring during treatment.
        </p>
      </div>
    </div>
  );
};
