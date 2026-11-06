"""Rebuild the static atlas only from explicitly reviewed transcriptions. No OCR auto-publish."""
import json, pathlib, hashlib, csv
ROOT=pathlib.Path(__file__).resolve().parents[1]
D=ROOT/'data'
names=['全国','北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆']
codes=['000000','110000','120000','130000','140000','150000','210000','220000','230000','310000','320000','330000','340000','350000','360000','370000','410000','420000','430000','440000','450000','460000','500000','510000','520000','530000','540000','610000','620000','630000','640000','650000']
groups=['全国']+['华北']*5+['东北']*3+['华东']*7+['华中']*3+['华南']*3+['西南']*5+['西北']*5
meta=[
('population','年末常住人口','Year-end resident population','万人','人口与社会','年末常住人口数。全国包含现役军人数，分地区数据未包括。','人口为年末数；不把31省合计视为全国。'),
('urbanization','常住人口城镇化率','Urban population share','%','人口与社会','年末城镇常住人口占全部常住人口的比例。','直接使用官方比重，不平均各省比重估算全国。'),
('birth-rate','人口出生率','Crude birth rate','‰','人口与社会','年度出生人口与年平均人口之比，以千分率表示。','2024表为根据人口变动情况抽样调查推算；不能用年末人口替代年平均人口反推。'),
('gdp','地区生产总值','Gross regional product','亿元','经济','一定时期地区所有常住单位生产活动的最终成果；本表为当年价格。','2024为初步核算数。跨年版本可能受经济普查修订影响，禁止把现价数值差直接解释为实际经济增长。全国值未在当前地区表提供。'),
('gdp-per-capita','人均地区生产总值','GDP per capita','元','经济','地区生产总值与年平均常住人口之比，直接引用官方人均值。','初步核算数；不可用年末人口重算替代。全国值未在当前地区表提供。'),
('income','居民人均可支配收入','Disposable income per capita','元','经济','居民可用于最终消费支出和储蓄的收入，按常住人口平均。','现价收入；数值变化未扣除价格因素。'),
('university-students','普通、职业本专科在校生','Regular and vocational undergraduate and junior-college students','人','教育','普通、职业本科及专科在校学生总数。','不含研究生；用该确切口径替代宽泛的普通高校在校生，避免混合学历范围。'),
('universities','普通、职业高等学校数','Regular and vocational higher education institutions','所','教育','普通、职业高等学校的学校数量。','取学校数列（单位所），不取教职工列；不同于包含成人高校的全部高等学校。'),
('doctors-per-1000','每千人口执业（助理）医师','Licensed physicians per 1,000 population','人/千人','医疗','每千常住人口中执业医师及执业助理医师人数。','采用合计列；城乡分项2021年前后分母口径变化，不纳入本版。'),
('beds-total','医疗卫生机构床位数','Beds in health institutions','万张','医疗','医疗卫生机构床位合计。','首版以官方直接公布的床位总数替代每千人口床位数，避免分母口径未经核实的派生计算。')]
indicators=[dict(zip(['id','name','nameEn','unit','category','definition','notes'],x)) for x in meta]
bundle={'version':'0.1','updatedAt':'2026-11-05','indicators':indicators,'regions':[{'code':c,'name':n,'group':g} for c,n,g in zip(codes,names,groups)],'observations':[],'sources':[]}
sources={}
titles={'C02-05':'分地区年末人口数','C02-06':'分地区年末城镇人口比重','C02-07':'分地区人口的城乡构成和出生率、死亡率、自然增长率','C03-09':'地区生产总值','C06-18':'分地区居民人均可支配收入','C21-14':'分地区普通、职业本专科学生情况','C21-15':'分地区普通、职业高等学校情况','C22-03':'每千人口卫生技术人员','C22-06':'医疗卫生机构床位'}
for file in sorted((D/'reviewed').glob('*.json')):
 doc=json.loads(file.read_text())
 assert doc.get('regions')==names, f'Region order mismatch: {file}'
 for key,item in doc.items():
  if key not in {i['id'] for i in indicators}:continue
  assert len(item['values'])==32, f'Expected 32 rows: {file} {key}'
  year=doc['year'];raw=item['source'];edition=raw[:4];table=raw[5:-4];sid=f'nbs-{edition}-{table}'
  if sid not in sources:
   p=D/'raw'/raw
   sources[sid]={'id':sid,'url':f'https://www.stats.gov.cn/sj/ndsj/{edition}/html/{table}.jpg','title':f'《中国统计年鉴{edition}》表{table[1:].replace("-","–")} {titles[table]}','publisher':'国家统计局','retrievedAt':'2026-11-05','publishedAt':None,'notes':'官方原始图片表。本版发布的全部1308条观测已由两个AI代理分别对照原图转录与复核；其中768条历史值有逐格独立对照记录。未经人类专家签署。发布日期未取得。','rawFile':f'data/raw/{raw}','sha256':hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None}
  for c,v in zip(codes,item['values']):
   if v is None:continue
   bundle['observations'].append({'indicator':key,'region':c,'year':year,'value':v,'sourceId':sid,'status':item.get('status','未知'),'method':'原表数值直接转录，无插值、无缩放。','unit':next(i['unit'] for i in indicators if i['id']==key)})
bundle['sources']=list(sources.values())
seen=set()
for o in bundle['observations']:
 k=(o['indicator'],o['region'],o['year']);assert k not in seen,k;seen.add(k)
(D/'atlas.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2))
with (D/'observations.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(bundle['observations'][0]));w.writeheader();w.writerows(bundle['observations'])
print(f"Built {len(indicators)} indicators, {len(bundle['observations'])} observations, {len(sources)} sources")
