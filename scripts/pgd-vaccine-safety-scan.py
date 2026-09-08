import os,re,pymupdf
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
man=open(f'{ROOT}/src/lib/pgd-document-manifest.ts').read()
i=man.index('PGD_MASTER_FILES'); j=man.index('\n}',i)
MAS=dict(re.findall(r'"([a-z0-9\-]+)"\s*:\s*"(.*?)"', man[i:j]))
acc=open(f'{ROOT}/src/lib/pgd-access.ts').read()
a=acc.index('export const ALL_PGDS'); b=acc.index('\n]',a)
entries=re.findall(r"slug: '([a-z0-9\-]+)', title: '([^']+)'.*?category: [\"']([^\"']+)[\"']", acc[a:b])
def st(n):
    m=re.search(n+r" = new Set(?:<string>)?\(\[(.*?)\n\]\)", acc, re.S)
    return set(re.findall(r"^\s*'([a-z0-9\-]+)',", m.group(1), re.M)) if m else set()
OFF=st('RETIRED_SLUGS')|st('PAUSED_SLUGS')|st('REBUILDING_SLUGS')

# every PGD that administers a vaccine, by category or by obvious slug
ORAL={'altitude-sickness','anti-malarials','travellers-diarrhoea'}  # oral, not injectable
VAXCAT={'Vaccines','Travel Health'}
vax=[(s,t) for s,t,c in entries if (c in VAXCAT or s in {'flu','covid-booster','rsv','hpv','mmr','pneumococcal'}) and s not in OFF and s not in ORAL]

CHECKS=[
 ('adrenaline',      r'adrenalin|epinephrin'),
 ('anaphylaxis plan',r'anaphylax'),
 ('15 min observe',  r'(15|fifteen)[\s-]*min'),
 ('cold chain excursion', r'excursion|outside the (stated|recommended) range|vaccine incident'),
 ('disposal/sharps', r'sharps|HTM 07|puncture[- ]resistant'),
 ('batch number',    r'batch'),
 ('parental resp.',  r'parental responsibility|Gillick'),
]
print(f"{'':34}" + ''.join(f"{n[:9]:>11}" for n,_ in CHECKS))
rows=[]
for s,t in sorted(vax, key=lambda x:x[1]):
    f=MAS.get(s); p=f'{ROOT}/public/pgd-documents/{f}' if f else None
    if not p or not os.path.exists(p): 
        print(f"{t[:33]:34}  (no document)"); continue
    try:
        d=pymupdf.open(p); txt=re.sub(r'\s+',' ',''.join(x.get_text() for x in d))
    except Exception: continue
    res=[bool(re.search(rx,txt,re.I)) for _,rx in CHECKS]
    rows.append((t,s,res))
    print(f"{t[:33]:34}" + ''.join(f"{('  yes' if r else '  NO '):>11}" for r in res))
print()
tot=len(rows)
for k,(n,_) in enumerate(CHECKS):
    miss=[t for t,s,r in rows if not r[k]]
    if miss: print(f"MISSING '{n}' in {len(miss)}/{tot}: " + ', '.join(m[:26] for m in miss))
