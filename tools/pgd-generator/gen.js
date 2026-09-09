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
  return [h('Authorisation',HeadingLevel.HEADING_2),
   tbl([row('Version',d.version),row('Supersedes',d.supersedes),row('Valid from date',d.validFrom||'7 September 2026'),row('Expiry date',d.expiry||'31 July 2027')]),
   p(''),
   tbl([row('Doctor',[{text:'Name: Nitin Shori'},{text:'Job title: Medical Director, Get Real Health'},{text:'GMC: 6047293'},{text:'Signed: N. Shori',b:true},{text:'Date: '+(d.sigDate||'7 September 2026')}]),
        row('Pharmacist',[{text:'Name: Chris Pilkington'},{text:'Job title: Head Pharmacist, Get Real Health'},{text:'GPhC: 2046322'},{text:'Signed: C. Pilkington',b:true},{text:'Date: '+(d.sigDate||'7 September 2026')}])]),
   p(''),
   p('Both authorising signatories reviewed this version together on '+(d.sigDate||'7 September 2026')+' and gave their authorisation for it to be issued. Signatures were applied digitally on their joint instruction, which is the established process for Get Real Health PGDs.',{i:true,color:GREY}),
   p(''),p('Adoption by the employing organisation',{b:true}),
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
        ...Array.from({length:6},()=>row('................................','................................  |  ..................  |  ................................  |  ................'))]),
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

function build(d){
  assertPublishable(d);
  const kids=[p(d.banner,{b:true,color:RED,size:22,align:AlignmentType.CENTER}),p(''),
    h(d.title,HeadingLevel.HEADING_1),
    p(d.strap,{color:GREY})];
  d.intro.forEach(x=>kids.push(typeof x==='string'?p(x):(x.h?h(x.h,HeadingLevel.HEADING_2):(x.bullet?bl(x.bullet,x):p(x.text,x)))));
  d.arms.forEach(a=>armBlock(a).forEach(k=>kids.push(k)));
  if(d.appendix){kids.push(new Paragraph({children:[new PageBreak()]}));d.appendix.forEach(x=>kids.push(typeof x==='string'?p(x):(x.h?h(x.h,HeadingLevel.HEADING_1):(x.bullet?bl(x.bullet,x):(x.tbl?tbl(x.tbl.map(r=>row(r[0],r[1]))):p(x.text,x))))));}
  sig(d).forEach(k=>kids.push(k));
  return new Document({creator:'Get Real Health',title:d.title,
    sections:[{properties:{page:{margin:{top:900,right:900,bottom:900,left:900}}},children:kids}]});
}
module.exports={build,Packer,fs};
