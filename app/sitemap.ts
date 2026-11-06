import type {MetadataRoute} from 'next';
import {getAtlas} from '../lib/data';
import {siteUrl} from '../lib/site';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap{return ['','/indicators','/methodology',...getAtlas().indicators.map(i=>`/indicators/${i.id}`)].map(path=>({url:`${siteUrl}${path}/`,changeFrequency:'monthly',priority:path===''?1:.7}));}
