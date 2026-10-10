// Survey content shown in the README, taken from the manuscript with the authors' approval (see docs/PUBLICATION.md).
// Keep wording in step with the manuscript; tools/render-readme.mjs lays it out.

export const SURVEY = {
  title: "From Physical Experience to Recursive Self-Improvement",
  subtitle: "Mechanisms, Evidence, and Open Problems in Physical AI",
  year: 2026,
  // [name, affiliation numbers]
  authors: [
    ["Meng Luo", [1]],
    ["Jiajia Song", [1]],
    ["Shanqing Xu", [2]],
    ["Yanlin Li", [1]],
    ["Kaixin Li", [1]],
    ["Ziyang Luo", [3]],
    ["Wei Chen", [2]],
    ["Hongzhan Lin", [1]],
  ],
  affiliations: ["National University of Singapore", "Huazhong University of Science and Technology", "Hong Kong Baptist University"],
  bibtexKey: "luo2026physicalrsi",
};

export const ABOUT = [
  "What turns physical experience from a source of better behavior into a source of better learning? A correction can teach a motion, " +
    "contact can reveal dynamics, and a recovery can become a reusable skill; the harder question is whether knowledge of *why* these changes " +
    "worked can improve the procedure that produces the next change. The survey reserves *recursive self-improvement* (RSI) for a stronger " +
    "relation: knowledge from earlier repairs improves the capability that revises that procedure, and the improved capability then helps improve itself.",
  "To see what present systems establish, the survey follows acquired changes (policies, predictive models, reusable skills, software, and " +
    "changes to collection, supervision, or updating) into their next use.",
];

export const CONDITIONS = [
  ["Signal specificity", "does the feedback address what the learner still lacks?"],
  ["Recipient compatibility", "can the receiving component use the change?"],
  ["Round-to-round shift", "does its value survive later changes in behavior and in the system?"],
  ["Physical continuation", "can informative trials continue under sensing, reset, safety, and resource limits?"],
];
export const CONDITIONS_NOTE =
  "This view explains why successful data collection may yield poor teaching data, and why more accurate prediction may fail to improve control.";

export const FIGURES = {
  1: ["Learning behavior and learning how to improve it.", "The upper loop applies a fixed recipe; the lower route retains repair knowledge that guides later learning. The dashed return asks whether that knowledge also improves how the next revision is made."],
  2: ["The review at a glance.", "The rows give the four uses of an acquired change (Sections 3–6), the four conditions for carrying it into the next round, and the four claims a comparison can establish. Illustrations show the grasping robot’s four breakdowns from Section 1."],
  3: ["Four later uses of acquired change.", "Each column gives the retained change and its immediate use (Table 3). Dashed arrows show secondary handoffs: a policy may become a collector, a model may supply judgments, and memory may guide an updater."],
  6: ["Testing the two links of recursive self-improvement.", "Top: does acquired repair knowledge make the reviser produce a better learning procedure on common new failures? Bottom: does a self-revision proposed with that knowledge beat one proposed with it frozen? The diagram specifies proposed comparisons, not reported results."],
};

export const QUESTIONS = [
  ["RQ1", "What limits the next improvement?", "Is useful experience missing, or is progress limited by supervision, optimization, action generation, interfaces, or retention?"],
  ["RQ2", "Which changes address that limitation?", "How does experience change behavior, reusable models or skills, and the collection, supervision, curriculum, or update procedures used in later learning?"],
  ["RQ3", "When can improvements build on one another?", "What lets one round improve the next, and what causes saturation, drift, or regression?"],
  ["RQ4", "What changes in the physical world?", "How do sensing, embodiment, reset, safety, cost, and hardware changes constrain the process?"],
];

// Table 3 of the manuscript, with the chapter that discusses each use
export const USES = [
  ["Behavior", "Policy, value, residual", "Execute or choose actions", "Better task behavior", "§3 Policy updates"],
  ["Prediction and practice", "Dynamics or world model", "Plan or supply training experience", "Better decisions or learning", "§4 World models"],
  ["Reuse and recovery", "Memory, skill, contract, program", "Retrieve, recover, or synthesize", "Reusable execution knowledge", "§5 External knowledge"],
  ["Learning procedure", "Collector, evaluator, editor, updater", "Choose experience, judge, or construct updates", "Better subsequent learning", "§6 Learning procedure updates"],
];

export const EVIDENCE =
  "Existing experiments demonstrate behavioral gains, some later-learning benefits, and local procedure improvements, with detailed hardware " +
  "evidence concentrated in manipulation. Isolating the causal chain that recursion requires is the next step.";

