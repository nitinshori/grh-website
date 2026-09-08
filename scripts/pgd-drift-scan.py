import os,re,sys
import pymupdf
# Run from anywhere: resolve the repo root from this file's location.
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
EPGD=f'{ROOT}/src/app/for-pharmacies/epgd'
DOCS=f'{ROOT}/public/pgd-documents'

# slug -> document filename, from the master manifest
man=open(f'{ROOT}/src/lib/pgd-document-manifest.ts').read()
i=man.index('PGD_MASTER_FILES'); j=man.index('\n}',i)
MASTER=dict(re.findall(r'"([a-z0-9\-]+)"\s*:\s*"(.*?)"', man[i:j]))

acc=open(f'{ROOT}/src/lib/pgd-access.ts').read()
def st(name):
    m=re.search(name+r" = new Set(?:<string>)?\(\[(.*?)\n\]\)", acc, re.S)
    return set(re.findall(r"^\s*'([a-z0-9\-]+)',", m.group(1), re.M)) if m else set()
OFF = st('RETIRED_SLUGS') | st('PAUSED_SLUGS') | st('REBUILDING_SLUGS')

# A vocabulary of medicine names. Only names long enough to be unambiguous.
DRUGS = """amoxicillin flucloxacillin clarithromycin doxycycline azithromycin erythromycin
phenoxymethylpenicillin trimethoprim nitrofurantoin pivmecillinam fosfomycin metronidazole
ciprofloxacin ofloxacin fusidic chloramphenicol mupirocin neomycin gentamicin
aciclovir valaciclovir famciclovir oseltamivir
mebendazole ivermectin permethrin malathion
atovaquone proguanil mefloquine chloroquine primaquine artemether
sildenafil tadalafil vardenafil avanafil dapoxetine finasteride minoxidil tamsulosin
testosterone norethisterone levonorgestrel ulipristal desogestrel estradiol utrogestan
semaglutide tirzepatide liraglutide orforglipron naltrexone bupropion orlistat
atorvastatin simvastatin rosuvastatin amlodipine metformin ramipril
salbutamol prednisolone beclometasone montelukast
betamethasone hydrocortisone clobetasone mometasone calcipotriol tacrolimus pimecrolimus
adapalene lymecycline isotretinoin benzoyl
fluconazole clotrimazole miconazole terbinafine nystatin
melatonin propranolol varenicline nicotine
naproxen mefenamic ibuprofen paracetamol codeine
cetirizine fexofenadine loratadine
ceftriaxone imiquimod podophyllotoxin
emtricitabine tenofovir dolutegravir
methylphenidate lisdexamfetamine
hydroxocobalamin cyanocobalamin folic
dexamethasone acetic
comirnatyxfg comirnaty spikevax nuvaxovid rabipur verorab nimenrix menquadfi menveo
revaxis ixiaro bexsero trumenba shingrix zostavax varivax varilrix gardasil
typhim vivotif dukoral havrix twinrix engerix fendrix stamaril
""".split()

def words(text):
    t=text.lower()
    return {d for d in DRUGS if re.search(r'\b'+re.escape(d), t)}

# A drug named in a tool is only interesting if the tool is OFFERING it. Named
# in an allergy question, an interaction check or a "does the patient take
# this" list, it is a safety check and not a supply. Without this the scan
# flagged metformin, paracetamol and atorvastatin across a dozen tools.
SUPPLY_CUE = re.compile(
    r'(medicine|dose|dosing|regimen|recommend|supply|suppl|treatment:|selectedAntibiotic|'
    r'label:\s*"[^"]*\b(mg|ml|tablet|capsule|sachet)|value:\s*"[^"]*\b(mg|ml))',
    re.I)

def supplied(text, drug):
    """True where the drug name appears near language about giving it."""
    for m in re.finditer(r'\b'+re.escape(drug), text, re.I):
        window = text[max(0, m.start()-160): m.start()+160]
        if SUPPLY_CUE.search(window):
            return True
    return False

def read_tool(slug):
    d=os.path.join(EPGD,slug)
    out=[]
    for dp,_,fns in os.walk(d):
        for fn in fns:
            if re.search(r'\.bak', fn): continue
            if not fn.endswith(('.ts','.tsx')): continue
            try: out.append(open(os.path.join(dp,fn),encoding='utf-8',errors='ignore').read())
            except Exception: pass
    return '\n'.join(out)

def read_doc(slug):
    f=MASTER.get(slug)
    if not f: return None
    p=os.path.join(DOCS,f)
    if not os.path.exists(p): return None
    try:
        d=pymupdf.open(p)
        return ''.join(x.get_text() for x in d)
    except Exception: return None

# Records-retention boilerplate appears in every PGD and always says "adults
# aged 18 years and over" and "children aged under 18". Read naively it makes
# every document look like it has an 18 year floor, which produced three false
# positives on the first run (emergency contraception among them). Strip it.
RECORDS_NOISE = re.compile(
    r'(keep records|audit purposes|25th birthday|26th birthday|records for 8 years)',
    re.I)

def ages(text):
    a=set()
    for line in re.split(r'(?<=[.\n])', text):
        if RECORDS_NOISE.search(line):
            continue
        for m in re.finditer(r'\b(\d{1,2})\s*(?:years?|yrs?)\s*(?:of age\s*)?(?:and\s*(?:over|above)|or\s*(?:over|older|above)|\+)', line, re.I):
            a.add(int(m.group(1)))
        for m in re.finditer(r'aged?\s*(\d{1,2})\s*(?:and|or)\s*(?:over|above|older)', line, re.I):
            a.add(int(m.group(1)))
    return a

rows=[]
slugs=sorted(s for s in os.listdir(EPGD) if os.path.isdir(os.path.join(EPGD,s)) and s not in {'shared','certificate','custom'})
for slug in slugs:
    doc=read_doc(slug)
    tool=read_tool(slug)
    if not tool.strip(): continue
    status = 'OFF' if slug in OFF else ''
    if doc is None:
        rows.append((slug,'NO DOCUMENT','tool exists, no master PDF resolves for this slug',status)); continue
    dt, tt = words(doc), words(tool)
    only_tool = sorted(d for d in (tt-dt) if supplied(tool, d))
    if only_tool:
        rows.append((slug,'MEDICINE OFFERED BY TOOL, NOT IN DOCUMENT', ', '.join(only_tool), status))
    mentioned = sorted(d for d in (tt-dt) if d not in only_tool)
    if mentioned:
        rows.append((slug,'medicine named but not offered (probably a safety check)', ', '.join(mentioned), status))
    da, ta = ages(doc), ages(tool)
    if da and ta and min(ta) < min(da):
        rows.append((slug,'TOOL AGE FLOOR BELOW DOCUMENT', f'tool {min(ta)} vs document {min(da)}', status))

print(f"{len(slugs)} tools scanned against the master manifest\n")
sev={'NO DOCUMENT':0,'MEDICINE OFFERED BY TOOL, NOT IN DOCUMENT':1,'TOOL AGE FLOOR BELOW DOCUMENT':2,'medicine named but not offered (probably a safety check)':3}
rows.sort(key=lambda r:(sev[r[1]], r[0]))
for slug,kind,detail,status in rows:
    print(f"  [{kind}] {slug} {('('+status+')') if status else ''}\n      {detail}")
print(f"\n{len(rows)} findings")
