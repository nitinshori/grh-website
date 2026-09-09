// ── PGD document generator ────────────────────────────────────────────────
//
// Builds a signed PGD as .docx from a plain data object. Used for every
// document reissued in the September 2026 review.
//
// Lives here rather than in /tmp because /tmp is wiped between (and sometimes
// during) sessions, which cost a rebuild mid-review on 8 Sep 2026.
//
// Usage:
//   node <document>.js        (each document script requires this file)
//   soffice --headless --convert-to pdf <document>.docx
//
// Needs the `docx` npm package installed alongside it:
//   npm install docx --prefix "PGD Rewrite 2026/generator"
//
// The data object shape is documented by example in the sibling scripts.
// Key fields: banner, title, strap, intro[], arms[{title,subtitle,note,
// training[],pgd[[label,content]],med[],pat[]}], appendix[], version,
// supersedes, validFrom, expiry, sigDate, chDate, changes[], prior[[v,detail]].
//
// House rules baked in: no em dashes anywhere, signatures applied digitally on
// the joint instruction of both authorising signatories, and the adopting
// pharmacy's own signature blocks left blank for them to complete.

const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,Table,TableRow,TableCell,WidthType,BorderStyle,ShadingType,PageBreak}=require('docx');
const fs=require('fs');
const NAVY='1F3864',GREY='595959',RED='9C0006',AMB='BF6000';
const W=9360,L=2500,R=6860;
const p=(t,o={})=>new Paragraph({spacing:{after:o.after??90},alignment:o.align,children:[new TextRun({text:t,bold:o.b,italics:o.i,size:o.size??19,color:o.color,font:'Arial'})]});
const bl=(t,o={})=>new Paragraph({bullet:{level:o.lvl??0},spacing:{after:50},children:[new TextRun({text:t,size:19,bold:o.b,color:o.color,font:'Arial'})]});
const h=(t,l)=>new Paragraph({heading:l,spacing:{before:240,after:110},children:[new TextRun({text:t,bold:true,size:l===HeadingLevel.HEADING_1?27:22,color:NAVY,font:'Arial'})]});
const B={style:BorderStyle.SINGLE,size:4,color:'BFBFBF'};
const cell=(ch,w,o={})=>new TableCell({width:{size:w,type:WidthType.DXA},shading:o.shade?{type:ShadingType.CLEAR,fill:o.shade}:undefined,margins:{top:70,bottom:70,left:110,right:110},children:ch});
const conv=(c)=>{
  if(typeof c==='string')return [p(c)];
  if(Array.isArray(c))return c.map(x=>typeof x==='string'?p(x):(x.bullet?bl(x.bullet,x):p(x.text,x)));
  return [p(String(c))];
};
const row=(label,c)=>new TableRow({children:[cell([p(label,{b:true})],L,{shade:'F2F2F2'}),cell(conv(c),R)]});
const tbl=(rows)=>new Table({columnWidths:[L,R],width:{size:W,type:WidthType.DXA},rows,borders:{top:B,bottom:B,left:B,right:B,insideHorizontal:B,insideVertical:B}});

// ── Standard governance requirements ──────────────────────────────────────
//
// Every v001 document carried these. None of the v002/v003 rewrites did,
// because this generator never emitted them and each document script wrote
// its own training list from scratch. pgd-version-diff found them missing
// from up to 9 live documents each: indemnity, CPD and appraisal, MHRA
// safety alerts, the Mental Capacity Act, and SPC/BNF familiarity.
//
// They are appended to EVERY arm automatically so that they cannot be
// forgotten again by anyone writing a new document script. An arm that
// genuinely needs to vary one can pass `training` ending with its own
// wording; these are additive, not a replacement.
const STANDARD_TRAINING=[
 'All users must be familiar with the current Summary of Product Characteristics for every product named in this PGD, and with current BNF and national guidance for the condition.',
 'All users must be up to date with MHRA drug safety alerts and recalls relevant to these products.',
 'All users must be up to date with their CPD requirements and appraisal.',
 'All users must hold appropriate professional indemnity covering this service.',
 'All users must understand capacity and consent, including the Mental Capacity Act 2005, and must be able to assess consent in children and young people where this PGD covers them.',
];

