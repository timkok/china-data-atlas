# V0.1 architecture

Official public yearbook tables → retained originals + hashes → reviewed extraction → normalized `data/atlas.json` → structural quality gate → static Next.js pages + ECharts + client filters + CSV.

- Data are precomputed; visitors never trigger scraping. The site works without a long-running local computer after deployment.
- Indicator definitions and province definitions are configuration, not duplicated page implementations.
- Static JSON serves as the initial read API; the normalized keys `(indicator, region, year)` can be migrated to PostgreSQL. The source relationship is preserved.
- Build-time HTML contains indicator definitions and summary content. The browser hydrates interaction. No paid AI API or secrets are used.
- All observation values preserve declared source units. Null is distinct from zero. Calendar gaps are explicit; no interpolation is used.
- A release is a reviewed snapshot, not a live mirror. Updates are staged and reviewed in a branch/PR. CI verifies committed data and UI but does not silently overwrite approved data.
- Future AI interface must query validated observations, return record IDs and sources, and express derived formulae. No AI answering endpoint exists in V0.1.

## Manual import and revisions
1. Retain the official source file, original URL, retrieval timestamp and SHA256.
2. Extract into a candidate folder. Record table/column/year mapping and any OCR corrections.
3. Compare values against the original table image, confirm units and region alignment, preserve source footnotes.
4. Run `python3 scripts/validate_data.py` and `python3 scripts/check_sources.py`; investigate warnings rather than silently correcting source values.
5. Review changes in a PR, including added/removed/changed observation keys and source versions.
6. Rebuild, run browser tests and retain results. Publish a new preview; do not overwrite a reviewed snapshot with an unattended scrape.

## Future scope
V0.5: comparable cross-indicator intersections, scatter plots, explicit growth formulae, PNG/SVG export, permalink state.
V1.0: source-bound research assistant only after API/budget authorization and evaluation of numeric fidelity. Neither milestone is claimed implemented.
