import React, { useMemo, useState } from "react";
import "./app.css";

type Light = "GREEN" | "YELLOW" | "RED";

type Option = {
  id: string;
  label: string;
  points: number;
  impact: 0 | 1 | 2 | 3 | 4;
  interpretation: string;
  hardStop?: boolean;
  tags?: string[];
};

type Question = {
  id: string;
  section: string;
  title: string;
  help?: string;
  required?: boolean;
  multiple?: boolean;
  options: Option[];
};

type Answers = Record<string, string[] | string | null>;

function asArray(v: string[] | string | null | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const QUESTIONS: Question[] = [
  {
    id: "context_location",
    section: "Project context",
    title: "Where is the studio located?",
    help: "This determines how much isolation is realistically achievable and how much risk you carry.",
    required: true,
    options: [
      {
        id: "detached",
        label: "Detached structure (separate building)",
        points: 0,
        impact: 0,
        interpretation:
          "Best-case context. Detached buildings reduce flanking paths into living spaces and make high isolation more achievable.",
        tags: ["detached"],
      },
      {
        id: "attached",
        label: "Attached to a house (garage conversion / addition)",
        points: 1,
        impact: 1,
        interpretation:
          "Very workable, but the connection to the house creates extra flanking paths. Planning details matter more than in a detached build.",
        tags: ["attached"],
      },
      {
        id: "inside_house",
        label: "Inside a house (basement / spare room)",
        points: 2,
        impact: 2,
        interpretation:
          "More complex than a garage. Existing structure + shared pathways (stairs, framing, ductwork) raise the bar, but good results are still possible with realistic goals.",
        tags: ["inside_house"],
      },
      {
        id: "shared_building",
        label: "Apartment / condo / shared building",
        points: 999,
        impact: 4,
        hardStop: true,
        interpretation:
          "Shared buildings add legal/HOA limits and extreme flanking paths. Reliable studio isolation is rarely practical without major structural work you likely can’t do.",
        tags: ["shared_building"],
      },
    ],
  },
  {
    id: "floor_type",
    section: "Structure",
    title: "What is the primary floor construction?",
    help: "High-isolation studios are most reliable on a concrete slab. Wood floors can work for lighter use cases, but they cap what’s achievable—especially for drums and bass.",
    required: true,
    options: [
      {
        id: "slab",
        label: "Concrete slab",
        points: 0,
        impact: 0,
        interpretation:
          "Strong foundation for serious isolation. Slabs reduce low-frequency vibration transmission and make high-performance outcomes more predictable.",
        tags: ["floor_slab"],
      },
      {
        id: "wood_crawl",
        label: "Wood floor over crawlspace",
        points: 2,
        impact: 2,
        interpretation:
          "This floor type places a hard ceiling on achievable sound isolation, especially for low-frequency energy. Projects can still succeed when sound isolation is not the primary goal, expectations are clearly defined, and use cases are controlled. If high isolation is the objective, a slab-on-grade foundation is strongly preferred.",
        tags: ["floor_wood", "floor_crawl"],
      },
      {
        id: "wood_living",
        label: "Wood floor over living space",
        points: 4,
        impact: 3,
        interpretation:
          "This structure is fundamentally limited for sound isolation. Voice and low-impact use cases can work well, but projects aimed at containing amplified or percussive sound typically involve significant compromise or disproportionate cost.",
        tags: ["floor_wood", "floor_living_below"],
      },
    ],
  },
  {
    id: "ceiling_height",
    section: "Structure",
    title: "What is the existing ceiling height (before any soundproofing)?",
    help: "Soundproofing consumes height. If you start too low, you can end up with an unusable room after isolation + ducting + finishes.",
    required: true,
    options: [
      {
        id: "h_9plus",
        label: "9 ft or higher",
        points: 0,
        impact: 0,
        interpretation:
          "Excellent starting height. You have room for isolation details, lighting, and ventilation routing without the room feeling cramped.",
        tags: ["height_green"],
      },
      {
        id: "h_8_9",
        label: "8–9 ft",
        points: 0,
        impact: 0,
        interpretation:
          "Solid starting height. Most garage/basement studios can succeed here with a coordinated plan.",
        tags: ["height_green"],
      },
      {
        id: "h_7_8",
        label: "7–8 ft",
        points: 2,
        impact: 2,
        interpretation:
          "Constraint territory. Still possible, but finished height can get tight and ventilation becomes more difficult. This often pushes projects toward smarter compromises.",
        tags: ["height_yellow"],
      },
      {
        id: "h_under7",
        label: "Under 7 ft",
        points: 999,
        impact: 4,
        hardStop: true,
        interpretation:
          "Fundamental constraint. After isolation + ventilation, the room often becomes impractical. Most projects in this range should reassess the site or scope.",
        tags: ["height_too_low"],
      },
    ],
  },
  {
    id: "above_space",
    section: "Structure",
    title: "What is above the space?",
    required: true,
    options: [
      {
        id: "attic",
        label: "Attic / roof only",
        points: 0,
        impact: 0,
        interpretation:
          "Best-case condition. No occupied space above reduces the isolation target and lowers risk of flanking.",
        tags: ["above_attic"],
      },
      {
        id: "living",
        label: "Living space (bedroom, office, etc.)",
        points: 2,
        impact: 2,
        interpretation:
          "Higher stakes. Impact noise and flanking become more likely, and your ceiling assembly has to do more work.",
        tags: ["above_living"],
      },
      {
        id: "other_unit",
        label: "Another dwelling unit",
        points: 999,
        impact: 4,
        hardStop: true,
        interpretation:
          "Fundamental risk. Separate dwelling units add strict noise expectations and extreme flanking paths—reliable results are rarely practical.",
        tags: ["above_other_unit"],
      },
    ],
  },
  {
    id: "neighbors",
    section: "Noise stakes",
    title: "Who are you trying not to disturb?",
    required: true,
    options: [
      {
        id: "no_one",
        label: "No one (rural / isolated)",
        points: 0,
        impact: 0,
        interpretation:
          "Lowest stakes. You may be able to meet your goals with less extreme construction.",
        tags: ["neighbors_none"],
      },
      {
        id: "family",
        label: "Family in the same house",
        points: 1,
        impact: 1,
        interpretation:
          "Common scenario. You’ll want good isolation, but expectations can be calibrated (especially by time-of-day and use case).",
        tags: ["neighbors_family"],
      },
      {
        id: "20_50",
        label: "Neighbors about 20–50 ft away",
        points: 1,
        impact: 1,
        interpretation:
          "Manageable with a proper system. Close enough that doors, ventilation, and airtightness matter.",
        tags: ["neighbors_near"],
      },
      {
        id: "lt20",
        label: "Neighbors closer than 20 ft / shared walls nearby",
        points: 3,
        impact: 3,
        interpretation:
          "High stakes. This raises the isolation target substantially and makes order-of-operations mistakes very expensive.",
        tags: ["neighbors_very_close"],
      },
    ],
  },
  {
    id: "use_cases",
    section: "Use case",
    title: "What are you trying to contain?",
    help: "Select all that apply. Low-frequency sources (drums, bass-heavy amps) dramatically raise the isolation bar.",
    required: true,
    multiple: true,
    options: [
      {
        id: "voice",
        label: "Voice / podcast / streaming",
        points: 0,
        impact: 0,
        interpretation:
          "Most forgiving use case. Excellent fit for garages and basements with reasonable expectations.",
        tags: ["src_voice"],
      },
      {
        id: "acoustic",
        label: "Acoustic instruments",
        points: 1,
        impact: 1,
        interpretation:
          "Still very achievable in many sites. Requires attention to airtightness and ventilation noise.",
        tags: ["src_acoustic"],
      },
      {
        id: "amps",
        label: "Amplified instruments at moderate volume",
        points: 2,
        impact: 2,
        interpretation:
          "Achievable, but the isolation target rises. Door performance and ventilation design become major determinants of success.",
        tags: ["src_amps"],
      },
      {
        id: "drums",
        label: "Drum kit / band rehearsal / performance volume",
        points: 5,
        impact: 3,
        interpretation:
          "Highest-impact source. Best matched to slab-on-grade builds. On wood floors, results are possible only in limited scenarios and often require compromises.",
        tags: ["src_drums"],
      },
    ],
  },
  {
    id: "time_of_use",
    section: "Use case",
    title: "When will you primarily use the studio?",
    required: true,
    options: [
      {
        id: "day",
        label: "Daytime only",
        points: 0,
        impact: 0,
        interpretation:
          "Best-case scheduling. Lower isolation target and fewer conflicts with family/neighbors.",
        tags: ["time_day"],
      },
      {
        id: "evening",
        label: "Evenings",
        points: 1,
        impact: 1,
        interpretation:
          "Common and workable. Raises the target slightly depending on neighbors and use case.",
        tags: ["time_evening"],
      },
      {
        id: "late",
        label: "Late night (after ~10pm)",
        points: 2,
        impact: 2,
        interpretation:
          "Higher stakes. Quiet hours raise expectations, so the room needs more isolation (and quieter ventilation).",
        tags: ["time_late"],
      },
      {
        id: "overnight",
        label: "Any time, including overnight",
        points: 3,
        impact: 3,
        interpretation:
          "Very high stakes. This significantly increases the bar for success in attached homes and close-neighbor situations.",
        tags: ["time_overnight"],
      },
    ],
  },
  {
    id: "expectation",
    section: "Expectations",
    title: "What does “success” look like to you?",
    help: "Soundproofing is about managing transmission. “Complete silence” is rarely realistic in shared structures or high-stakes scenarios.",
    required: true,
    options: [
      {
        id: "not_notice",
        label: "No one notices normal use",
        points: 0,
        impact: 0,
        interpretation:
          "Strong, realistic target for many garage/basement studios when designed as a system.",
        tags: ["exp_reasonable"],
      },
      {
        id: "faint",
        label: "Loud sessions are faintly audible",
        points: 1,
        impact: 1,
        interpretation:
          "Practical expectation. This framing often leads to better cost/performance decisions.",
        tags: ["exp_reasonable"],
      },
      {
        id: "restricted",
        label: "Occasional loud sessions at restricted times",
        points: 2,
        impact: 2,
        interpretation:
          "Good compromise mindset. Scheduling + smart design choices can outperform “more materials.”",
        tags: ["exp_some_compromise"],
      },
      {
        id: "silence",
        label: "Complete silence outside the room",
        points: 4,
        impact: 3,
        interpretation:
          "Very strict target. Often requires extreme construction or leads to disappointment unless the site is ideal (detached + slab + robust ventilation).",
        tags: ["exp_unrealistic"],
      },
    ],
  },
  {
    id: "mods",
    section: "Constraints",
    title: "Are you willing to permanently modify the structure?",
    help: "High-performing isolation requires real construction changes.",
    required: true,
    options: [
      {
        id: "yes",
        label: "Yes, structural changes are acceptable",
        points: 0,
        impact: 0,
        interpretation:
          "Great. True isolation requires structural decisions (framing, decoupling, airtightness, doors/windows, ventilation).",
        tags: ["mods_ok"],
      },
      {
        id: "minor",
        label: "Minor changes only",
        points: 2,
        impact: 2,
        interpretation:
          "Constraint. Limited modifications often cap achievable isolation and increase the chance of weak links (especially doors/ventilation).",
        tags: ["mods_limited"],
      },
      {
        id: "no",
        label: "No permanent modifications",
        points: 999,
        impact: 4,
        hardStop: true,
        interpretation:
          "Fundamental blocker for serious soundproofing. Without permanent construction changes, reliable isolation outcomes are unlikely.",
        tags: ["mods_none"],
      },
    ],
  },
  {
    id: "ventilation",
    section: "Ventilation",
    title: "Can ventilation equipment be added or modified?",
    help: "A sealed room without a quiet ventilation strategy is a common studio failure point.",
    required: true,
    options: [
      {
        id: "vent_yes",
        label: "Yes, fully flexible",
        points: 0,
        impact: 0,
        interpretation:
          "Excellent. Quiet ventilation is a pillar of a successful studio—this flexibility makes the whole system more viable.",
        tags: ["vent_ok"],
      },
      {
        id: "vent_limited",
        label: "Limited options",
        points: 2,
        impact: 2,
        interpretation:
          "Constraint. You can still succeed, but ventilation often becomes the limiting factor (noise, airflow, routing).",
        tags: ["vent_limited"],
      },
      {
        id: "vent_no",
        label: "No changes allowed",
        points: 999,
        impact: 4,
        hardStop: true,
        interpretation:
          "Fundamental blocker. A sealed studio without ventilation changes tends to fail (comfort, CO₂, and noise control).",
        tags: ["vent_none"],
      },
    ],
  },
  {
    id: "budget",
    section: "Budget reality",
    title: "What build budget range are you mentally prepared for (design + build)?",
    help: "This helps calibrate what outcomes are realistic based on your site and use case.",
    required: true,
    options: [
      {
        id: "b_lt10",
        label: "Under $10k",
        points: 4,
        impact: 3,
        interpretation:
          "Impractical budget for meaningful sound isolation. Any reasonable sound isolation should not be expected at this level.",
        tags: ["budget_low"],
      },
      {
        id: "b_10_25",
        label: "$10k–$25k",
        points: 2,
        impact: 2,
        interpretation:
          "Light sound isolation may be possible only if the space is small (typically under ~200 sq ft) and a significant portion of the labor is DIY.",
        tags: ["budget_mediumlow"],
      },
      {
        id: "b_25_50",
        label: "$25k–$50k",
        points: 1,
        impact: 1,
        interpretation:
          "Viable for many residential studios when goals are clearly defined and the system is planned up front.",
        tags: ["budget_medium"],
      },
      {
        id: "b_50plus",
        label: "$50k+",
        points: 0,
        impact: 0,
        interpretation:
          "Best flexibility. This range supports a coordinated isolation and ventilation system with fewer compromises.",
        tags: ["budget_high"],
      },
    ],
  },
  {
    id: "mindset",
    section: "Decision posture",
    title: "If your assessment result is Yellow or Red, what would you do?",
    required: true,
    options: [
      {
        id: "reconsider",
        label: "Reconsider the location",
        points: 0,
        impact: 0,
        interpretation:
          "Strong decision posture. Site selection is often the cheapest “soundproofing upgrade” you can make.",
        tags: ["mindset_flexible"],
      },
      {
        id: "adjust",
        label: "Adjust expectations / scope",
        points: 1,
        impact: 1,
        interpretation:
          "Healthy flexibility. Success often comes from aligning goals with what the site can reliably support.",
        tags: ["mindset_flexible"],
      },
      {
        id: "try_anyway",
        label: "Try anyway",
        points: 3,
        impact: 3,
        interpretation:
          "Risky posture. This usually leads to overspending or disappointment unless constraints are clearly understood and accepted.",
        tags: ["mindset_risky"],
      },
    ],
  },
];

function collectTags(answers: Answers): string[] {
  const tags: string[] = [];
  for (const q of QUESTIONS) {
    const picked = asArray(answers[q.id] as any);
    for (const optId of picked) {
      const opt = q.options.find((o) => o.id === optId);
      if (opt?.tags?.length) tags.push(...opt.tags);
    }
  }
  return unique(tags);
}

function computeCapabilityTier(tags: string[]): "A" | "B" | "C" {
  if (tags.includes("floor_slab")) return "A";
  if (tags.includes("floor_crawl")) return "B";
  return "C";
}

function computePoints(answers: Answers): { points: number; hardStopTriggered: boolean } {
  let points = 0;
  let hardStopTriggered = false;
  for (const q of QUESTIONS) {
    const picked = asArray(answers[q.id] as any);
    for (const optId of picked) {
      const opt = q.options.find((o) => o.id === optId);
      if (!opt) continue;
      if (opt.hardStop) hardStopTriggered = true;
      points += opt.points ?? 0;
    }
  }
  return { points, hardStopTriggered };
}

type EvalResult = {
  light: Light;
  title: string;
  summary: string;
  bullets: string[];
  ctaPrimary: string;
  meta: {
    points: number;
    hardStopTriggered: boolean;
    capabilityTier: "A" | "B" | "C";
    tags: string[];
  };
};

function evaluate(answers: Answers): EvalResult {
  const tags = collectTags(answers);
  const tier = computeCapabilityTier(tags);
  const { points, hardStopTriggered } = computePoints(answers);

  const hasDrums = tags.includes("src_drums");
  const veryClose = tags.includes("neighbors_very_close");
  const late = tags.includes("time_late") || tags.includes("time_overnight");
  const sharedBuilding = tags.includes("shared_building") || tags.includes("above_other_unit");

  const dynamicHardStop =
    sharedBuilding ||
    (hasDrums &&
      tier !== "A" &&
      ((tier === "B" && veryClose && late) || (tier === "C" && (veryClose || late))));

  const hardStop = hardStopTriggered || dynamicHardStop;

  let light: Light;
  if (hardStop) {
    light = "RED";
  } else {
    if (tier === "C") {
      light = points <= 10 ? "YELLOW" : "RED";
    } else if (tier === "B") {
      light = points <= 12 ? "YELLOW" : "RED";
    } else {
      light = points <= 7 ? "GREEN" : points <= 14 ? "YELLOW" : "RED";
    }
  }

  const floorNote =
    tier === "A"
      ? "A concrete slab is a strong foundation for high isolation when the full system is designed together."
      : tier === "B"
      ? "A wood floor over crawlspace limits low-frequency isolation. Projects can still succeed when isolation is not the primary goal and expectations are controlled."
      : "A wood floor over living space places a hard ceiling on achievable isolation—especially for low-frequency energy like drums and bass.";

  const sourcesNote = hasDrums
    ? "Drums and band-level sound are low-frequency dominant. These projects succeed only when structure, isolation, airtightness, and ventilation are coordinated as one system."
    : "Lighter use cases (voice, editing, moderate instruments) are more forgiving—but still benefit from a coordinated plan.";

  const stakesNote =
    veryClose || late
      ? "Close neighbors and/or late-night use significantly raise the bar for success."
      : "Your disturbance context sets the isolation target—and the construction complexity required.";

  const expectationFlag = tags.includes("exp_unrealistic")
    ? "Your success target appears very strict. Most failures come from an expectation mismatch rather than “bad materials.”"
    : "Your success target appears reasonably calibrated for a professional plan.";

  const budgetFlag = tags.includes("budget_low")
    ? "Budget appears to be a limiting factor. If isolation is the goal, scope and expectations must be adjusted to avoid disappointment."
    : "Budget appears broadly compatible with a planned approach.";

  const greenSlabNote =
    "Most Green results occur on a concrete slab foundation. Slabs dramatically improve predictability for isolation—especially for low-frequency energy.";

  const commonBullets = [floorNote, sourcesNote, stakesNote, expectationFlag, budgetFlag];

  if (light === "GREEN") {
    return {
      light,
      title: "Green Light — Viable to Proceed",
      summary:
        "Your site supports a reliable soundproof studio outcome, assuming isolation and ventilation are designed together before construction.",
      bullets: [
        commonBullets[0],
        greenSlabNote,
        ...commonBullets.slice(1),
        "Next step: define the isolation strategy + ventilation pathing before any irreversible framing or electrical decisions.",
      ],
      ctaPrimary: "Book a Soundproof Planning Call",
      meta: { points, hardStopTriggered: hardStop, capabilityTier: tier, tags },
    };
  }

  if (light === "YELLOW") {
    return {
      light,
      title: "Yellow Light — Elevated Risk",
      summary:
        "Soundproofing may be possible, but your site includes risk factors that typically increase cost, complexity, or required compromise.",
      bullets: [
        ...commonBullets,
        "Next step: get a professional plan to avoid expensive rework (most failures happen from order-of-operations mistakes).",
      ],
      ctaPrimary: "Book a Soundproof Planning Call",
      meta: { points, hardStopTriggered: hardStop, capabilityTier: tier, tags },
    };
  }

  return {
    light: "RED",
    title: "Red Light — Not Advisable",
    summary:
      "This site has constraints that make reliable soundproofing unlikely or disproportionately expensive relative to the outcome—especially for your stated use case.",
    bullets: [
      ...commonBullets,
      "Best move: reconsider location or dramatically adjust expectations before you spend money on construction.",
    ],
    ctaPrimary: "Book a Soundproof Planning Call",
    meta: { points, hardStopTriggered: hardStop, capabilityTier: tier, tags },
  };
}

function lightClass(light: Light) {
  if (light === "GREEN") return "pill pill-green";
  if (light === "YELLOW") return "pill pill-yellow";
  return "pill pill-red";
}

function impactLabel(impact: 0 | 1 | 2 | 3 | 4) {
  if (impact >= 4) return { label: "Blocker", cls: "pill pill-red" };
  if (impact >= 3) return { label: "Major", cls: "pill pill-orange" };
  if (impact >= 2) return { label: "Constraint", cls: "pill pill-yellow" };
  if (impact >= 1) return { label: "Minor", cls: "pill" };
  return { label: "Supportive", cls: "pill pill-green" };
}

function OptionButton(props: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={props.selected ? "opt opt-selected" : "opt"}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function ResultsBreakdown({ answers }: { answers: Answers }) {
  const rows = useMemo(() => {
    return QUESTIONS.map((q) => {
      const picked = asArray(answers[q.id] as any);
      const opts = picked.map((id) => q.options.find((o) => o.id === id)).filter(Boolean) as Option[];
      const maxImpact = (opts.reduce((m, o) => Math.max(m, o.impact ?? 0), 0) as 0 | 1 | 2 | 3 | 4) ?? 0;
      return { q, opts, maxImpact };
    });
  }, [answers]);

  const primaryConstraints = useMemo(() => {
    const items = rows
      .flatMap((r) =>
        r.opts.map((o) => ({
          qId: r.q.id,
          qTitle: r.q.title,
          optId: o.id,
          optLabel: o.label,
          impact: (o.impact ?? 0) as 0 | 1 | 2 | 3 | 4,
          points: o.points ?? 0,
          interpretation: o.interpretation ?? "",
        }))
      )
      .filter((x) => x.impact >= 2)
      .sort((a, b) => {
        const aWood = a.qId === "floor_type" && (a.optId === "wood_crawl" || a.optId === "wood_living");
        const bWood = b.qId === "floor_type" && (b.optId === "wood_crawl" || b.optId === "wood_living");
        if (aWood !== bWood) return aWood ? -1 : 1;
        return (b.impact - a.impact) || (b.points - a.points);
      });

    const seen = new Set<string>();
    const top: typeof items = [];
    for (const it of items) {
      if (seen.has(it.qId)) continue;
      seen.add(it.qId);
      top.push(it);
      if (top.length >= 3) break;
    }
    return top;
  }, [rows]);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h">
          <div className="card-title">Primary constraints</div>
          <div className="muted">The biggest drivers behind your result.</div>
        </div>
        <div className="card-b">
          {primaryConstraints.length ? (
            <div className="stack">
              {primaryConstraints.map((c, idx) => {
                const pill = impactLabel(c.impact);
                return (
                  <div key={idx} className="box">
                    <div className="row">
                      <div className="strong">{c.qTitle}</div>
                      <span className={pill.cls}>{pill.label}</span>
                    </div>
                    <div className="muted">Your answer: {c.optLabel}</div>
                    <div className="text">{c.interpretation}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="box">No major constraints detected.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div className="card-title">Your answers (review + interpretation)</div>
          <div className="muted">A professional interpretation of each input.</div>
        </div>
        <div className="card-b">
          <div className="stack">
            {rows.map((r) => {
              const pill = impactLabel(r.maxImpact);
              return (
                <div key={r.q.id} className="box">
                  <div className="row">
                    <div className="strong">{r.q.title}</div>
                    <span className={pill.cls}>{pill.label}</span>
                  </div>
                  <div className="muted">{r.opts.length ? r.opts.map((o) => o.label).join("; ") : "—"}</div>
                  {r.opts.length ? (
                    <div className="stack" style={{ marginTop: 10 }}>
                      {r.opts.map((o) => {
                        const op = impactLabel((o.impact ?? 0) as any);
                        return (
                          <div key={o.id} className="subbox">
                            <div className="row">
                              <div className="strong">{o.label}</div>
                              <span className={op.cls}>{op.label}</span>
                            </div>
                            <div className="text">{o.interpretation}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const [answers, setAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    for (const q of QUESTIONS) init[q.id] = q.multiple ? [] : null;
    return init;
  });

  const totalSteps = QUESTIONS.length;
  const current = QUESTIONS[step];
  const picked = asArray(answers[current.id] as any);
  const currentComplete = current.multiple ? picked.length > 0 : picked.length === 1;

  const allComplete = useMemo(() => {
    for (const q of QUESTIONS) {
      const p = asArray(answers[q.id] as any);
      if (q.required) {
        if (q.multiple && p.length === 0) return false;
        if (!q.multiple && p.length !== 1) return false;
      }
    }
    return true;
  }, [answers]);

  const result = useMemo(() => (showResult ? evaluate(answers) : null), [showResult, answers]);

  const progress = useMemo(() => {
    if (showResult) return 100;
    return Math.round(((step + 1) / totalSteps) * 100);
  }, [showResult, step, totalSteps]);

  function toggleOption(q: Question, optId: string) {
    setAnswers((prev) => {
      const p = asArray(prev[q.id] as any);
      if (q.multiple) {
        const next = p.includes(optId) ? p.filter((x) => x !== optId) : [...p, optId];
        return { ...prev, [q.id]: next };
      }
      return { ...prev, [q.id]: optId };
    });
  }

  function restart() {
    const init: Answers = {};
    for (const q of QUESTIONS) init[q.id] = q.multiple ? [] : null;
    setAnswers(init);
    setStep(0);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="page">
      <div className="layout">
        <aside className="side">
          <div className="card">
            <div className="card-h">
              <div className="h1">Soundproof Studio Site Assessment</div>
              <div className="muted">Find out if your space is worth building in—before you spend a dollar.</div>
            </div>
            <div className="card-b stack">
              <div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="muted">Progress</div>
                  <div className="muted">{showResult ? "Complete" : `${step + 1} / ${totalSteps}`}</div>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="box">
                <div className="strong">What this is</div>
                <div className="muted">
                  A professional viability check based on common failure points in real soundproof studio projects.
                </div>
                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Not a quote, a guarantee, or a set of instructions.
                </div>
              </div>

              <div className="row">
                <button className="btn btn-ghost" onClick={restart} type="button">
                  Reset
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    window.location.href = "https://www.soundproofyourstudio.com/Step1";
                  }}
                  type="button"
                >
                  Book a Call
                </button>
              </div>

              <div className="muted" style={{ fontSize: 12 }}>
                Replace the “Book a Call” URL when you publish.
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          {!showResult ? (
            <div className="card">
              <div className="card-h">
                <div className="muted strong">{current.section}</div>
                <div className="h2">{current.title}</div>
                {current.help ? <div className="muted">{current.help}</div> : null}
                <div style={{ marginTop: 10 }}>
                  <span className="pill">{current.multiple ? "Select all that apply" : "Select one"}</span>
                </div>
              </div>
              <div className="card-b stack">
                <div className="stack">
                  {current.options.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      selected={picked.includes(opt.id)}
                      label={opt.label}
                      onClick={() => toggleOption(current, opt.id)}
                    />
                  ))}
                </div>

                <div className="row" style={{ justifyContent: "space-between" }}>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                  >
                    Back
                  </button>

                  {step < totalSteps - 1 ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                      disabled={!currentComplete}
                    >
                      Next
                    </button>
                  ) : (
                    <button className="btn" type="button" onClick={() => setShowResult(true)} disabled={!allComplete}>
                      Get My Result
                    </button>
                  )}
                </div>

                {!currentComplete ? <div className="warn">Select an option to continue.</div> : null}
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-h">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span className={lightClass(result!.light)}>
                      {result!.light === "GREEN" ? "Green" : result!.light === "YELLOW" ? "Yellow" : "Red"} Light
                    </span>
                    <span className="pill">
                      {result!.meta.capabilityTier === "A"
                        ? "High isolation possible (slab)"
                        : result!.meta.capabilityTier === "B"
                        ? "Medium isolation only (wood over crawlspace)"
                        : "Light isolation only (wood over living space)"}
                    </span>
                  </div>
                  <div className="h2" style={{ marginTop: 10 }}>
                    {result!.title}
                  </div>
                  <div className="muted">{result!.summary}</div>
                </div>
                <div className="card-b stack">
                  <div className="stack">
                    {result!.bullets.map((b, i) => (
                      <div key={i} className="box">
                        {b}
                      </div>
                    ))}
                  </div>

                  <div className="row">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        window.location.href = "https://www.soundproofyourstudio.com/Step1";
                      }}
                    >
                      {result!.ctaPrimary}
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={restart}>
                      Restart
                    </button>
                  </div>

                  <div className="box dark">
                    <div className="strong">Important</div>
                    <div className="muted" style={{ color: "rgba(255,255,255,0.85)" }}>
                      This assessment is directional. Soundproofing success depends on a coordinated system: isolation,
                      structure, airtightness, doors/windows, and a quiet ventilation strategy.
                    </div>
                  </div>
                </div>
              </div>

              <ResultsBreakdown answers={answers} />
            </>
          )}

          <div className="muted" style={{ fontSize: 12, marginTop: 16 }}>
            © {new Date().getFullYear()} Soundproof Your Studio
          </div>
        </main>
      </div>
    </div>
  );
}