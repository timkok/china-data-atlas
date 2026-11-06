'use client';
import {useEffect,useRef} from 'react';import * as echarts from 'echarts';
export default function Chart({option,label}:{option:echarts.EChartsOption;label:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current)return;const chart=echarts.init(ref.current,undefined,{renderer:'svg'});chart.setOption(option);const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);return ()=>{observer.disconnect();chart.dispose()};},[option]);return <div ref={ref} className="chart" role="img" aria-label={label}/>}
