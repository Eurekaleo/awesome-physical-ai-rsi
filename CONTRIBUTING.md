# Contributing

Contributions to **Physical AI & Recursive Self-Improvement** currently cover public reference metadata, accessibility, and the project website. Please use an issue to report a citation correction or website problem, or submit a focused pull request.

## Public scope

This project is in its prepublication stage. The README and the website carry a summary of the survey that the authors approved and maintain. Public contributions are limited to bibliography metadata and website infrastructure. Do not attach, paste, or commit unpublished manuscript text, abstracts, taxonomies, analysis, figures, tables, PDFs, Overleaf projects, or source archives. The full survey content will be added after publication.

## Reference corrections

Edit `data/references.json`, the shared source for the website and README. Include a reliable public publisher, DOI, arXiv, or project URL supporting the correction. A reference contains only these fields:

| Field | Expected value |
| --- | --- |
| `id` | Stable, unique identifier |
| `title` | Public title, without formatting markup |
| `authors` | Array of public author names |
| `year` | Four-digit publication year, or `null` if unknown |
| `venue` | Public publication venue, or an empty string |
| `type` | `conference`, `journal`, `preprint`, `book`, or `other` |
| `url` | Public HTTP(S) URL, or an empty string if unavailable |
| `doi` | DOI without a URL prefix, or an empty string |

Do not add summaries, relevance notes, survey section labels, or research categories. Check for existing entries before adding a reference. Retain an existing identifier when correcting its metadata.

## Local workflow

Use Node.js 22 or newer. There are no npm dependencies to install.

```sh
npm run readme
npm run check
npm run build
npm run preview
```

The preview server prints its local URL. It serves the built website from `dist/` at the same project path used by GitHub Pages. Check a desktop viewport and a narrow mobile viewport when changing the interface. Confirm that search, filters, collection charts, pagination, links, and keyboard focus still work. `npm run test` runs the focused catalog tests independently.

README content is generated. Edit `tools/render-readme.mjs` for presentation changes (the survey summary lives in `tools/survey-content.mjs`), then run `npm run readme`. Include the generated README in the same pull request as a metadata change.

## Pull requests

Describe the problem, the visible result, and the checks you ran. Keep each request focused. Metadata corrections should link to public evidence. For interface changes, describe the viewports and interactions you checked.

The automated checks verify catalog behavior, data shape, generated README consistency, project naming, local site links, the generated survey section, the absence of unpublished scholarly metadata, and the public build boundary. They do not establish the scientific accuracy of a reference or approve unpublished material for release.
