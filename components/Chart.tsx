"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";
export default function Chart({
  option,
  label,
  filename = "chart",
  caption = "",
}: {
  option: echarts.EChartsOption;
  label: string;
  filename?: string;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    instance.current = chart;
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      instance.current = null;
    };
  }, [option]);
  function download() {
    if (!instance.current) return;
    const source = instance.current.renderToSVGString();
    const doc = new DOMParser().parseFromString(source, "image/svg+xml");
    const root = doc.documentElement;
    const ns = "http://www.w3.org/2000/svg";
    const title = doc.createElementNS(ns, "title");
    title.textContent = label;
    const desc = doc.createElementNS(ns, "desc");
    desc.textContent = caption;
    root.prepend(title, desc);
    const originalHeight = Number(root.getAttribute("height")) || 370;
    const width = Number(root.getAttribute("width")) || 600;
    const words = caption.match(new RegExp(`.{1,${Math.max(12,Math.floor((width-24)/10))}}`, 'gu')) || [];
    root.setAttribute(
      "height",
      String(originalHeight + 40 + words.length * 18),
    );
    root.setAttribute(
      "viewBox",
      `0 0 ${width} ${originalHeight + 40 + words.length * 18}`,
    );
    const text = doc.createElementNS(ns, "text");
    text.setAttribute("x", "12");
    text.setAttribute("y", String(originalHeight + 22));
    text.setAttribute("font-size", "10");
    text.setAttribute("fill", "#344b42");
    words.forEach((line, k) => {
      const span = doc.createElementNS(ns, "tspan");
      span.setAttribute("x", "12");
      span.setAttribute("dy", k ? "18" : "0");
      span.textContent = line;
      text.appendChild(span);
    });
    root.appendChild(text);
    const blob = new Blob([new XMLSerializer().serializeToString(doc)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div ref={ref} className="chart" role="img" aria-label={label} />
      <div className="chart-export">
        <button className="button secondary" onClick={download}>
          下载 SVG 图表
        </button>
        <span>包含单位、年份与来源说明</span>
      </div>
    </>
  );
}
