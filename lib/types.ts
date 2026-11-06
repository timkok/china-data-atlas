export type Indicator={id:string;name:string;nameEn:string;unit:string;category:string;definition:string;notes:string};
export type Region={code:string;name:string;group:string};
export type Observation={indicator:string;region:string;year:number;value:number|null;sourceId:string;status:string;method?:string;unit?:string};
export type Source={id:string;url:string;title:string;publisher:string;retrievedAt:string;publishedAt?:string|null;notes?:string};
export type Atlas={indicators:Indicator[];regions:Region[];observations:Observation[];sources:Source[]};
export const format=(n:number|null|undefined)=>n==null?'暂无数据':new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);
export const national=(code:string)=>['000000','CN','00','100000'].includes(code);
