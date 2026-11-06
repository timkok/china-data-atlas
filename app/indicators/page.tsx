import {getAtlas} from '../../lib/data';import Catalog from '../../components/Catalog';
export const metadata={title:'探索全部指标',description:'按主题搜索中国各省人口、经济、教育和医疗官方统计数据，查看趋势、排名和来源。'};
export default function Page(){const a=getAtlas();return <section className="wrap section"><p className="eyebrow">DATA EXPLORER</p><h1 className="page-title">探索数据</h1><p className="lead">{a.indicators.length} 个指标。每一份数据，都能找到原始出处。</p><Catalog indicators={a.indicators} observations={a.observations}/></section>}
