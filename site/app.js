import {
  PAGE_SIZE,
  TYPES,
  readState,
  selectReferences,
  referenceCitation,
  pageWindow,
  venueLabel,
} from "./catalog.js";

const $ = (id) => document.getElementById(id);
let references = [];
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

async function copyCitation(reference) {
  const text = referenceCitation(reference);
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    showToast("Reference citation copied");
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
    showToast(
      copied
        ? "Reference citation copied"
        : "Copy unavailable. Download the bibliography instead.",
    );
  }
}

function renderReference(reference) {
  const row = element("article", "reference-row");
  row.append(element("div", "reference-year", reference.year || "Undated"));
  const main = element("div", "reference-main");
  main.append(element("h3", "reference-title", reference.title));
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
  if (reference.url && /^https:\/\//.test(reference.url)) {
    const link = element("a", "paper-link", "Paper");
    link.href = reference.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Read ${reference.title}`);
    link.append(icon("arrow-up-right", 12));
    bottom.append(link);
  }
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
  for (const key of ["q", "year", "type", "sort", "page"])
    url.searchParams.delete(key);
  if (state.query) url.searchParams.set("q", state.query);
  if (state.year !== "all") url.searchParams.set("year", state.year);
  if (state.type !== "all") url.searchParams.set("type", state.type);
  if (state.sort !== "newest") url.searchParams.set("sort", state.sort);
  if (state.page > 1) url.searchParams.set("page", String(state.page));
  history.replaceState(null, "", url);
}

function render(updateURL = true) {
  if (loadState !== "ready") return;
  const selected = selectReferences(references, state);
  const pages = Math.max(1, Math.ceil(selected.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const shown = selected.slice(start, start + PAGE_SIZE);
  list.replaceChildren(...shown.map(renderReference));
  list.setAttribute("aria-busy", "false");
  const active = Boolean(
    state.query || state.year !== "all" || state.type !== "all",
  );
  $("result-count").textContent = selected.length
    ? `${start + 1}\u2013${Math.min(start + PAGE_SIZE, selected.length)} of ${selected.length} references`
    : "0 references";
  $("clear-search").hidden = !state.query;
  $("reset-filters").hidden = !active && state.sort === "newest";
  $("empty-state").hidden = Boolean(selected.length);
  $("error-state").hidden = true;
  $("pagination").hidden = pages <= 1;
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
  if (updateURL) syncURL();
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
  $("sort").value = state.sort;
}

function reset() {
  clearTimeout(searchTimeout);
  state = readState("");
  syncInputs();
  render();
}

async function loadReferences() {
  loadState = "loading";
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
    loadState = "ready";
    const years = [
      ...new Set(references.map((item) => item.year).filter(Boolean)),
    ].sort((a, b) => b - a);
    $("year").replaceChildren(
      new Option("All years", "all"),
      ...years.map((year) => new Option(year, year)),
    );
    if (!years.includes(Number(state.year))) state.year = "all";
    $("total-count").textContent = references.length.toLocaleString("en");
    $("year-range").textContent = years.length
      ? `${years.at(-1)} \u2013 ${years[0]}`
      : "";
    syncInputs();
    render();
  } catch {
    loadState = "error";
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
for (const id of ["year", "type", "sort"])
  $(id).addEventListener("change", (event) => {
    state[id] = event.target.value;
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
$("previous-page").addEventListener("click", () => changePage(state.page - 1));
$("next-page").addEventListener("click", () => changePage(state.page + 1));
window.addEventListener("popstate", () => {
  state = readState(location.search);
  syncInputs();
  render(false);
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
loadReferences();
