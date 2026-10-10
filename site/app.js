import {
  PAGE_SIZE,
  TYPES,
  readState,
  selectReferences,
  summarizeReferences,
  referenceCitation,
  referenceURL,
  pageWindow,
  venueLabel,
} from "./catalog.js";

const $ = (id) => document.getElementById(id);
let references = [];
let summary;
let loadState = "loading";
let state = readState(location.search);
let toastTimeout;
let searchTimeout;
const list = $("reference-list");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function icon(name, size = 16) {
  const image = element("img", "icon");
  image.src = `assets/icons/${name}.svg`;
  image.alt = "";
  image.width = size;
  image.height = size;
  return image;
}

function showToast(message) {
  clearTimeout(toastTimeout);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimeout = setTimeout(() => {
    $("toast").hidden = true;
  }, 3500);
}

async function copyText(text, copiedMessage, failedMessage) {
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    showToast(copiedMessage);
  } catch {
    const field = element("textarea");
    field.value = text;
    field.style.cssText = "position:fixed;opacity:0;left:0;top:0";
    document.body.append(field);
    const focused = document.activeElement;
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    focused?.focus({ preventScroll: true });
    showToast(copied ? copiedMessage : failedMessage);
  }
}

function copyCitation(reference) {
  return copyText(
    referenceCitation(reference),
    "Reference citation copied",
    "Copy unavailable. Download the bibliography instead.",
  );
}

function renderReference(reference) {
  const row = element("article", "reference-row");
  row.append(element("div", "reference-year", reference.year || "Undated"));
  const main = element("div", "reference-main");
  const title = element("h3", "reference-title");
  const url = referenceURL(reference);
  if (url) {
    const link = element("a", "reference-title-link", reference.title);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(icon("arrow-up-right", 14));
    title.append(link);
  } else title.textContent = reference.title;
  main.append(title);
  if (reference.authors.length) {
    const authors =
      reference.authors.length > 4
        ? reference.authors.slice(0, 4).join(", ") + ", et al."
        : reference.authors.join(", ");
    const authorLine = element("p", "reference-authors", authors);
    authorLine.title = reference.authors.join(", ");
    main.append(authorLine);
  }
  const bottom = element("div", "reference-bottom");
  const venue = element(
    "span",
    `venue venue-${reference.type}`,
    venueLabel(reference),
  );
  venue.title = reference.venue;
  bottom.append(venue);
  if (reference.venue)
    bottom.append(
      element("span", "reference-kind", TYPES[reference.type] || "Other"),
    );
  main.append(bottom);
  row.append(main);
  const actions = element("div", "reference-tools");
  const copy = element("button", "icon-button");
  copy.type = "button";
  copy.title = "Copy reference citation";
  copy.setAttribute("aria-label", `Copy citation for ${reference.title}`);
  copy.append(icon("copy", 15));
  copy.addEventListener("click", () => copyCitation(reference));
  actions.append(copy);
  row.append(actions);
  return row;
}

function syncURL() {
  const url = new URL(location.href);
  for (const key of ["q", "year", "type", "venue", "sort", "size", "page"])
    url.searchParams.delete(key);
  if (state.query) url.searchParams.set("q", state.query);
  if (state.year !== "all") url.searchParams.set("year", state.year);
  if (state.type !== "all") url.searchParams.set("type", state.type);
  if (state.venue !== "all") url.searchParams.set("venue", state.venue);
  if (state.sort !== "newest") url.searchParams.set("sort", state.sort);
  if (state.size !== PAGE_SIZE)
    url.searchParams.set("size", String(state.size));
  if (state.page > 1) url.searchParams.set("page", String(state.page));
  history.replaceState(null, "", url);
}

