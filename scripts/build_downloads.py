"""Create reproducible, provenance-rich CSV downloads and static JSON from approved data."""
import csv,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'data/atlas.json').read_text());out=root/'public/data';out.mkdir(parents=True,exist_ok=True)
shutil.copyfile(root/'data/atlas.json',out/'atlas.json')
inds={i['id']:i for i in d['indicators']};regions={r['code']:r for r in d['regions']};sources={s['id']:s for s in d['sources']}
headers=['indicator_id','name_zh','name_en','definition','unit','region_code','region_name','year','value','status','source_id','source_institution','source_url','source_table','published_at','retrieved_at','methodology','processing_method']
for id in [*inds,'all']:
    with (out/f'{id}.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(headers)
        for o in d['observations']:
            if id!='all' and o['indicator']!=id:continue
            i=inds[o['indicator']];s=sources[o['sourceId']];r=regions.get(o['region'],{'name':'全国'})
            w.writerow([i['id'],i['name'],i['nameEn'],i['definition'],i['unit'],o['region'],r['name'],o['year'],o['value'],o['status'],s['id'],s['publisher'],s['url'],s['title'],s.get('publishedAt',''),s['retrievedAt'],i['notes'],o.get('method','原表转录，无插值')])
print(f'Exported {len(inds)+1} CSV files and atlas.json')
