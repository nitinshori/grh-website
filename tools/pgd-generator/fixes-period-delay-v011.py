#!/usr/bin/env python3
"""
Period delay v011: a long journey is a counted VTE risk factor, not an exclusion.

Nitin (Medical Director), 24 September 2026, after Rachel Edwards at Smartway
asked whether a low UKMEC score still fell foul of the travel rule: "we need
to loosen the PGD, the four hour thing makes no sense". Long-haul travel is
the commonest reason a woman asks for period delay; excluding every journey
of 4 hours or more turned the service away from most of the people it is
for. From v011 a seated journey of 4 hours or more is recorded and counted
as one VTE risk factor, like aged 40 or over, and the precautions are given.
Smoking, BMI 30 or over, personal or family history, surgery, immobility and
cancer remain exclusions.

  python3 tools/pgd-generator/fixes-period-delay-v011.py          reissue
  python3 tools/pgd-generator/fixes-period-delay-v011.py --dry    build to /tmp only
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "24 September 2026"

SRC = os.path.join(APPROVED, "period-delay-v010-SIGNED.docx")
LIVE = "period-delay-v010.pdf"
VERSION = "v011"
SUPERSEDES = "Version 010, 14 September 2026"

PRECAUTIONS = ("move around at least hourly, keep well hydrated, avoid alcohol and sedatives on the journey, "
               "and consider graduated compression stockings. Seek urgent help for a painful swollen calf, sudden "
               "breathlessness or chest pain, during the course or in the weeks after it.")

EDITS = [
    # cover
    ("replace",
     "Long-haul travel is both the commonest reason a woman asks for this and one of the risk factors. That tension is resolved in favour of safety: a journey of 4 hours or more during the course, or within 2 weeks of finishing it, is an exclusion.",
     "Long-haul travel is both the commonest reason a woman asks for this and one of the risk factors. A seated journey of 4 hours or more during the course, or within 2 weeks of finishing it, is not an exclusion on its own: it is recorded and counted as one venous thromboembolism risk factor, and the journey precautions are given. Where it is the only counted factor, supply. Where another counted factor is also present, the pharmacist weighs the risks and benefits and records the decision."),
    ("replace",
     "Where a woman is excluded only because of travel, tell her what she can do instead. See Appendix 2.",
     "Where a woman is excluded for another reason, tell her what she can do instead. See Appendix 2."),
    # exclusion bullet -> removed; long journey moves to counted factors
    ("delete",
     "A FLIGHT, COACH, TRAIN OR CAR JOURNEY OF 4 HOURS OR MORE during the course, or within 2 weeks of finishing it. This will exclude many holiday requests; that is intended. Give the alternatives in Appendix 2."),
    ("replace",
     "Explain why supply is not appropriate, and give the alternatives in Appendix 2 rather than leaving her with nothing. Where the exclusion is travel-related, say so plainly and explain the reason. Where a safeguarding concern exists, follow the local safeguarding route the same day and record what was done. Document the advice given and the decision reached. Inform or refer to the GP as appropriate.",
     "Explain why supply is not appropriate, and give the alternatives in Appendix 2 rather than leaving her with nothing. Where a safeguarding concern exists, follow the local safeguarding route the same day and record what was done. Document the advice given and the decision reached. Inform or refer to the GP as appropriate."),
    ("replace",
     "The answers to all eight Appendix 1 questions, including smoking status (and whether the patient stopped smoking less than a year ago) and the answer to the question about a journey of 4 hours or more, and the blood pressure measured today.",
     "The answers to all eight Appendix 1 questions, including smoking status (and whether the patient stopped smoking less than a year ago), the answer to the question about a journey of 4 hours or more and, where the answer is yes, that it was counted as a risk factor and the precautions were given, and the blood pressure measured today."),
    # Appendix 1 question 5
    ("replace", "YES: exclude and refer.",
     "YES: not an exclusion on its own. Count it as one venous thromboembolism risk factor, give the journey precautions (move around at least hourly, keep well hydrated, avoid alcohol and sedatives, consider graduated compression stockings) and record that they were given. Where another counted risk factor is also present, weigh the risks and benefits and record the decision."),
    ("replace",
     "This will exclude many holiday requests. That is the intended effect. Give the alternatives in Appendix 2.",
     "Travel is the commonest reason for the request and a journey does not, by itself, take a woman outside this PGD."),
    # risk factor page
    ("replace",
     "The one UKMEC 2025 category 2 factor that this PGD does not exclude. On its own it does not exclude: supply, and counsel on the precautions below.",
     "Two factors that this PGD counts rather than excludes. Either on its own does not exclude: supply, and counsel on the precautions below. Where both are present, or either is present with another venous thromboembolism concern the pharmacist has identified, weigh the risks and benefits and record the decision; refer where in doubt."),
    ("insert_after", "AGED 40 OR OVER. UKMEC 2.",
     ["A SEATED FLIGHT, COACH, TRAIN OR CAR JOURNEY OF 4 HOURS OR MORE during the course, or within 2 weeks of finishing it. Give the journey precautions and record that they were given."]),
    ("replace",
     "SMOKING (any amount, any age), BMI 30 OR OVER, and a SEATED JOURNEY OF 4 HOURS OR MORE are EXCLUSIONS in this PGD (see the exclusion criteria and Appendix 1). They are not risk factors to be counted.",
     "SMOKING (any amount, any age) and BMI 30 OR OVER are EXCLUSIONS in this PGD (see the exclusion criteria and Appendix 1). They are not risk factors to be counted."),
    ("replace",
     "PRECAUTIONS TO GIVE WHERE ANY JOURNEY IS INVOLVED (a seated journey of 4 hours or more excludes): " + PRECAUTIONS,
     "PRECAUTIONS TO GIVE WHERE ANY JOURNEY IS INVOLVED: " + PRECAUTIONS),
]

CHANGES = [
    "A seated flight, coach, train or car journey of 4 hours or more during the course, or within 2 weeks of "
    "finishing it, is no longer an exclusion. It is recorded and counted as one venous thromboembolism risk "
    "factor, alongside aged 40 or over, with the journey precautions given and recorded. On its own it does not "
    "exclude; with another counted factor the pharmacist weighs the risks and benefits and records the decision. "
    "Decision of the Medical Director, 24 September 2026, reversing the position recorded at version 007: the "
    "exclusion turned the service away from most of the women it exists for, and the UKMEC 2025 position on a "
    "single category 2 factor does not support a blanket exclusion. The cover, the exclusion criteria, Appendix 1 "
    "question 5, the records row and the risk factor page all say the same thing. Smoking, BMI 30 or over, "
    "personal or family history of venous thromboembolism, recent or planned surgery, immobility and cancer "
    "remain exclusions.",
]


def main():
    dry = "--dry" in sys.argv
    outdir = "/tmp/pdout" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"period-delay-{VERSION}-SIGNED.docx")
    reissue("period-delay", SRC, out, VERSION, SUPERSEDES, DATE, CHANGES, EDITS,
            publish_to=None if dry else os.path.join(PUBLIC, f"period-delay-{VERSION}.pdf"),
            remove=None if dry else os.path.join(PUBLIC, LIVE))
    print(f'  "period-delay": "period-delay-{VERSION}.pdf",')


if __name__ == "__main__":
    main()
