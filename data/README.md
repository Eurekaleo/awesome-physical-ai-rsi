# Public Bibliography

`references.json` contains bibliographic metadata from the project's supplied reference list. Each record has exactly these fields:

| Field | Value |
| --- | --- |
| `id` | Stable citation identifier |
| `title` | Publication title in plain text |
| `authors` | Author names in source order; `et al.` preserves an abbreviated source list |
| `year` | Source publication year, or `null` if unavailable |
| `venue` | Publication venue or book publisher |
| `type` | `conference`, `journal`, `preprint`, `book` (including chapters), or `other` |
| `url` | HTTPS publication link, or an empty string |
| `doi` | DOI, or an empty string |

The data contains no abstracts, notes, keywords, annotations, manuscript text, figures, or survey-specific classifications. Bibliographic publication types describe the cited works only.

Titles and names are converted from LaTeX to Unicode text. Conference venue labels are normalized, while source publication years are retained. Links use a source URL when available; otherwise they are derived from a source DOI or arXiv identifier. Metadata has not been independently verified against publishers. Missing fields are left empty; editors are not relabeled as authors.

## Reimport

Keep the source archive outside this repository. From the repository root, use a separate Python environment:

```sh
python3 -m venv /tmp/physical-ai-bibliography
/tmp/physical-ai-bibliography/bin/pip install pybtex==0.26.1 pylatexenc==2.10
/tmp/physical-ai-bibliography/bin/python tools/import-bibliography.py --archive /path/to/external-project.zip
```

The importer reads only `references.bib` from the ZIP in memory, writes the allowlisted JSON fields, and reports incomplete or ambiguous records to standard error. It does not extract or retain the archive, raw BibTeX, or any other source file.
