"""Validate a reviewed atlas release without modifying any observations."""
import json, math, sys, collections, datetime
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/atlas.json').read_text())
errors=[]; warnings=[]
def check(ok, msg):
    if not ok: errors.append(msg)
inds={x['id']:x for x in d['indicators']}; regs={str(x['code']):x for x in d['regions']}; sources={x['id']:x for x in d['sources']}
check(len(inds)==len(d['indicators']),'duplicate indicator IDs')
check(len(regs)==len(d['regions']),'duplicate region codes')
allowed={str(x)+'0000' for x in [11,12,13,14,15,21,22,23,31,32,33,34,35,36,37,41,42,43,44,45,46,50,51,52,53,54,61,62,63,64,65]}
check(allowed.issubset(regs),'31 provincial region codes required')
for i in inds.values():
    for f in ['name','nameEn','unit','category','definition','notes']: check(isinstance(i.get(f),str) and bool(i[f]), f"{i['id']}: missing {f}")
for s in sources.values():
    host=urlparse(s.get('url','')).hostname or ''
    check(host.endswith('.gov.cn'), f"{s['id']}: non-official source URL")
    for f in ['title','publisher','retrievedAt']: check(bool(s.get(f)), f"{s['id']}: missing {f}")
seen=set(); groups=collections.defaultdict(list); coverage=collections.defaultdict(set)
for n,o in enumerate(d['observations']):
    key=(o.get('indicator'),str(o.get('region')),o.get('year'))
    check(key not in seen,f'duplicate record {key}');seen.add(key)
    check(key[0] in inds,f'unknown indicator {key}')
    check(key[1] in regs or key[1] in ['CN','000000'],f'unknown region {key}')
    check(isinstance(key[2],int) and 2000<=key[2]<=2026,f'invalid year {key}')
    check(o.get('sourceId') in sources,f'missing source {key}')
    check(o.get('status') in ['正式','初步','修订','未知','final','preliminary','revised','unknown'],f'invalid status {key}')
    v=o.get('value')
    check(v is None or isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v),f'invalid value {key}')
    if v is None: warnings.append(f'missing value {key}');continue
    check(v>=0,f'negative value {key}')
    unit=inds.get(key[0],{}).get('unit','')
    if unit=='%': check(0<=v<=100,f'percentage outside bounds {key}')
    coverage[(key[0],key[2])].add(key[1]);groups[key[:2]].append((key[2],v))
for k,values in groups.items():
    values.sort()
    for (y0,v0),(y1,v1) in zip(values,values[1:]):
        if y1-y0==1 and v0 and abs(v1/v0-1)>.25: warnings.append(f'REVIEW >25% annual change {k}: {y0}={v0}, {y1}={v1}')
for (i,y),r in coverage.items():
    missing=sorted(allowed-r)
    if missing:warnings.append(f'{i} {y}: missing provinces {missing}')
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':not errors,'records':len(seen),'indicators':len(inds),'sources':len(sources),'errors':errors,'warnings':warnings,'coverage':[{'indicator':i,'year':y,'provinces':len(r & allowed),'missing':sorted(allowed-r)} for (i,y),r in sorted(coverage.items())],'limits':['Link availability separately checked at acquisition; this gate validates official URL structure.','No national sum reconciliation unless additivity and scope are established.','Passing structural checks does not alone validate OCR; raw-to-record review is required.','No imputation; discontinuous years are retained.']}
(ROOT/'data/quality-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['passed','records','indicators','sources','errors','warnings']},ensure_ascii=False,indent=2))
sys.exit(0 if not errors else 1)