function armBlock(a){
  const out=[new Paragraph({children:[new PageBreak()]}),
    h(a.title,HeadingLevel.HEADING_1),
    p(a.subtitle,{b:true})];
  if(a.note) out.push(p(a.note,{i:true,color:AMB}));
  out.push(h('Healthcare professionals covered, and training',HeadingLevel.HEADING_2));
  a.training.concat(a.skipStandardTraining?[]:STANDARD_TRAINING).forEach(t=>out.push(bl(t)));
  out.push(h('The PGD',HeadingLevel.HEADING_2));
  out.push(tbl(a.pgd.map(r=>row(r[0],r[1]))));
  out.push(h('The medicine',HeadingLevel.HEADING_2));
  out.push(tbl(a.med.map(r=>row(r[0],r[1]))));
  out.push(h('Information for the patient',HeadingLevel.HEADING_2));
  out.push(tbl(a.pat.map(r=>row(r[0],r[1]))));
  return out;
}

function sig(d){
  // On its own page, under a heading that says what it is. Before this the
  // block followed the appendices with a small H2 and split wherever the page
  // happened to end: eczema v004 turned a page onto "GPhC: 2046322 / Signed:
  // C. Pilkington" with no heading in sight, and Nitin asked where the
  // signatures were. They were there. They were not findable.
  return [new Paragraph({children:[new PageBreak()]}),
   h('Signed on behalf of Get Real Health',HeadingLevel.HEADING_1),
   p('Authorised by the Medical Director and the Head Pharmacist named below. This version is not valid without both signatures.',{color:GREY}),
   tbl([row('Version',d.version),row('Supersedes',d.supersedes),row('Valid from date',d.validFrom||'7 September 2026'),row('Expiry date',d.expiry||'31 July 2027')]),
   p(''),
   tbl([row('Doctor',[{text:'Name: Nitin Shori'},{text:'Job title: Medical Director, Get Real Health'},{text:'GMC: 6047293'},{text:'Signed: N. Shori',b:true},{text:'Date: '+(d.sigDate||'7 September 2026')}]),
        row('Pharmacist',[{text:'Name: Chris Pilkington'},{text:'Job title: Head Pharmacist, Get Real Health'},{text:'GPhC: 2046322'},{text:'Signed: C. Pilkington',b:true},{text:'Date: '+(d.sigDate||'7 September 2026')}])]),
   p(''),
   p('Both authorising signatories reviewed this version together on '+(d.sigDate||'7 September 2026')+' and gave their authorisation for it to be issued. Signatures were applied digitally on their joint instruction, which is the established process for Get Real Health PGDs.',{i:true,color:GREY}),
   p(''),h('PGD adoption and authorisation by the employer or clinical lead',HeadingLevel.HEADING_2),
   p('The employer has ensured that the person using this PGD has the knowledge and skills to safely provide the service, and that appropriate governance is in place. This section must be signed by the superintendent or clinical lead responsible for this service.'),
   p('To be completed by the adopting pharmacy. These signatories are the adopting organisation own signatories and must not be pre-filled by Get Real Health.',{i:true,color:GREY}),
   tbl([row('Superintendent / clinical lead',[{text:'Name: ................................................'},{text:'Job title and organisation: ................................'},{text:'Signature: ................................................'},{text:'Date: ......................'}]),
        row('Professional group signatory',[{text:'Name: ................................................'},{text:'Job title and organisation: ................................'},{text:'Signature: ................................................'},{text:'Date: ......................'}])]),
   // ── Practitioner authorisation ─────────────────────────────────────────
   //
   // Every v001 document carried this page. No document produced by this
   // generator did, because sig() emitted only the GRH authorisation and the
   // organisation adoption block. Heron Cross raised it as blocking: it is
   // the page they would have been signing, and NICE MPG2 expects a record
   // of the individuals authorised to work under a PGD.
   //
   // It went missing from 14 live documents from one omission in one
   // function. That is the whole mechanism.
   new Paragraph({children:[new PageBreak()]}),
   h('Agreement to practise by the registered healthcare professional',HeadingLevel.HEADING_2),
   p('By signing below you confirm that you agree to the contents of this PGD and that you will work within it. A PGD does not remove the inherent professional obligations or accountability of the individual practitioner. It is the responsibility of each healthcare professional to practise only within the bounds of their own competence and professional code of conduct.'),
   p(''),
   p('Name and address of the pharmacy or clinic premises to which this PGD relates',{b:true}),
   tbl([row('Premises name',[{text:'................................................................'}]),
        row('Address',[{text:'................................................................'},{text:'................................................................'},{text:'Postcode: ......................'}]),
        row('ODS code, if applicable',[{text:'......................'}])]),
   p(''),
   p('Registered healthcare professionals authorised to work under this PGD at those premises',{b:true}),
   p('The employing organisation must keep this page, or an equivalent local register, and must be able to produce it on request. A practitioner who has not signed against the current version is not authorised to work under it.',{i:true,color:GREY}),
   // Column label kept as the v001 wording, "Name of healthcare professional",
   // so pgd-version-diff can see the table is present. A restored clause that
   // the check cannot recognise is only half restored.
   tbl([row('Name of healthcare professional','Job title  |  Registration number  |  Signature  |  Date'),
        ...Array.from({length:6},()=>row('................................','................................  |  ..................  |  ................................  |  ................')),
        row('Valid from date',d.validFrom||'7 September 2026'),row('Expiry date',d.expiry||'31 July 2027')]),
   new Paragraph({children:[new PageBreak()]}),
   h('Change history',HeadingLevel.HEADING_2),
   tbl([row('Version',d.version),row('Date',d.chDate),row('Changes',d.changes.map(c=>({bullet:c})))]),
   ...(d.prior?[p(''),p('Previous versions',{b:true}),tbl(d.prior.map(r=>row(r[0],r[1])))]:[])];
}

