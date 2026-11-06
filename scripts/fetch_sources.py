"""Fetch immutable official-source snapshots into staging; never overwrite reviewed raw files.
Usage: python3 scripts/fetch_sources.py
Requires requests; respects access denials, no captcha/auth bypass.
"""
import json, pathlib, hashlib, datetime, time
import requests
ROOT=pathlib.Path(__file__).resolve().parents[1]
a=json.loads((ROOT/'data/atlas.json').read_text())
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
out=ROOT/'work/source-staging'/stamp;out.mkdir(parents=True,exist_ok=True)
results=[]
for s in a['sources']:
 r={'sourceId':s['id'],'url':s['url'],'checkedAt':stamp}
 try:
  response=requests.get(s['url'],timeout=30)
  response.raise_for_status()
  data=response.content;r['status']=response.status_code;r['contentType']=response.headers.get('content-type')
  r['sha256']=hashlib.sha256(data).hexdigest();r['matchesReviewedSnapshot']=r['sha256']==s['sha256']
  (out/pathlib.Path(s['rawFile']).name).write_bytes(data)
 except Exception as e:r['error']=str(e)
 results.append(r);print(s['id'],r.get('status'),r.get('matchesReviewedSnapshot'),r.get('error',''))
 time.sleep(.3)
(out/'source-check.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(out)
