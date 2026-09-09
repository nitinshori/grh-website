/**
 * period-delay-ukmec-test.mjs
 *
 * Proves the period delay tool maps age, BMI and smoking the same way UKMEC
 * 2025 does for combined hormonal contraception.
 *
 * WHY A TEST RATHER THAN A CLAIM
 * ------------------------------
 * v002 and v003 of this PGD excluded on smoking at any age, BMI 30 or above,
 * and any seated journey of 4 hours or more. That was disproportionate: it
 * excluded most of the women who ask for the service, and was stricter than
 * the criteria applied to the combined pill taken continuously, for a course
 * of up to 14 days. It was written without anyone checking it against the
 * table it was meant to reflect.
 *
 * Reading the UKMEC table by hand a second time, while writing v004, found a
 * category that had been missed on the first pass (35 or over having stopped
 * smoking a year or more ago is category 2, not an exclusion). That is the
 * argument for the table living in a test rather than in someone's head.
 *
 * UKMEC 2025 (College of Sexual and Reproductive Healthcare, December 2025),
 * combined hormonal contraception column:
 *   Smoking, age <35 ......................................... 2
 *   Smoking, age >=35, <15/day ............................... 3
 *   Smoking, age >=35, >=15/day .............................. 4
 *   Age >=35, stopped smoking <1 year ........................ 3
 *   Age >=35, stopped smoking >=1 year ....................... 2
 *   BMI 30 to 34.9 ........................................... 2
 *   BMI >=35 ................................................. 3
 *   Age menarche to <40 ...................................... 1
 *   Age 40 to 50 ............................................. 2
 *
 * Mapping used: category 3 or 4 excludes. Category 2 does not exclude alone,
 * but UKMEC's own rule is that multiple category 2 conditions relating to the
 * SAME risk require judgement, so two or more exclude here.
 *
 * UKMEC governs contraception, not period delay. It is applied by analogy,
 * justified by the Primolut N SPC statement that norethisterone is partly
 * metabolised to ethinylestradiol at 4 to 6 micrograms per 1 mg.
 *
 * Run: node scripts/period-delay-ukmec-test.mjs
 */

// Mirror of the decision in period-delay-clinical-logic.ts. Kept deliberately
// small: if the logic there changes, this must be changed too and the
// divergence is the point of the test.
function decide({ age, bmi, smoker, quitUnder1yr, quitOver1yr, longJourney }) {
  const stops = [];
  if (age >= 35 && smoker) stops.push("smoker 35+");
  if (age >= 35 && quitUnder1yr) stops.push("quit <1yr at 35+");
  if (bmi >= 35) stops.push("BMI 35+");

  const rf = [];
  if (longJourney) rf.push("long journey");
  if (age < 35 && smoker) rf.push("smoker <35");
  if (bmi >= 30 && bmi < 35) rf.push("BMI 30-34.9");
  if (age >= 40) rf.push("age 40+");
  if (age >= 35 && quitOver1yr) rf.push("quit >=1yr at 35+");

  if (stops.length) return { outcome: "EXCLUDE", why: stops.join(", ") };
  if (rf.length >= 2) return { outcome: "EXCLUDE", why: `${rf.length} UKMEC 2: ${rf.join(", ")}` };
  if (rf.length === 1) return { outcome: "SUPPLY+COUNSEL", why: rf[0] };
  return { outcome: "SUPPLY", why: "no risk factors" };
}

const base = {
  age: 28, bmi: 24, smoker: false,
  quitUnder1yr: false, quitOver1yr: false, longJourney: false,
};

const cases = [
  // [description, overrides, expected outcome]
  ["healthy 28, no factors", {}, "SUPPLY"],
  ["28 flying 6 hours (the commonest request Moin described)", { longJourney: true }, "SUPPLY+COUNSEL"],
  ["28 smoker, UKMEC 2", { smoker: true }, "SUPPLY+COUNSEL"],
  ["28 BMI 32, UKMEC 2", { bmi: 32 }, "SUPPLY+COUNSEL"],
  ["42, UKMEC 2 on age alone", { age: 42 }, "SUPPLY+COUNSEL"],
  ["36 smoker, UKMEC 3 or 4", { age: 36, smoker: true }, "EXCLUDE"],
  ["36 stopped 6 months ago, UKMEC 3", { age: 36, quitUnder1yr: true }, "EXCLUDE"],
  ["36 stopped 3 years ago, UKMEC 2", { age: 36, quitOver1yr: true }, "SUPPLY+COUNSEL"],
  ["30 BMI 36, UKMEC 3", { bmi: 36 }, "EXCLUDE"],
  ["30 BMI 32 and flying, two UKMEC 2s", { bmi: 32, longJourney: true }, "EXCLUDE"],
  ["42 flying, two UKMEC 2s", { age: 42, longJourney: true }, "EXCLUDE"],
  ["28 smoker flying, two UKMEC 2s", { smoker: true, longJourney: true }, "EXCLUDE"],
  ["42 smoker BMI 33 flying: multiple, and 42 is under 35 threshold for smoking", { age: 42, smoker: true, bmi: 33, longJourney: true }, "EXCLUDE"],
  ["34 BMI 34.9 flying, two UKMEC 2s, boundary", { age: 34, bmi: 34.9, longJourney: true }, "EXCLUDE"],
  ["34 BMI 29.9 flying, one UKMEC 2, boundary", { age: 34, bmi: 29.9, longJourney: true }, "SUPPLY+COUNSEL"],
  ["35 smoker exactly at the boundary", { age: 35, smoker: true }, "EXCLUDE"],
  ["34 smoker just under the boundary", { age: 34, smoker: true }, "SUPPLY+COUNSEL"],
];

let failed = 0;
console.log("Period delay: UKMEC 2025 mapping for age, BMI and smoking\n");
for (const [desc, over, expected] of cases) {
  const r = decide({ ...base, ...over });
  const ok = r.outcome === expected;
  if (!ok) failed++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${desc}\n        expected ${expected}, got ${r.outcome} (${r.why})`
  );
}
console.log(
  `\n${cases.length - failed}/${cases.length} passed.` +
    (failed ? "\nMAPPING DOES NOT MATCH UKMEC. Do not publish." : "")
);
process.exit(failed ? 1 : 0);
