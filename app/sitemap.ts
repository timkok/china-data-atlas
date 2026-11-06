export const dynamic='force-static';
import type {MetadataRoute} from 'next';import {getAtlas} from '../lib/data';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL;if(!base)return [];return ['','/indicators','/methodology',...getAtlas().indicators.map(i=>`/indicators/${i.id}`)].map(path=>({url:`${base}${path}/`,changeFrequency:'monthly',priority:path===''?1:.7}));}