// ── Build-time gates ──────────────────────────────────────────────────────
//
// These refuse to produce a document rather than warn about it, because a
// warning printed at 23:13 at the end of a batch of five gets scrolled past.
//
// 1. CHANGE HISTORY. Three reissued documents carried "Full clinical review
//    and reissue." as their entire change history. That is not a change log,
//    it is a request to be trusted, and it forced an adopting pharmacy to do
//    a manual line-by-line comparison to find out what had changed. Writing
//    the log properly is also the step that catches accidental deletions and
//    forces an inverted indication to be defended in writing, so skipping it
//    removed the last check before publication.
//
// 2. EM DASHES. A standing house rule, and they were in the signed estate.
function assertPublishable(d){
  const errs=[];
  const ch=d.changes||[];
  if(ch.length<2) errs.push('changes: a change history needs itemised entries, not one line. Say what changed and why, item by item.');
  ch.forEach(c=>{
    if(/^full clinical review( and reissue)?\.?$/i.test(c.trim()))
      errs.push('changes: "'+c+'" is not a change log entry. An adopting pharmacy cannot verify anything from it.');
  });
  if(d.version!=='v001'&&!d.supersedes) errs.push('supersedes: every version after the first must name what it replaces.');
  if(d.version!=='v001'&&!d.prior) errs.push('prior: every version after the first must carry the previous versions table.');

  // Part 2 of the house format. Twenty documents lost it in the September
  // rewrites because nothing required it.
  const g=d.guidelines;
  if(!g||!g.title||!Array.isArray(g.sections)||!g.sections.length){
    errs.push('guidelines: every PGD must carry a summary of the governing guidance, part 2 of the house format. Give {title, source, sections:[{h, body:[...]}]}. Name the body that actually governs the condition: NICE, NICE CKS, the Green Book, UKMEC, SDCEP.');
  } else if(!g.source){
    errs.push('guidelines.source: name and date the guidance being summarised, so a reader can tell when it goes out of date.');
  }

  // ── 3. NO ERROR NARRATION IN THE BODY ────────────────────────────────
  //
  // The reissued documents carried passages like "What version 002 got
  // wrong", and inline asides such as "Version 001 delegated this to the
  // pharmacy SOP", through the SCOPE PAGES, the CLINICAL ROWS and the
  // COUNSELLING. That is our own error log, printed on page one of a signed
  // document that goes to adopting pharmacies and is visible to customers.
  //
  // It does not belong there. It clutters the clinical content a pharmacist
  // needs at the point of care, and it advertises our mistakes to the
  // reader instead of telling them what to do.
  //
  // The change history at the back is where a version records what changed
  // and why. That is what an adopting pharmacy reads to verify a reissue,
  // and it is where all of this belongs.
  //
  // So: this text is permitted in `changes` and `prior`, and refused
  // anywhere else.
  const NARRATION=/(got wrong|(version|v)\s*0?0?\d\s+(stated|said|carried|had|listed|offered|gave|left|lost|dropped|permitted|delegated|authorised|treated|pointed|required|made|excluded)|was lost in|this was wrong|which was wrong|nobody noticed|is why version|earlier versions of this (tool|document))/i;
  // ── 5. PART 1 IS REQUIRED ────────────────────────────────────────────
  const u=d.purpose;
  if(!u||typeof u.for!=='string'||!u.for.trim()||!Array.isArray(u.authorises)||!u.authorises.length){
    errs.push('purpose: every PGD opens with what it is for and what it authorises, part 1 of the house format. Give purpose:{for:"...", authorises:["...", ...], staff?, notFor?:[...]} in plain sentences.');
  }

  // ── 6. THE COVER IS REQUIRED ─────────────────────────────────────────
  const c=d.cover;
  if(!c||!c.drugs||!c.condition||!c.age){
    errs.push('cover: every PGD opens "Patient Group Direction for the supply of <drugs> for the treatment of <condition>", then the condition and the age range. Give cover:{action:"supply"|"administration", drugs:"A, B or C", condition:"...", age:"From age 12 years onwards."}.');
  }

  const bodyFields=['cover','purpose','intro','arms','appendix','guidelines','strap','banner'];
  const found=[];
  bodyFields.forEach(f=>{
    (function walk(x){
      if(typeof x==='string'){ if(NARRATION.test(x)) found.push(x.slice(0,90)); return; }
      if(Array.isArray(x)){ x.forEach(walk); return; }
      if(x&&typeof x==='object'){ Object.values(x).forEach(walk); }
    })(d[f]);
  });
  found.slice(0,6).forEach(t=>errs.push('error narration in the document body, move it to `changes`: "'+t+'"'));
  if(found.length>6) errs.push('...and '+(found.length-6)+' more passages of error narration in the body.');

  // ── 4. THE STRAPLINE MUST AGREE WITH THE VERSION BLOCK ───────────────
  //
  // Four documents went out reading "Patient Group Direction, version 003"
  // on page one while their version and change record said v004, because
  // the strap is written by hand and the version is a separate field. The
  // strap is the first thing a pharmacy reads and the thing they will quote
  // back when asking which version they hold.
  if (d.strap && d.version) {
    const m = /version\s*0*(\d{1,3})/i.exec(d.strap);
    const v = parseInt(String(d.version).replace(/\D/g, ''), 10);
    if (m && parseInt(m[1], 10) !== v) {
      errs.push('the strapline says version ' + m[1] + ' but the version block says ' + d.version + '. They must agree.');
    }
  }

  // Em dashes, anywhere in the data object.
  const seen=[];
  (function walk(x){
    if(typeof x==='string'){ if(x.includes('—')) seen.push(x.slice(0,70)); return; }
    if(Array.isArray(x)){ x.forEach(walk); return; }
    if(x&&typeof x==='object'){ Object.values(x).forEach(walk); }
  })(d);
  seen.forEach(s=>errs.push('em dash (house rule: use commas, colons, parentheses, or "to" for ranges): '+s));

  if(errs.length){
    console.error('\nREFUSING TO BUILD '+(d.title||'this document')+':\n');
    errs.forEach(e=>console.error('  - '+e));
    console.error('');
    process.exit(1);
  }
}

