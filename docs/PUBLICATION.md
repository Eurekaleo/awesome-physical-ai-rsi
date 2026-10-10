# Publication checklist

## Current release

The manuscript is not yet public. With the authors' approval, the README carries a summary of the survey: the title and subtitle, author names and affiliations, the research questions, the framework and its four conditions, Figures 1, 2, 3 and 6, the open problems, and a manuscript citation. The text lives in `tools/survey-content.mjs` and the figures in `assets/readme/figures/`; keep both in step with the manuscript.

The website's survey placeholders (`abstract`, `citation`, `framework`, `overview`) stay empty, and the site still carries no scholarly metadata, until the paper is public. The checks in `tools/check.mjs` continue to enforce this. No manuscript PDF, source, or other figure is published.

## When the paper is public

This checklist describes the full release; it does not authorize one.

- Confirm the paper is publicly published and the authors have approved the intended public materials.
- Verify the final public title, author names and order, affiliations, publication URL, date, and citation against the published record, and update `tools/survey-content.mjs` to match.
- Review the license and redistribution terms for every proposed figure, table, and downloadable file.
- Add the agreed public content through a reviewed pull request with clear provenance.
- Replace the empty survey templates and update the prepublication checks in the same pull request.
- Update the README generator (paper link, badge, and citation), website metadata, structured data, social preview, and release wording together.
- Keep the public build allowlist explicit. Add a manuscript download only when redistribution has been separately approved.
- Run the full build and check desktop, mobile, keyboard navigation, citation copying, and links on the deployed site.

Until then, preserve the public project name **Physical AI & Recursive Self-Improvement** (short form: **Physical AI + RSI**), public reference metadata, and the empty website templates. Do not publish survey content beyond what the authors approved for the README.