function render(updateURL = true) {
  if (loadState !== "ready") return;
  const selected = selectReferences(references, state);
  const pages = Math.max(1, Math.ceil(selected.length / state.size));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * state.size;
  const shown = selected.slice(start, start + state.size);
  list.replaceChildren(...shown.map(renderReference));
  list.setAttribute("aria-busy", "false");
  const active = Boolean(
    state.query ||
    state.year !== "all" ||
    state.type !== "all" ||
    state.venue !== "all",
  );
  $("result-count").textContent = selected.length
    ? `${start + 1}\u2013${Math.min(start + state.size, selected.length)} of ${selected.length} references`
    : "0 references";
  $("clear-search").hidden = !state.query;
  $("reset-filters").hidden =
    !active && state.sort === "newest" && state.size === PAGE_SIZE;
  $("empty-state").hidden = Boolean(selected.length);
  $("error-state").hidden = true;
  $("pagination").hidden = !selected.length;
  $("pagination").querySelector(".page-controls").hidden = pages <= 1;
  $("page-info").textContent = `Page ${state.page} of ${pages}`;
  $("previous-page").disabled = state.page <= 1;
  $("next-page").disabled = state.page >= pages;
  $("page-numbers").replaceChildren(
    ...pageWindow(state.page, pages).map((page) => {
      if (page === "...") return element("span", "page-ellipsis", "\u2026");
      const button = element("button", "page-button", page);
      button.type = "button";
      button.setAttribute("aria-label", `Page ${page}`);
      if (page === state.page) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => changePage(page));
      return button;
    }),
  );
  for (const button of $("collection-overview").querySelectorAll(
    "button[data-filter]",
  ))
    button.setAttribute(
      "aria-pressed",
      String(state[button.dataset.filter] === button.dataset.value),
    );
  if (updateURL) syncURL();
}

function chartButton(filter, item, className) {
  const button = element("button", className);
  button.type = "button";
  button.dataset.filter = filter;
  button.dataset.value = item.value;
  button.setAttribute("aria-pressed", "false");
  const label = item.value === "earlier" ? "2014 and earlier" : item.label;
  button.setAttribute(
    "aria-label",
    `${label}: ${item.count} collected ${item.count === 1 ? "reference" : "references"}`,
  );
  button.title = `${label}: ${item.count} references`;
  button.disabled = item.count === 0;
  button.addEventListener("click", () => {
    clearTimeout(searchTimeout);
    state[filter] = state[filter] === item.value ? "all" : item.value;
    state.page = 1;
    syncInputs();
    render();
  });
  return button;
}

function renderOverview() {
  $("collection-overview").querySelector(".profile-note").textContent =
    `Current collection \u00b7 ${references.length.toLocaleString("en")} references`;
  const maxYear = Math.max(1, ...summary.years.map((item) => item.count));
  $("year-chart").replaceChildren(
    ...summary.years.map((item) => {
      const button = chartButton("year", item, "year-bar");
      const fill = element("span", "bar-fill");
      fill.style.setProperty("--bar-size", `${(item.count / maxYear) * 100}%`);
      const label =
        item.value === "earlier"
          ? "<15"
          : /^\d{4}$/.test(item.value)
            ? item.value.slice(-2)
            : item.label;
      button.append(
        element("span", "bar-count", item.count),
        fill,
        element("span", "bar-label", label),
      );
      return button;
    }),
  );
  const maxType = Math.max(1, ...summary.types.map((item) => item.count));
  $("type-chart").replaceChildren(
    ...summary.types.map((item) => {
      const button = chartButton("type", item, "type-bar");
      const track = element("span", "bar-track");
      const fill = element("span", "bar-fill");
      fill.style.setProperty("--bar-size", `${(item.count / maxType) * 100}%`);
      track.append(fill);
      button.append(
        element("span", "bar-label", item.label),
        track,
        element("span", "bar-count", item.count),
      );
      return button;
    }),
  );
  $("venue-chart").replaceChildren(
    ...summary.venues.slice(0, 6).map((item) => {
      const button = chartButton("venue", item, "venue-filter");
      button.append(
        element("span", "bar-label", item.label),
        element("span", "bar-count", item.count),
      );
      return button;
    }),
  );
  $("collection-overview").hidden = false;
}

