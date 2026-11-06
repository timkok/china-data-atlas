# China Data Atlas | 中国数据地图

An independent, source-traceable public statistics product for mainland China's 31 provincial-level regions. V0.1 uses reviewed official observations; no synthetic statistics, interpolation, paid AI calls, or unverified geographical boundaries.

## Live acceptance site

https://china-data-atlas-timkok.vercel.app — public V0.1.1 in the approved Hobby team. GitHub is connected; branch Preview builds and production publication were verified. The original tmp.now URL remains on the older snapshot. See docs/release-status.md.

## Run locally

Requires Node.js 22+ and Python 3.10+.

```sh
npm ci
python3 scripts/validate_data.py
npm run build
python3 -m http.server 4173 --directory out
```

Open http://localhost:4173. For development, `npm run dev`. `npm run build` exports a complete static site in `out/`; hosting does not require this computer to remain online.

## Verify

```sh
python3 scripts/check_sources.py
npx playwright install chromium
npm test
```

Tests run against built HTML, exercise desktop/mobile interaction and exports, check source links, missing-result behavior, and capture screenshots. Results: `test-results/results.json`; data gate: `data/quality-report.json`. A passing build alone is not acceptance.

For source reacquisition, install `python3 -m pip install -r requirements.txt`, then run `python3 scripts/fetch_sources.py`. Reviewed files are never overwritten by this fetch step.

## Data and audit

- `data/atlas.json`: normalized, reviewed release; explicit source IDs, units, years and statuses.
- `data/raw/`: retained original official tables and source manifest.
- `public/data/`: generated JSON and provenance-rich CSV downloads.
- `scripts/`: reproducible extraction, checks and export tools.
- `docs/`: product research, architecture, source/method limitations and map decision.

The dataset represents a dated extraction, not the latest possible official publication or a complete annual series. Publication year, observation year and retrieval date are distinct. Missing observations are not zero. Non-additive indicators are never summed into a national statistic.

## Changes and release

Work is on `feat/verified-mvp`. The PR contains the reviewed app and data; no existing production project is modified. Updates require raw-source review and a PR. CI validates snapshots but does not automatically replace human-reviewed data.

## Map and future AI

Geographic maps are deferred pending confirmation of resource license and final presentation/review requirements. Rankings and time series are the supported regional views. Hong Kong, Macao and Taiwan are not included in this release's statistical sample; this is not a geographic attribution judgment.

No AI research assistant is enabled. Future answers must query the validated data layer and expose sources, dates and derived formulae.

Official statistical facts are attributed to their publishers. Original source documents retain their original rights; no ownership of government source publications is asserted.
