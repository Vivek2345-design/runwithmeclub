export type Program = {
  slug: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  weeks: number;
  sessions: number;
  goal: string;
  who: string;
  week: string[];
  outcome: string;
};

export const PROGRAMS: Program[] = [
  {
    slug: "couch-to-5k", name: "Start Running: 0 to 5K", level: "Beginner", weeks: 8, sessions: 3, goal: "Run 5 km without stopping",
    who: "New to running, or coming back after a long break.",
    week: ["Run/walk intervals that build week by week", "One easy social run with the group", "One strength and mobility session"],
    outcome: "Finish your first 5 km with a smile.",
  },
  {
    slug: "5k-to-10k", name: "5K to 10K", level: "Beginner", weeks: 8, sessions: 3, goal: "Run a comfortable 10 km",
    who: "You can run 5 km and want to go further.",
    week: ["Easy aerobic run", "Steady run with short pickups", "Weekly long run that grows by 1 km"],
    outcome: "A strong, controlled 10 km.",
  },
  {
    slug: "half-marathon", name: "Half Marathon Prep", level: "Intermediate", weeks: 12, sessions: 4, goal: "Complete 21.1 km strong",
    who: "Comfortable at 10 km and ready for a bigger goal.",
    week: ["Easy recovery run", "Tempo or interval session", "Mid-week steady run", "Long run with pace practice"],
    outcome: "A well-paced half marathon with a clear race plan.",
  },
  {
    slug: "marathon", name: "Marathon Build", level: "Advanced", weeks: 16, sessions: 5, goal: "Complete 42.2 km",
    who: "Experienced runners with a half marathon behind them.",
    week: ["Recovery run", "Intervals or hill repeats", "Tempo run", "Easy run and strides", "Long run with race-pace blocks"],
    outcome: "Marathon-ready with fuelling and pacing practised.",
  },
  {
    slug: "speed", name: "Get Faster: 5K and 10K", level: "Intermediate", weeks: 6, sessions: 4, goal: "Set a new personal best",
    who: "Regular runners who want to improve their pace.",
    week: ["Track-style intervals", "Easy recovery run", "Threshold tempo", "Long easy run"],
    outcome: "A race-ready pace and a new PB to aim for.",
  },
  {
    slug: "trail-hills", name: "Trails and Hills", level: "Intermediate", weeks: 8, sessions: 3, goal: "Run hills and trails with confidence",
    who: "Road runners curious about trails and elevation.",
    week: ["Hill repeats", "Easy trail run", "Long run on rolling terrain"],
    outcome: "Stronger legs and better downhill technique.",
  },
];
