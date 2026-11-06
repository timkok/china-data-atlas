"""Check public source HTTP availability using system curl certificate trust, no access evasion."""
import json,subprocess,datetime,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'data/atlas.json').read_text()); rows=[]
for s in d['sources']:
    result=subprocess.run(['curl','--location','--silent','--show-error','--max-time','25','--output','/dev/null','--write-out','%{http_code}|%{content_type}|%{size_download}',s['url']],capture_output=True,text=True)
    parts=result.stdout.split('|')
    row={'id':s['id'],'url':s['url']}
    if result.returncode:row['error']=result.stderr.strip()
    else:row.update(status=int(parts[0]),contentType=parts[1],bytes=int(parts[2]))
    rows.append(row);time.sleep(.3)
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':rows,'passed':all(r.get('status')==200 and r.get('bytes',0)>0 for r in rows)}
(root/'data/source-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
