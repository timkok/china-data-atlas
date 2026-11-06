import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const atlas=JSON.parse(fs.readFileSync('data/atlas.json','utf8'));
const first=atlas.indicators.find((i:any)=>i.id==='population')||atlas.indicators[0];
const observations=atlas.observations.filter((o:any)=>o.indicator===first.id);
const years=[...new Set<number>(observations.map((o:any)=>o.year))].sort((a,b)=>b-a);
const fmt=(n:number)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);
test('homepage, search, empty state and responsive layout',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.getByRole('textbox',{name:'搜索指标'}).fill(first.name);
 await expect(page.locator('.indicator-card')).toHaveCount(1);
 await page.getByRole('textbox',{name:'搜索指标'}).fill('不存在的统计指标XYZ');
 await expect(page.getByText('未找到匹配指标，请尝试其他关键词。')).toBeVisible();
 await page.getByRole('textbox',{name:'搜索指标'}).fill('');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/home-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('all indicator URLs return rendered definitions and official sources',async({page})=>{
 for(const indicator of atlas.indicators){await page.goto(`/indicators/${indicator.id}/`);await expect(page.getByRole('heading',{level:1,name:indicator.name,exact:true})).toBeVisible();await expect(page.locator('.sources a').first()).toHaveAttribute('href',/https:\/\/.*\.gov\.cn/);
 const all=atlas.observations.filter((o:any)=>o.indicator===indicator.id);
 for(const year of [...new Set<number>(all.map((o:any)=>o.year))]){
 await page.getByLabel('数据年度',{exact:true}).selectOption(String(year));
 const expected=all.filter((o:any)=>o.year===year&&o.value!=null&&!['000000','CN'].includes(o.region)).sort((a:any,b:any)=>b.value-a.value);
 await expect(page.locator('.rank-row strong')).toHaveText(expected.map((o:any)=>fmt(o.value)));
 }
 }
});
test('year, ranking, data values, filters and CSV match reviewed records',async({page})=>{
 await page.goto(`/indicators/${first.id}/`);
 for(const year of [years[0],years.at(-1)!]){
 await page.getByLabel('数据年度',{exact:true}).selectOption(String(year));
 const rows=observations.filter((o:any)=>o.year===year&&o.value!=null&&!['000000','CN'].includes(o.region)).sort((a:any,b:any)=>b.value-a.value);
 await expect(page.locator('.rank-row')).toHaveCount(rows.length);
 await expect(page.locator('.rank-row').first().locator('strong')).toHaveText(fmt(rows[0].value));
 }
 await page.getByRole('button',{name:'数据表',exact:true}).click();
 const region=atlas.regions.find((r:any)=>r.code===observations.find((o:any)=>o.year===years.at(-1)&&o.region!=='000000')?.region);
 await page.getByLabel('搜索省份',{exact:true}).fill(region.name);
 await expect(page.locator('tbody tr')).toHaveCount(1);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'下载当前筛选 CSV',exact:true}).click()]);
 const file=await download.path();const csv=fs.readFileSync(file!,'utf8');
 expect(csv).toContain(region.code);expect(csv).toContain('source_url');expect(csv).toContain('.gov.cn');
 await page.getByLabel('搜索省份',{exact:true}).fill('不存在');await expect(page.getByText('无匹配记录。未获取不等于零。')).toBeVisible();
});
test('province selection, trend chart, missing selection and console',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(`/indicators/${first.id}/`);
 await page.getByRole('button',{name:'历史趋势',exact:true}).click();
 await expect(page.locator('.chart')).toBeVisible();
 const checked=page.locator('.province-picker input:checked');while(await checked.count())await checked.first().uncheck();
 await expect(page.getByText('选择至少一个省份以显示趋势。')).toBeVisible();
 await page.locator('.province-picker input').first().check();
 await expect(page.locator('.comparison-values > div')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/detail-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('region filter, methodology, SEO and static data',async({page,request})=>{
 await page.goto(`/indicators/${first.id}/`);
 const group=atlas.regions.find((r:any)=>r.group&&r.code!=='000000').group;
 await page.getByLabel('地区筛选',{exact:true}).selectOption(group);
 const codes=atlas.regions.filter((r:any)=>r.group===group).map((r:any)=>r.code);
 const count=observations.filter((o:any)=>o.year===years[0]&&o.value!=null&&codes.includes(o.region)).length;
 await expect(page.locator('.rank-row')).toHaveCount(count);
 await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',new RegExp(first.name));
 await page.goto('/methodology/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const response=await request.get('/data/atlas.json');expect(response.ok()).toBeTruthy();expect((await response.json()).observations).toEqual(atlas.observations);
 const html=await (await request.get(`/indicators/${first.id}/`)).text();expect(html).toContain(first.definition);
});
test('all-year CSV and multi-province comparison use the same observations',async({page})=>{
 await page.goto(`/indicators/${first.id}/`);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/下载全部年度 CSV/}).click()]);
 const csv=fs.readFileSync((await download.path())!,'utf8');
 expect(csv.trim().split('\r\n')).toHaveLength(observations.length+1);
 expect(csv).toContain(String(years.at(-1)));expect(csv).toContain('processing_method');
 await page.getByRole('button',{name:'历史趋势',exact:true}).click();
 const checked=page.locator('.province-picker input:checked');while(await checked.count())await checked.first().uncheck();
 for(const r of atlas.regions.filter((r:any)=>r.code!=='000000').slice(0,2)){
 await page.locator('.province-picker').getByLabel(r.name,{exact:true}).check();
 const value=observations.find((o:any)=>o.region===r.code&&o.year===years[0]).value;
 await expect(page.locator('.comparison-values')).toContainText(fmt(value));
 }
 await expect(page.locator('.comparison-values > div')).toHaveCount(2);
 await expect(page.locator('.chart svg')).toBeVisible();
});