function changePage(page) {
  state.page = page;
  render();
  const toolbar = $("filters");
  toolbar.scrollIntoView({
    block: "start",
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
  $("result-count").setAttribute("tabindex", "-1");
  $("result-count").focus({ preventScroll: true });
}

function syncInputs() {
  $("search").value = state.query;
  $("year").value = state.year;
  $("type").value = state.type;
  $("venue").value = state.venue;
  $("sort").value = state.sort;
  $("page-size").value = String(state.size);
}

function validateFilters() {
  if (
    state.year !== "all" &&
    ![...$("year").options].some((option) => option.value === state.year)
  )
    state.year = "all";
  if (
    state.venue !== "all" &&
    !summary.venues.some((venue) => venue.value === state.venue)
  )
    state.venue = "all";
}

function reset() {
  clearTimeout(searchTimeout);
  state = readState("");
  syncInputs();
  render();
}

async function loadReferences() {
  loadState = "loading";
  $("collection-overview").hidden = true;
  $("error-state").hidden = true;
  $("result-count").textContent = "Loading references\u2026";
  list.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(
      new URL("../data/references.json", import.meta.url),
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (
      !Array.isArray(data) ||
      !data.every(
        (item) => typeof item.title === "string" && Array.isArray(item.authors),
      )
    )
      throw new Error("Invalid reference data");
    references = data;
    summary = summarizeReferences(references);
    loadState = "ready";
    const years = [
      ...new Set(references.map((item) => item.year).filter(Boolean)),
    ].sort((a, b) => b - a);
    $("year").replaceChildren(
      new Option("All years", "all"),
      ...years.map((year) => new Option(year, year)),
      ...(summary.years.find((year) => year.value === "earlier")?.count
        ? [new Option("2014 and earlier", "earlier")]
        : []),
      ...(summary.years.find((year) => year.value === "undated")?.count
        ? [new Option("Undated", "undated")]
        : []),
    );
    $("venue").replaceChildren(
      new Option("All venues", "all"),
      ...[...summary.venues]
        .sort((a, b) => a.label.localeCompare(b.label, "en"))
        .map(
          (venue) => new Option(`${venue.label} (${venue.count})`, venue.value),
        ),
    );
    validateFilters();
    $("total-count").textContent = references.length.toLocaleString("en");
    $("year-range").textContent = years.length
      ? `${years.at(-1)} \u2013 ${years[0]}`
      : "";
    syncInputs();
    renderOverview();
    render();
  } catch {
    loadState = "error";
    $("collection-overview").hidden = true;
    $("error-state").hidden = false;
    $("empty-state").hidden = true;
    $("pagination").hidden = true;
    list.replaceChildren();
    list.setAttribute("aria-busy", "false");
    $("result-count").textContent = "Reference library unavailable";
  }
}

$("filters").addEventListener("submit", (event) => event.preventDefault());
$("search").addEventListener("input", (event) => {
  clearTimeout(searchTimeout);
  state.query = event.target.value.slice(0, 300);
  $("clear-search").hidden = !state.query;
  searchTimeout = setTimeout(() => {
    state.page = 1;
    render();
  }, 150);
});
for (const id of ["year", "type", "venue", "sort"])
  $(id).addEventListener("change", (event) => {
    state[id] = event.target.value;
    state.page = 1;
    render();
  });
$("page-size").addEventListener("change", (event) => {
  state.size = Number(event.target.value);
  state.page = 1;
  render();
});
$("clear-search").addEventListener("click", () => {
  clearTimeout(searchTimeout);
  state.query = "";
  state.page = 1;
  $("search").value = "";
  render();
  $("search").focus();
});
$("reset-filters").addEventListener("click", reset);
$("empty-reset").addEventListener("click", reset);
$("retry").addEventListener("click", loadReferences);
$("copy-bibtex")?.addEventListener("click", () =>
  copyText(
    $("survey-bibtex").textContent,
    "BibTeX copied",
    "Copy unavailable. Select the BibTeX text instead.",
  ),
);
$("previous-page").addEventListener("click", () => changePage(state.page - 1));
$("next-page").addEventListener("click", () => changePage(state.page + 1));
window.addEventListener("popstate", () => {
  clearTimeout(searchTimeout);
  state = readState(location.search);
  if (loadState === "ready") validateFilters();
  syncInputs();
  render();
});

const menu = $("menu-toggle");
function closeMenu() {
  $("navigation").classList.remove("is-open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
  menu.title = "Open navigation";
}
menu.addEventListener("click", () => {
  const isOpen = menu.getAttribute("aria-expanded") === "true";
  if (isOpen) closeMenu();
  else {
    $("navigation").classList.add("is-open");
    menu.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-label", "Close navigation");
    menu.title = "Close navigation";
  }
});
$("navigation").addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
matchMedia("(min-width: 641px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});
const overviewBreakpoint = matchMedia("(min-width: 1000px)");
$("collection-overview").open = overviewBreakpoint.matches;
overviewBreakpoint.addEventListener("change", (event) => {
  $("collection-overview").open = event.matches;
});
loadReferences();