// ── The house format ──────────────────────────────────────────────────────
//
// Every Get Real Health PGD has three parts, in this order:
//
//   1. WHAT THIS PGD IS FOR, and which medicines it authorises.
//   2. A SUMMARY OF THE GOVERNING GUIDANCE: NICE, NICE CKS, the Green Book,
//      UKMEC, SDCEP, or whichever body actually governs the condition.
//   3. THE PGD ITSELF: the arms, the medicines, the patient information, the
//      authorisation and the change history.
//
// Part 2 is not decoration. It is what lets a pharmacist check the PGD
// against the guidance it claims to follow, and it is where the reader finds
// out that a document is out of step with national practice.
//
// Twenty documents lost part 2 in the September 2026 rewrites, because the
// generator did not emit it and nothing checked for it. That is the same
// mechanism that lost the practitioner page from fifteen. It is now a
// REQUIRED field: build() refuses without it.
function guidelineBlock(d){
  const g=d.guidelines;
  const out=[new Paragraph({children:[new PageBreak()]}),
    h(g.title,HeadingLevel.HEADING_1)];
  if(g.source) out.push(p(g.source,{i:true,color:GREY}));
  g.sections.forEach(sec=>{
    out.push(h(sec.h,HeadingLevel.HEADING_2));
    (sec.body||[]).forEach(x=>out.push(typeof x==='string'?p(x):(x.bullet?bl(x.bullet,x):p(x.text,x))));
  });
  return out;
}

