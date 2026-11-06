"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import {
  format,
  national,
  Indicator,
  Region,
  Observation,
  Source,
} from "../lib/types";
const Chart = dynamic(() => import("./Chart"), {
  ssr: false,
  loading: () => <div className="chart-loading">正在加载图表…</div>,
});
export default function Explorer({
  indicator: i,
  regions,
  observations,
  sources,
  related,
}: {
  indicator: Indicator;
  regions: Region[];
  observations: Observation[];
  sources: Source[];
  related: Indicator[];
}) {
  const years = useMemo(
    () => [...new Set(observations.map((o) => o.year))].sort((a, b) => b - a),
    [observations],
  );
  const [year, setYear] = useState(years[0]);
  const provinces = regions.filter((r) => !national(r.code));
  const [selected, setSelected] = useState<string[]>(
    provinces.slice(0, 3).map((r) => r.code),
  );
  const [group, setGroup] = useState("全部地区");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("desc");
  const [tab, setTab] = useState("ranking");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [shared, setShared] = useState("");
  const [start, setStart] = useState(years[years.length - 1]);
  const [end, setEnd] = useState(years[0]);
  const [allTableYears, setAllTableYears] = useState(false);
  useEffect(() => {
    function restore() {
      const p = new URLSearchParams(window.location.search);
      const y = Number(p.get("year"));
      setYear(years.includes(y) ? y : years[0]);
      const codes = [
        ...new Set((p.get("provinces") ?? p.get("province") ?? "").split(",")),
      ]
        .filter(
          (c) =>
            regions.some((r) => r.code === c) &&
            observations.some((o) => o.region === c),
        )
        .slice(0, 5);
      setSelected(
        p.has("provinces")
          ? codes
          : codes.length
            ? codes
            : provinces.slice(0, 3).map((r) => r.code),
      );
      const view = p.get("view");
      setTab(
        ["ranking", "trend", "table"].includes(view || "")
          ? view!
          : codes.length
            ? "trend"
            : "ranking",
      );
      const g = p.get("group");
      setGroup(provinces.some((r) => r.group === g) ? g! : "全部地区");
      setQuery(p.get("q") || "");
      setSort(
        ["asc", "desc", "name"].includes(p.get("sort") || "")
          ? p.get("sort")!
          : "desc",
      );
      const a = Number(p.get("from")),
        b = Number(p.get("to"));
      setStart(years.includes(a) ? a : years[years.length - 1]);
      setEnd(
        years.includes(b) &&
          b >= (years.includes(a) ? a : years[years.length - 1])
          ? b
          : years[0],
      );
      setAllTableYears(p.get("allYears") === "1");
      setReady(true);
    }
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    p.set("year", String(year));
    p.set("view", tab);
    p.set("provinces", selected.join(","));
    if (group !== "全部地区") p.set("group", group);
    if (query) p.set("q", query);
    if (sort !== "desc") p.set("sort", sort);
    if (start !== years[years.length - 1]) p.set("from", String(start));
    if (end !== years[0]) p.set("to", String(end));
    if (allTableYears) p.set("allYears", "1");
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}?${p}`,
    );
    setShared("");
  }, [
    ready,
    year,
    tab,
    selected,
    group,
    query,
    sort,
    start,
    end,
    allTableYears,
  ]);
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared("链接已复制，可还原当前筛选");
    } catch {
      setShared("请复制浏览器地址栏中的完整链接");
    }
  }

  const name = (code: string) =>
    regions.find((r) => r.code === code)?.name ||
    (national(code) ? "全国" : code);
  const provinceRows = observations.filter(
    (o) => o.year === year && !national(o.region),
  );
  const ranked = provinceRows
    .filter((o) => o.value != null)
    .sort((a, b) => (b.value || 0) - (a.value || 0));
  const rank = (code: string) => {
    const value = ranked.find((o) => o.region === code)?.value;
    return value == null
      ? 0
      : ranked.filter((o) => (o.value ?? 0) > value).length + 1;
  };
  const previousYear = years.find((y) => y < year);
  const previousRanked = observations
    .filter(
      (o) => o.year === previousYear && !national(o.region) && o.value != null,
    )
    .sort((a, b) => (b.value || 0) - (a.value || 0));
  const filtered = ranked.filter(
    (o) =>
      group === "全部地区" ||
      regions.find((r) => r.code === o.region)?.group === group,
  );
  const nation = observations.find(
    (o) => o.year === year && national(o.region),
  );
  const table = (
    allTableYears
      ? observations.filter((o) => !national(o.region))
      : provinceRows
  )
    .filter(
      (o) =>
        name(o.region).includes(query) &&
        (group === "全部地区" ||
          regions.find((r) => r.code === o.region)?.group === group),
    )
    .sort((a, b) =>
      sort === "name"
        ? name(a.region).localeCompare(name(b.region), "zh")
        : sort === "asc"
          ? (a.value ?? Infinity) - (b.value ?? Infinity)
          : (b.value ?? -Infinity) - (a.value ?? -Infinity),
    );
  const usedSources = sources.filter((s) =>
    observations.some((o) => o.sourceId === s.id),
  );
  const selectedYearValues = selected.map((code) => ({
    code,
    value: observations.find((o) => o.region === code && o.year === year)
      ?.value,
  }));
  const missing = provinces.filter(
    (r) => !provinceRows.some((o) => o.region === r.code && o.value != null),
  );
  const allYears = years.length
    ? Array.from({ length: end - start + 1 }, (_, k) => start + k)
    : [];
  const trend = useMemo<EChartsOption>(
    () => ({
      animation: false,
      color: ["#176b52", "#e88c40", "#406eae", "#9e5c87", "#b4a33d"],
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontFamily: "sans-serif" } },
      grid: { left: 65, right: 25, top: 32, bottom: 65 },
      xAxis: {
        type: "category",
        data: allYears.map(String),
        axisLine: { lineStyle: { color: "#d4dcd5" } },
      },
      yAxis: {
        type: "value",
        name: i.unit,
        splitLine: { lineStyle: { color: "#e8ece7" } },
      },
      series: selected.map((code) => ({
        name: name(code),
        type: "line",
        connectNulls: false,
        showSymbol: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        data: allYears.map(
          (y) =>
            observations.find((o) => o.region === code && o.year === y)
              ?.value ?? null,
        ),
      })),
    }),
    [selected, observations, start, end],
  );
  function csv(all = false) {
    const headers = [
      "indicator_id",
      "name_zh",
      "name_en",
      "definition",
      "unit",
      "region_code",
      "region_name",
      "year",
      "value",
      "status",
      "source_institution",
      "source_url",
      "source_table",
      "published_at",
      "retrieved_at",
      "methodology",
      "processing_method",
    ];
    const lines = (all ? observations : table).map((o) => {
      const s = sources.find((s) => s.id === o.sourceId);
      return [
        i.id,
        i.name,
        i.nameEn,
        i.definition,
        i.unit,
        o.region,
        name(o.region),
        o.year,
        o.value ?? "",
        o.status,
        s?.publisher,
        s?.url,
        s?.title,
        s?.publishedAt ?? "",
        s?.retrievedAt,
        i.notes,
        o.method || "原始来源值按指标说明处理，无插值",
      ];
    });
    const escape = (x: unknown) =>
      '"' + String(x ?? "").replace(/"/g, '""') + '"';
    const blob = new Blob(
      [
        "\uFEFF" +
          [headers, ...lines]
            .map((row) => row.map(escape).join(","))
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${i.id}-${all ? "all-years" : allTableYears ? "filtered-all-years" : year}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const citationSources = usedSources.filter((s) =>
    observations.some((o) => o.year === year && o.sourceId === s.id),
  );
  const citation = `中国数据地图（China Data Atlas），「${i.name}」，${year}年数据。原始来源：${citationSources.map((s) => `${s.publisher}，${s.title}，${s.url}`).join("；")}。获取日期：${usedSources[0]?.retrievedAt || "见来源记录"}。`;
  return (
    <div className="wrap detail">
      <div className="breadcrumb">
        <Link href="/indicators/">全部指标</Link>
        <span>/</span>
        <span>{i.category}</span>
      </div>
      <div className="detail-header">
        <div>
          <span className="category">{i.category}</span>
          <h1>{i.name}</h1>
          <p className="english">{i.nameEn}</p>
          <p className="definition">{i.definition}</p>
        </div>
        <div className="detail-actions">
          <button className="button secondary" onClick={share}>
            分享当前视图
          </button>
          <button className="button secondary" onClick={() => csv(true)}>
            ↓ 下载全部年度 CSV
          </button>
          <span className="share-status" role="status">
            {shared}
          </span>
        </div>
      </div>
      <div className="summary-grid">
        <article>
          <p>全国观测 · {year}</p>
          <strong>{format(nation?.value)}</strong>
          <span>
            {nation?.value != null
              ? i.unit
              : "本版未获取官方全国值；不以省份加总替代"}
          </span>
        </article>
        <article>
          <p>省级数据覆盖</p>
          <strong>
            {ranked.length}
            <small> / 31</small>
          </strong>
          <span>
            {year} 年 · 缺失 {missing.length} 个地区
          </span>
        </article>
        <article>
          <p>可用历史观测</p>
          <strong>
            {years[years.length - 1] ?? "—"}
            <small> — {years[0] ?? "—"}</small>
          </strong>
          <span>{years.length} 个数据年度 · 不插值补齐</span>
        </article>
      </div>
      <div className="data-workspace">
        <div className="workspace-toolbar">
          <div className="tabs">
            <button
              className={tab === "ranking" ? "active" : ""}
              onClick={() => setTab("ranking")}
            >
              省级排名
            </button>
            <button
              className={tab === "trend" ? "active" : ""}
              onClick={() => setTab("trend")}
            >
              历史趋势
            </button>
            <button
              className={tab === "table" ? "active" : ""}
              onClick={() => setTab("table")}
            >
              数据表
            </button>
          </div>
          <label className="select-label">
            数据年度
            <select
              aria-label="数据年度"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="workspace-body">
          <label className="select-label province-quick">
            快速查看省份
            <select
              aria-label="快速查看省份"
              value={selected.length === 1 ? selected[0] : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setSelected([e.target.value]);
                  setTab("trend");
                }
              }}
            >
              <option value="">选择省份</option>
              {provinces.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="view-heading">
            <div>
              <h2>
                {tab === "ranking"
                  ? "各省之间，有什么不同？"
                  : tab === "trend"
                    ? "沿着时间，观察变化"
                    : "查看每一条原始观测"}
              </h2>
              <p>
                {i.name} · {i.unit}
                {tab !== "trend" && ` · ${year}年`}
              </p>
            </div>
            {tab !== "trend" && (
              <label className="select-label">
                地区
                <select
                  aria-label="地区筛选"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {["全部地区", ...new Set(provinces.map((r) => r.group))].map(
                    (g) => (
                      <option key={g}>{g}</option>
                    ),
                  )}
                </select>
              </label>
            )}
          </div>
          {tab === "ranking" && (
            <>
              <p className="caption">
                全国基准：
                {nation?.value != null
                  ? `${format(nation.value)} ${i.unit}（官方全国观测；请核对全国与分省口径，比率不做简单平均）`
                  : "本版未获取官方全国观测，不用省份均值或总和替代。"}
              </p>
              <div className="rank-labels">
                <span>全国名次 / 省级行政区</span>
                <span>{i.unit} · 较前一可用年名次</span>
              </div>
              <div className="ranking">
                {filtered.map((o) => {
                  const oldValue = previousRanked.find(
                    (p) => p.region === o.region,
                  )?.value;
                  const old =
                    oldValue == null
                      ? null
                      : previousRanked.filter((p) => (p.value ?? 0) > oldValue)
                          .length + 1;
                  const change = old == null ? null : old - rank(o.region);
                  return (
                    <button
                      key={o.region}
                      className={`rank-row ${selected.includes(o.region) ? "chosen" : ""}`}
                      onClick={() => {
                        setSelected([o.region]);
                        setTab("trend");
                      }}
                      aria-label={`查看${name(o.region)}历史趋势`}
                    >
                      <span className="rank-index">
                        {String(rank(o.region)).padStart(2, "0")}
                      </span>
                      <span className="rank-name">{name(o.region)}</span>
                      <span className="rank-track">
                        <i
                          style={{
                            width: `${Math.max(0, ((o.value || 0) / (ranked[0]?.value || 1)) * 100)}%`,
                          }}
                        />
                      </span>
                      <strong>{format(o.value)}</strong>
                      <span className="rank-change">
                        {change == null
                          ? "—"
                          : change === 0
                            ? "持平"
                            : change > 0
                              ? `↑${change}`
                              : `↓${-change}`}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!filtered.length && (
                <p className="empty">所选年份和地区暂无数据。</p>
              )}
              <p className="caption">
                排名按数值降序排列；同值采用竞争排名（如1、1、3）。名次变化对比{" "}
                {previousYear ?? "无前一年"}
                ，仅描述两个快照，不代表口径可比的增长。点击省份查看趋势。
              </p>
            </>
          )}
          {tab === "trend" && (
            <>
              {["gdp", "gdp-per-capita"].includes(i.id) && (
                <p className="missing-note">
                  版本提示：2023与2024来自不同版年鉴的初步核算数，经济普查修订可能影响可比性。图中连接仅展示两次发布快照，不用于计算同比或实际增长。
                </p>
              )}
              <div className="trend-controls">
                <label className="select-label">
                  起始年
                  <select
                    aria-label="趋势起始年"
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                  >
                    {[...years]
                      .reverse()
                      .filter((y) => y <= end)
                      .map((y) => (
                        <option key={y}>{y}</option>
                      ))}
                  </select>
                </label>
                <span aria-hidden="true">—</span>
                <label className="select-label">
                  结束年
                  <select
                    aria-label="趋势结束年"
                    value={end}
                    onChange={(e) => setEnd(Number(e.target.value))}
                  >
                    {[...years]
                      .reverse()
                      .filter((y) => y >= start)
                      .map((y) => (
                        <option key={y}>{y}</option>
                      ))}
                  </select>
                </label>
                <button
                  className="text-button"
                  onClick={() => {
                    setStart(years[years.length - 1]);
                    setEnd(years[0]);
                  }}
                >
                  完整时间范围
                </button>
              </div>
              <fieldset className="province-picker">
                <legend>
                  选择省份对比 <span>（最多5个）</span>
                </legend>
                {regions
                  .filter(
                    (r) =>
                      !national(r.code) ||
                      observations.some((o) => o.region === r.code),
                  )
                  .map((r) => (
                    <label
                      key={r.code}
                      className={selected.includes(r.code) ? "selected" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(r.code)}
                        disabled={
                          !selected.includes(r.code) && selected.length >= 5
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, r.code]
                              : selected.filter((c) => c !== r.code),
                          )
                        }
                      />
                      {r.name}
                    </label>
                  ))}
              </fieldset>
              {selected.length ? (
                <Chart
                  option={trend}
                  filename={`${i.id}-${start}-${end}`}
                  caption={`${i.name} · ${i.unit} · ${start}–${end}。${usedSources.map((s) => s.title + " " + s.url).join("；")}。${i.notes}`}
                  label={`${i.name}省际历史趋势，缺失年份保留断点`}
                />
              ) : (
                <p className="empty">选择至少一个省份以显示趋势。</p>
              )}
              <div className="comparison-values">
                {selectedYearValues.map((v) => (
                  <div key={v.code}>
                    <span>
                      {name(v.code)} · {year}
                    </span>
                    <strong>
                      {format(v.value)}
                      <small> {v.value != null ? i.unit : ""}</small>
                    </strong>
                  </div>
                ))}
              </div>
              <p className="caption">
                图中只显示实际观测，缺失年度保留断点。线段用于辅助阅读，不表示年度间插值。跨年比较前请检查下方口径说明。
              </p>
            </>
          )}
          {tab === "table" && (
            <>
              <div className="table-scope">
                <label>
                  <input
                    type="checkbox"
                    checked={allTableYears}
                    onChange={(e) => setAllTableYears(e.target.checked)}
                  />{" "}
                  查看全部年度
                </label>
                <span aria-live="polite">
                  {table.length} 条记录 ·{" "}
                  {allTableYears ? "全部可用年度" : `${year}年`}
                </span>
              </div>
              <div className="table-tools">
                <input
                  aria-label="搜索省份"
                  placeholder="搜索省份名称…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  aria-label="数据排序"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="desc">数值从高到低</option>
                  <option value="asc">数值从低到高</option>
                  <option value="name">地区名称</option>
                </select>
                <button onClick={() => csv(false)} className="button secondary">
                  下载当前筛选 CSV
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>地区</th>
                      <th>地区代码</th>
                      <th>年度</th>
                      <th>数值（{i.unit}）</th>
                      <th>数据状态</th>
                      <th>来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((o) => (
                      <tr key={`${o.region}-${o.year}`}>
                        <td>{name(o.region)}</td>
                        <td>{o.region}</td>
                        <td>{o.year}</td>
                        <td>{format(o.value)}</td>
                        <td>{o.status || "未知"}</td>
                        <td>
                          <a
                            href={sources.find((s) => s.id === o.sourceId)?.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            原始表格 ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!table.length && (
                <p className="empty">无匹配记录。未获取不等于零。</p>
              )}
              <p className="caption">
                CSV
                包含当前年份范围、地区与搜索筛选后的数据、定义、单位和完整来源字段。全部年度数据可下载{" "}
                <a href="/data/atlas.json" download>
                  JSON 数据包
                </a>
                。
              </p>
            </>
          )}
          <div className="missing-note">
            缺失概况：
            {missing.length
              ? `${missing.map((r) => r.name).join("、")}在${year}年无可用观测。`
              : "当前年份31个省级行政区均有可用观测。"}{" "}
            缺失值从不以 0 代替。
          </div>
        </div>
      </div>
      <div className="notice">
        <span aria-hidden="true">ⓘ</span>
        <p>
          <strong>地图视图暂缓开放</strong>
          本版使用排名与趋势图。地图资源许可、公开使用及交互着色审核要求尚未完成核实。
          <Link href="/methodology/#map">查看说明 →</Link>
        </p>
      </div>
      <section className="method-grid">
        <div>
          <p className="eyebrow">METHODOLOGY</p>
          <h2>理解数字背后的口径</h2>
          <dl className="dictionary">
            <dt>指标 ID</dt>
            <dd>{i.id}</dd>
            <dt>指标定义</dt>
            <dd>{i.definition}</dd>
            <dt>统计单位</dt>
            <dd>{i.unit}</dd>
            <dt>口径与转换</dt>
            <dd>{i.notes || "原始来源值按标注单位保留；未进行插值。"}</dd>
            <dt>比较限制</dt>
            <dd>
              不同出版版本可能包含修订。未证明口径可比时不提供同比增长；不将相关性解释为因果。
            </dd>
            <dt>地区分组</dt>
            <dd>
              按华北、东北、华东、华中、华南、西南、西北作浏览分组，不计算未经验证的组内总计。
              <Link href="/methodology/">查看分组定义</Link>
            </dd>
          </dl>
        </div>
        <div>
          <p className="eyebrow">SOURCES & CITATION</p>
          <h2>数据来源与引用</h2>
          <div className="sources">
            {usedSources.map((s) => (
              <article key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
                <p>{s.publisher}</p>
                <small>
                  发布：{s.publishedAt || "未获取"} · 获取：{s.retrievedAt}
                </small>
                {s.notes && <p>{s.notes}</p>}
              </article>
            ))}
          </div>
          <div className="citation">
            <p>{citation}</p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(citation);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "已复制" : "复制引用文本"}
            </button>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="related">
          <h2>继续探索</h2>
          {related.map((x) => (
            <Link key={x.id} href={`/indicators/${x.id}/`}>
              {x.name} ↗
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
