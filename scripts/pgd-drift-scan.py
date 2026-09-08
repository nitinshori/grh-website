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

def ages(text):
    a=set()
    for m in re.finditer(r'\b(\d{1,2})\s*(?:years?|yrs?)\s*(?:of age\s*)?(?:and\s*(?:over|above)|or\s*(?:over|older|above)|\+)', text, re.I):
        a.add(int(m.group(1)))
    for m in re.finditer(r'aged?\s*(\d{1,2})\s*(?:and|or)\s*(?:over|above|older)', text, re.I):
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
    only_tool = sorted(tt-dt)
    if only_tool:
        rows.append((slug,'MEDICINE IN TOOL NOT IN DOCUMENT', ', '.join(only_tool), status))
    da, ta = ages(doc), ages(tool)
    if da and ta and min(ta) < min(da):
        rows.append((slug,'TOOL AGE FLOOR BELOW DOCUMENT', f'tool {min(ta)} vs document {min(da)}', status))

print(f"{len(slugs)} tools scanned against the master manifest\n")
sev={'NO DOCUMENT':0,'MEDICINE IN TOOL NOT IN DOCUMENT':1,'TOOL AGE FLOOR BELOW DOCUMENT':2}
rows.sort(key=lambda r:(sev[r[1]], r[0]))
for slug,kind,detail,status in rows:
    print(f"  [{kind}] {slug} {('('+status+')') if status else ''}\n      {detail}")
print(f"\n{len(rows)} findings")
