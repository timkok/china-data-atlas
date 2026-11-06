# V0.1 release status

The product uses 10 real official indicators and 1,308 normalized observations. All 31 provincial-level regions have observations for 2023 and 2024 for each published indicator. Population and urbanization cover 2015–2024; income covers 2018–2024. The statistics are from the 2024 and 2025 editions of the National Bureau of Statistics yearbook, not a claim that these are the newest data available anywhere.

Implemented: homepage; searchable thematic catalogue; independent indicator URLs; year and regional filters; province ranking and competition ranks for ties; national values where sourced; multi-province/national trends; full-year and filtered CSV; source links, dictionary and recommended citations; static SEO content; source retrieval staging and snapshot fingerprints; validation gate; responsive desktop/mobile layout.

Map deferred: no boundary file is used. Resource licensing and final interactive coloring/review requirements have not been resolved. Rankings and time series are the supported geographic comparison views.

Not implemented: 2000–2014 history; 65+ population share; retail sales; per-1,000-population beds; cross-indicator scatter plots; PNG export; paid or unpaid AI assistant; automatic publication of fresh scraped data. The detailed reasons for indicator substitutions and omissions are in data/README.md.

Not assumed: provincial sums equal national statistics, rates are additive, yearbook edition equals observation year, preliminary GDP editions are comparable, or observed correlation is causation.

Deployment: https://china-data-atlas-timkok.vercel.app is the public V0.1.1 entry point in the approved timkok621-1320 Hobby team. GitHub is connected and branch Preview builds work. Commit d97b039 passed both GitHub validation jobs and Vercel deployment. Production deployment dpl_FfR5xD4bE2mLqTNsKBxujhshbB7k was browser-verified without login on the public domain, including shared province and year-range state and the rendered chart. The original tmp.now URL still serves the previous snapshot; use the new domain. Preview deployment URLs retain Vercel authentication protection. No protection was disabled. PR #1 remains open.

V0.1.1 adds restorable share links, historical date ranges, all-years table filtering and synchronized CSV, sourced SVG exports, year-specific citations and larger mobile controls. Local browser tests: 16 passed across desktop/mobile. Data gate: 1,308 observations, zero errors, one retained verified anomaly warning. No statistical values changed. Canonical origin and sitemap use the new public domain in source.