export const OUTLINE = [
  ["1", "Introduction", ""],
  ["2", "Background and Framework", "Robot learning in brief · What this review covers · How each study is read · What counts as progress · Why physical experience differs"],
  ["3", "Self-Improvement via Policy Updates", "From practice to training targets · From feedback to better actions · From proposals to policies · From single runs to lifelong practice"],
  ["4", "Self-Improvement via World Models", "Using models to plan and train · Feeding models the right data · Shaping what models predict · Judging models by their use"],
  ["5", "Self-Improvement via External Knowledge", "Remembering experience · Reusing skills and code · Transferring across robots"],
  ["6", "Self-Improvement via Learning Procedure Updates", "Teaching the next learner · Choosing what to practice · Revising how success is judged · Learning how to update · Automating the experiment loop"],
  ["7", "What Current Evidence Shows", "Evidence by claim · Limits of the evidence"],
  ["8", "Why Self-Improvement Stalls", "When data stop teaching · When models and rewards fall behind · When bottlenecks move · When knowledge is lost or misused · When costs outrun gains"],
  ["9", "Keeping Self-Improvement Safe", "Keeping practice possible · Protecting the judge · Admitting and undoing changes · Placing human oversight"],
  ["10", "Toward Recursive Self-Improvement", "What recursion requires · How to test recursion"],
  ["11", "Challenges and Future Directions", "Six open problems (below)"],
  ["12", "Conclusion", ""],
  ["A–D", "Appendices", "Additional systems and learning settings · Reported outcomes and experimental context · Experimental interpretation · Glossary"],
];

export const RECURSION = [
  ["Useful results and revised procedures can already help the next learner.", "Later-learning benefits and local procedure improvements are tested in several physical and simulated comparisons."],
  ["Repair knowledge can improve the reviser.", "Testing this first link requires comparing the reviser with its earlier and its acquired repair knowledge."],
  ["The improved reviser must help improve itself.", "This second link must hold under the same physical constraints that sustain ordinary learning."],
  ["Where to start.", "Reward construction or skill-library editing: their revisions are inspectable, can be screened in simulation, and can then be confirmed on hardware through matched later learners. Eureka (a reward reviser whose knowledge does not change) and PRACTICE (a learned skill editor whose own reviser is fixed) already supply baselines."],
];

// Table 14 of the manuscript: [direction, conditions served, central question, starting benchmark]
export const PROBLEMS = [
  ["Finding the bottleneck", ["Signal specificity"], "Which component limits the next improvement?", "Injected policy, model, evaluator, and interface faults with similar terminal outcomes; held-out natural failures"],
  ["Choosing the next experiment", ["Signal specificity"], "Which probe yields evidence that an available update can use?", "Fixed starting system and budget; joint selection versus fixed, information-gain-only, and sequential baselines"],
  ["Keeping judges aligned", ["Round-to-round shift"], "How can evaluators be refreshed without changing the intended task?", "Fixed learner and data; varied evaluator and refresh rule; protected physical outcomes"],
  ["Transferring repair knowledge", ["Recipient compatibility"], "Does knowledge about earlier repairs improve repairs on new failure families?", "The two-round comparison of Figure 6 on held-out failure families"],
  ["Surviving system changes", ["Recipient compatibility", "Round-to-round shift"], "When should an artifact be reused, adapted, revalidated, or retired?", "Declared changes to sensing, embodiment, timing, interfaces, and memory schemas, plus gradual drift"],
  ["Budgeting physical resources", ["Physical continuation"], "How should robot time, human attention, compute, and wear be spent over time?", "Task sequences with maintenance events under finite capacities; Pareto reporting of resources"],
];

export const PROGRAMS = [
  "Combine cross-component diagnosis with joint experiment–update selection under matched multi-resource budgets.",
  "Test versioned evaluators and repair knowledge on held-out failures and declared hardware or software changes, using protected outcome checks to separate transfer from drift.",
  "Connect these tests across at least two causally isolated procedure-revision rounds, and report the full acquisition, maintenance, and revalidation ledger.",
];

export const CLOSING =
  "The first robot that becomes measurably better at rewriting its own recipe, even for a single family of failures, will mark the moment when physical experience begins to compound.";

// BibTeX entry shared by the README and the website
export function surveyBibtex(url) {
  const authors = SURVEY.authors
    .map(([name]) => {
      const parts = name.split(" ");
      return `${parts.at(-1)}, ${parts.slice(0, -1).join(" ")}`;
    })
    .join(" and ");
  return [
    `@misc{${SURVEY.bibtexKey},`,
    `  title        = {${SURVEY.title}: ${SURVEY.subtitle}},`,
    `  author       = {${authors}},`,
    `  year         = {${SURVEY.year}},`,
    `  howpublished = {\\url{${url}}},`,
    "  note         = {Manuscript}",
    "}",
  ].join("\n");
}

export const TEASER_ALT =
  "A painting in the style of Van Gogh: under a swirling starry sky, a small robot practises grasping a mug, files the change it kept, rewrites its own learning recipe, and climbs a step holding the improved recipe, while a golden trail loops back to the start.";
