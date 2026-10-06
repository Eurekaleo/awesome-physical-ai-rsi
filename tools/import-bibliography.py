#!/usr/bin/env python3
"""Import an allowlisted bibliography from an external Overleaf ZIP archive.

Dependencies: pybtex==0.26.1 and pylatexenc==2.10
The archive and its original BibTeX file are never extracted or copied.
"""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path, PurePosixPath
import re
import sys
import unicodedata
from urllib.parse import quote, urlsplit, urlunsplit
from zipfile import BadZipFile, ZipFile

try:
    from pybtex.database import Entry, Person, parse_string
    from pybtex.exceptions import PybtexError
    from pylatexenc.latex2text import LatexNodes2Text
except ImportError:
    sys.exit("Install import dependencies: pip install pybtex==0.26.1 pylatexenc==2.10")


PUBLIC_FIELDS = {"id", "title", "authors", "year", "venue", "type", "url", "doi"}
LATEX = LatexNodes2Text()
ARXIV_ID = re.compile(r"(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v\d+)?", re.I)
DOI = re.compile(r"10\.\d{4,9}/\S+", re.I)
SUBSCRIPTS = str.maketrans("0123456789", "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089")
SUPERSCRIPTS = str.maketrans("0123456789", "\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079")


def clean_text(value: str) -> str:
    text = LATEX.latex_to_text(value)
    text = re.sub(r"_([0-9]+(?:\.[0-9]+)?)", lambda match: match[1].translate(SUBSCRIPTS), text)
    text = re.sub(r"\^([0-9]+)", lambda match: match[1].translate(SUPERSCRIPTS), text)
    text = text.replace("^*", "*")
    return " ".join(unicodedata.normalize("NFC", text).split())


def author_name(person: Person) -> str:
    name = clean_text(" ".join(person.first_names + person.middle_names + person.prelast_names + person.last_names))
    suffix = clean_text(" ".join(person.lineage_names))
    if suffix:
        name += ", " + suffix
    return "et al." if name.lower() == "others" else name


def arxiv_identifier(entry: Entry) -> str:
    fields = entry.fields
    eprint = fields.get("eprint", "").strip()
    if fields.get("archiveprefix", "").lower() == "arxiv" and ARXIV_ID.fullmatch(eprint):
        return eprint
    # Only a recognized bibliographic identifier may leave a free-text field.
    for field in ("howpublished", "journal", "note"):
        text = clean_text(fields.get(field, ""))
        match = re.search(r"arxiv:\s*(" + ARXIV_ID.pattern + r")(?![\w./])", text, re.I)
        if match:
            return match[1]
    return ""


def publication_type(entry: Entry) -> str:
    journal = clean_text(entry.fields.get("journal", ""))
    if entry.type in {"inproceedings", "conference", "proceedings"} or journal.lower().startswith("proceedings of the"):
        return "conference"
    if entry.type in {"book", "inbook", "incollection"}:
        return "book"
    venue = " ".join(entry.fields.get(key, "") for key in ("journal", "howpublished"))
    if "arxiv" in venue.lower() or entry.type in {"misc", "unpublished"} and arxiv_identifier(entry):
        return "preprint"
    if entry.type == "article":
        return "journal"
    return "other"


def publication_venue(entry: Entry, kind: str) -> str:
    if kind == "preprint" and arxiv_identifier(entry):
        return "arXiv"
    for field in ("booktitle", "journal", "publisher"):
        if entry.fields.get(field):
            venue = clean_text(entry.fields[field])
            break
    else:
        return ""
    if kind == "conference":
        venue = re.sub(r"^Proceedings of the\s+", "", venue)
        venue = re.sub(r"^(?:\d+(?:st|nd|rd|th)|Fourteenth)\s+(?:Annual\s+)?", "", venue)
        venue = re.sub(r"\s+\(CoRL \d{4}\)$", "", venue)
    return venue


def public_url(value: str) -> str:
    try:
        parts = urlsplit(value.strip())
        if parts.scheme not in {"https", "http"} or not parts.netloc or parts.username or parts.password:
            return ""
        return urlunsplit(("https", parts.netloc, parts.path, parts.query, parts.fragment))
    except ValueError:
        return ""


def import_entries(source: str) -> tuple[list[dict], list[str]]:
    bibliography = parse_string(source, "bibtex")
    references = []
    warnings = []
    seen_titles: dict[str, str] = {}
    for identifier, entry in bibliography.entries.items():
        fields = entry.fields
        title = clean_text(fields.get("title", ""))
        if not title:
            warnings.append(f"{identifier}: omitted entry with no title")
            continue
        authors = [author_name(person) for person in entry.persons.get("author", [])]
        if not authors:
            warnings.append(f"{identifier}: no authors in source; preserved empty authors array")
        if "et al." in authors:
            warnings.append(f"{identifier}: source author list is abbreviated")
        raw_year = clean_text(fields.get("year", ""))
        year = int(raw_year) if re.fullmatch(r"\d{4}", raw_year) else None
        if year is None:
            warnings.append(f"{identifier}: missing or nonnumeric year; preserved null")
        doi = fields.get("doi", "").strip()
        doi = re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)", "", doi, flags=re.I)
        if doi and not DOI.fullmatch(doi):
            warnings.append(f"{identifier}: invalid DOI omitted")
            doi = ""
        explicit_url = public_url(fields.get("url", ""))
        if fields.get("url") and not explicit_url:
            warnings.append(f"{identifier}: invalid source URL omitted")
        arxiv = arxiv_identifier(entry)
        url = explicit_url
        if not url and doi:
            url = "https://doi.org/" + quote(doi, safe="/():;.-_")
        if not url and arxiv:
            url = "https://arxiv.org/abs/" + arxiv
        kind = publication_type(entry)
        reference = {
            "id": identifier,
            "title": title,
            "authors": authors,
            "year": year,
            "venue": publication_venue(entry, kind),
            "type": kind,
            "url": url,
            "doi": doi,
        }
        if not reference["venue"]:
            warnings.append(f"{identifier}: no publication venue in source")
        title_key = title.casefold()
        if title_key in seen_titles:
            warnings.append(f"{identifier}: title also occurs in {seen_titles[title_key]}; both retained")
        seen_titles[title_key] = identifier
        assert set(reference) == PUBLIC_FIELDS
        references.append(reference)
    return sorted(references, key=lambda item: item["id"].casefold()), warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path, help="External Overleaf ZIP; never copied into the repository")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "references.json")
    args = parser.parse_args()
    try:
        with ZipFile(args.archive) as archive:
            candidates = [item for item in archive.infolist() if not item.is_dir() and PurePosixPath(item.filename).name == "references.bib"]
            if len(candidates) != 1:
                raise ValueError("Expected exactly one references.bib in the external archive")
            if candidates[0].file_size > 10 * 1024 * 1024:
                raise ValueError("Bibliography exceeds the 10 MiB import limit")
            source = archive.read(candidates[0]).decode("utf-8-sig")
        references, warnings = import_entries(source)
        if not references:
            raise ValueError("No valid references found; output was not written")
    except (OSError, BadZipFile, UnicodeError, ValueError, PybtexError) as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(references, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for warning in warnings:
        print(f"Warning: {warning}", file=sys.stderr)
    summary = {
        "references": len(references),
        "years": dict(sorted(Counter(item["year"] for item in references if item["year"] is not None).items())),
        "types": dict(sorted(Counter(item["type"] for item in references).items())),
        "with_url": sum(bool(item["url"]) for item in references),
        "with_doi": sum(bool(item["doi"]) for item in references),
        "warnings": len(warnings),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
