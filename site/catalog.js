export const PAGE_SIZE = 12;
export const TYPES = {
  conference: "Conference",
  journal: "Journal",
  preprint: "Preprint",
  book: "Book / chapter",
  other: "Other",
};
export function venueLabel(reference) {
  const venue = reference.venue || TYPES[reference.type];
  const names = [
    [/Neural Information Processing Systems|\bNeurIPS\b/i, "NeurIPS"],
    [/International Conference on Machine Learning|\bICML\b/i, "ICML"],
    [/International Conference on Learning Representations|\bICLR\b/i, "ICLR"],
    [/Conference on Computer Vision and Pattern Recognition|\bCVPR\b/i, "CVPR"],
    [/International Conference on Computer Vision|\bICCV\b/i, "ICCV"],
    [/European Conference on Computer Vision|\bECCV\b/i, "ECCV"],
    [/International Conference on Robotics and Automation|\bICRA\b/i, "ICRA"],
    [
      /International Conference on Intelligent Robots and Systems|\bIROS\b/i,
      "IROS",
    ],
    [/Conference on Robot Learning|\bCoRL\b/i, "CoRL"],
    [/Robotics: Science and Systems|\bRSS\b/i, "RSS"],
    [/Robotics and Automation Letters/i, "IEEE RA-L"],
    [/Transactions on Robotics/i, "IEEE T-RO"],
    [/Transactions on Machine Learning Research/i, "TMLR"],
    [/ACM Computing Surveys/i, "ACM CSUR"],
    [/arXiv|\bCoRR\b/i, "arXiv"],
  ];
  for (const [pattern, label] of names)
    if (pattern.test(venue))
      return /workshop/i.test(venue) ? `${label} Workshop` : label;
  return venue.length > 48 ? TYPES[reference.type] : venue;
}
const normalize = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function readState(search) {
  const params = new URLSearchParams(search);
  return {
    query: (params.get("q") || "").slice(0, 300),
    year: /^\d{4}$/.test(params.get("year") || "") ? params.get("year") : "all",
    type: Object.hasOwn(TYPES, params.get("type")) ? params.get("type") : "all",
    sort: ["newest", "oldest", "title"].includes(params.get("sort"))
      ? params.get("sort")
      : "newest",
    page: Math.max(
      1,
      Math.min(10000, Number.parseInt(params.get("page"), 10) || 1),
    ),
  };
}

export function selectReferences(references, state) {
  const terms = normalize(state.query.trim()).split(/\s+/).filter(Boolean);
  const selected = references.filter((reference) => {
    if (state.year !== "all" && String(reference.year) !== state.year)
      return false;
    if (state.type !== "all" && reference.type !== state.type) return false;
    const text = normalize(
      [
        reference.title,
        ...reference.authors,
        reference.venue,
        reference.year,
        reference.doi,
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
  return selected.sort((a, b) => {
    if (state.sort === "title") return a.title.localeCompare(b.title, "en");
    if (a.year == null && b.year != null) return 1;
    if (b.year == null && a.year != null) return -1;
    const yearOrder = (a.year || 0) - (b.year || 0);
    return (
      (state.sort === "oldest" ? yearOrder : -yearOrder) ||
      a.title.localeCompare(b.title, "en")
    );
  });
}

export function referenceCitation(reference) {
  const sentence = (text) => (text ? text.replace(/[.\s]+$/, "") + ". " : "");
  const authors = sentence(reference.authors.join(", "));
  return `${authors}${reference.year ? `(${reference.year}). ` : ""}${sentence(reference.title)}${sentence(reference.venue)}${reference.url}`.trim();
}

export function pageWindow(current, total) {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index) =>
    index && page - pages[index - 1] > 1 ? ["...", page] : [page],
  );
}