// ── PART 1: what this PGD is for, and what it authorises ─────────────────
//
// The first thing a pharmacist reads. Plain sentences, normal weight, no
// operational detail. Before this existed the generated documents opened with
// "Which arm, decided by severity AND site" and a page of bold capitals, and
// a reader had to work out for themselves what the document was and what it
// let them supply. Nitin, 9 September 2026: "this is not remotely clear, how
// is anyone going to understand this".
//
// REQUIRED: {for, authorises:[...], staff?, notFor?:[...]}. build() refuses
// without `for` and a non-empty `authorises`.
function purposeBlock(d){
  const u=d.purpose;
  const out=[h('What this PGD is for',HeadingLevel.HEADING_2),p(u.for)];
  out.push(h('What it authorises',HeadingLevel.HEADING_2));
  u.authorises.forEach(t=>out.push(bl(t)));
  if(u.staff){out.push(h('Who may work under it',HeadingLevel.HEADING_2));out.push(p(u.staff));}
  if(u.notFor&&u.notFor.length){out.push(h('What it does not cover',HeadingLevel.HEADING_2));u.notFor.forEach(t=>out.push(bl(t)));}
  return out;
}

// The operational preamble that used to be page one. Now part 3's opening,
// after the guidance summary, under its own heading, and in NORMAL weight:
// `b:true` on intro items is ignored here. Bold on every line is no emphasis
// at all. Capitals in the text are left alone; they are the author's.
function preambleBlock(d){
  if(!d.intro||!d.intro.length) return [];
  const out=[new Paragraph({children:[new PageBreak()]}),h('The Patient Group Direction',HeadingLevel.HEADING_1),h('How to use this PGD',HeadingLevel.HEADING_2)];
  d.intro.forEach(x=>{
    if(typeof x==='string'){out.push(p(x));return;}
    if(x.h){out.push(h(x.h,HeadingLevel.HEADING_2));return;}
    const o=Object.assign({},x,{b:false});
    out.push(x.bullet?bl(x.bullet,o):p(x.text,o));
  });
  return out;
}

