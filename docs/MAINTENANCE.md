# Maintaining the project

The repository contains a static website and a public bibliography. `data/references.json` is the source of truth for reference metadata; the browser and README use the same records. No framework, package installation, database, or build service is required.

## Structure

```text
.github/       Issue forms, pull request guidance, CI, and Pages deployment
assets/        Public brand artwork, icons, fonts, and asset credits
data/          Public reference metadata and its documentation
docs/          Maintenance and release documentation
site/          Website styles and browser modules
tools/         Reference rendering, validation, build, and preview scripts
index.html     Project homepage
README.md      Generated project overview and reference list
dist/          Generated deployment output, ignored by Git
```

## Update the bibliography

1. Correct public records in `data/references.json` and retain existing record IDs.
2. Run `npm run readme` to refresh the README and its counts.
3. Run `npm run build` to validate all public source files and produce `dist/`.
4. Run `npm run preview` and check the changed records in the website.
5. Submit the source and generated README together.

Bibliographic fields are deliberately limited. Records must not carry unpublished annotations, abstract text, section assignments, or survey-specific categories. Missing metadata stays empty or `null`; avoid filling a gap with an inferred fact.

## Validation and deployment

`npm run check` validates the data schema, IDs, generated README, site links, publication placeholders, repository file extensions, and public-file selection. External paper URLs are checked for safe syntax, not fetched during every build.

`npm run build` runs the checks, then copies only the files selected in `tools/public-files.mjs` to a fresh `dist/` directory. It creates `.nojekyll` there. GitHub Pages uploads only that directory, never the repository root. The build does not read the original manuscript or a parent directory.

Keep source manuscripts and review files outside this repository. `.gitignore` helps avoid accidental staging, but it is not an authorization mechanism: inspect every proposed commit and keep the existing public-file checks enabled.

## Local preview

```sh
npm run build
npm run preview -- --port 4173
```

The server binds to `127.0.0.1` and serves `/awesome-physical-ai/`. If the requested port is occupied, it uses the next available port and prints the resulting URL. The preview server serves only `dist/` and does not list directories.

## Visual assets and licensing

Record each public asset's origin and usage terms in `assets/CREDITS.md`. Do not copy figures from the unpublished survey. The MIT license applies to this repository's original software and accompanying technical documentation. Third-party images, fonts, publication text, and linked works retain their own licenses and rights.

## Publication

Use [PUBLICATION.md](PUBLICATION.md) when the survey is publicly released. Publication is a deliberate content update; a date or CI job must not automatically unlock manuscript content.
