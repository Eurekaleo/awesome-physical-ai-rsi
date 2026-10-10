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

Titles and names are converted from LaTeX to Unicode text. Conference venue labels are normalized, while source publication years are retained. Links use a source URL when available; otherwise they are derived from a source DOI or arXiv identifier. Previously supplied links may be retained after verifying that they still identify the same work. The complete collection has not been independently verified against publishers. Missing fields are left empty; editors are not relabeled as authors.

## Bibliography update: 2026-10-10

The collection contains 229 records: 127 conference papers, 26 journal articles, 73 preprints, and 3 books or chapters. This update revises 9 existing records without adding, removing, or changing their stable identifiers.

| Record | Metadata revision |
| --- | --- |
| PISA Experiments | ICML conference attribution; retained the existing [arXiv link](https://arxiv.org/abs/2503.09595), verified on 2026-10-10, because the revised source omits a URL |
| Multisensory Continual Learning | Updated the arXiv link to v4 |
| Policy-Level Recursive Self-Improvement for Embodied AI with a Criticality World Model | Updated publication title |
| HIL-UMI | Updated the arXiv link to v2 |
| pi 0.5 | CoRL conference attribution |
| ThriftyDAgger | Publication year corrected to 2022 |
| Self-Improving Robots | CoRL conference attribution |
| Robot Fine-Tuning Made Easy | ICRA 2024 attribution and DOI link |
| VLABench | ICCV 2025 attribution and DOI link |

The README, website statistics, search results, citation text, and JSON download all use these same records. There are 179 publication links and 43 DOI fields; 50 records still have no supplied publication link.

## Reimport

Keep the source archive outside this repository. From the repository root, use a separate Python environment:

```sh
python3 -m venv /tmp/physical-ai-bibliography
/tmp/physical-ai-bibliography/bin/pip install pybtex==0.26.1 pylatexenc==2.10
/tmp/physical-ai-bibliography/bin/python tools/import-bibliography.py --archive /path/to/external-project.zip --output /tmp/physical-ai-reference-candidate.json
```

The importer reads only `references.bib` from the ZIP in memory, writes the allowlisted JSON fields, and reports incomplete or ambiguous records to standard error. It does not extract or retain the archive, raw BibTeX, or any other source file. Compare the candidate with `references.json` before applying changes. Review missing links against the notes above, preserve verified corrections and stable IDs, then regenerate the README and run the build.