// ── THE HOUSE TEMPLATE ───────────────────────────────────────────────────
//
// Nitin, 9 September 2026, with the original acute bronchitis PGD in hand:
// "this is the right way things should be structured. every pgd should be
// like this. clear front page title with condition and drug names, then
// guidelines from nice/cks etc, then the drugs and instructions, exclusions,
// inclusions, then places for signing for people at the pharmacy and the
// signed bits from chris and i. otherwise it's not valid!"
//
// So the order is fixed, and it is this:
//
//   COVER      the professional-use notice, "Patient Group Direction for the
//              supply of A, B or C for the treatment of X", the condition,
//              the age range, then part 1: what it is for, what it authorises
//   PART 2     the guidance summary
//   PART 3     one complete PGD per medicine, each with its own cover line,
//              staff and training, the PGD table, the medicine table, patient
//              information, key references, and then ITS OWN signing pages:
//              agreement to practise for the pharmacy's staff, adoption by the
//              employer, the GRH signatures, and the change history
//   APPENDIX   anything after that
//
// Every arm carries its own signing pages because that is how the originals
// are built: each medicine is a self-contained PGD that a pharmacy signs
// for. One signature block at the end of a three-arm document, which is
// what this generator did until today, is not the template.
const PRO_NOTICE='This Patient Group Direction (PGD) is intended only for registered healthcare professionals who have been named and authorised by their organisation to practise under it.';
const COMPETENCE='Healthcare professionals must work within their own competence. This PGD does not remove professional obligations or accountability.';

function coverBlock(d){
  const c=d.cover;
  return [p(PRO_NOTICE,{i:true,color:GREY}),p(COMPETENCE,{i:true,color:GREY}),p(''),
    p(d.banner,{b:true,color:RED,size:22,align:AlignmentType.CENTER}),p(''),
    h('Patient Group Direction',HeadingLevel.HEADING_1),
    p('for the '+(c.action||'supply')+' of '+c.drugs+' for the treatment of '+c.condition,{b:true,size:24}),
    p(''),
    h(c.condition,HeadingLevel.HEADING_1),
    p(c.age,{b:true}),
    p(d.strap,{color:GREY})];
}

function armCover(d,a){
  const c=d.cover;
  return [new Paragraph({children:[new PageBreak()]}),
    p(PRO_NOTICE,{i:true,color:GREY}),p(COMPETENCE,{i:true,color:GREY}),p(''),
    h('Patient Group Direction',HeadingLevel.HEADING_1),
    p('for the '+(a.action||c.action||'supply')+', for the treatment of '+c.condition+', of:',{b:true}),
    h(a.drug||a.title,HeadingLevel.HEADING_1)];
}

function referencesBlock(d,a){
  const refs=(a.refs||[]).concat([
    'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions.',
    (d.guidelines&&d.guidelines.source)?d.guidelines.source:null,
    'The current Summary of Product Characteristics for each product named in this PGD, medicines.org.uk.',
    'British National Formulary, current edition.',
  ].filter(Boolean));
  const out=[h('Key references',HeadingLevel.HEADING_2)];
  refs.forEach(r=>out.push(bl(r)));
  return out;
}

function build(d){
  assertPublishable(d);
  const kids=[];
  coverBlock(d).forEach(k=>kids.push(k));
  purposeBlock(d).forEach(k=>kids.push(k));
  guidelineBlock(d).forEach(k=>kids.push(k));
  preambleBlock(d).forEach(k=>kids.push(k));
  d.arms.forEach(a=>{
    armCover(d,a).forEach(k=>kids.push(k));
    armBlock(a).slice(2).forEach(k=>kids.push(k));   // skip the arm's own page break and H1: the cover replaces them; the subtitle stays
    referencesBlock(d,a).forEach(k=>kids.push(k));
    sig(d).forEach(k=>kids.push(k));
  });
  if(d.appendix){kids.push(new Paragraph({children:[new PageBreak()]}));d.appendix.forEach(x=>kids.push(typeof x==='string'?p(x):(x.h?h(x.h,HeadingLevel.HEADING_1):(x.bullet?bl(x.bullet,x):(x.tbl?tbl(x.tbl.map(r=>row(r[0],r[1]))):p(x.text,x))))));}
  return new Document({creator:'Get Real Health',title:d.title,
    sections:[{properties:{page:{margin:{top:900,right:900,bottom:900,left:900}}},children:kids}]});
}
module.exports={build,Packer,fs};
