import type { EggState, FeedItem, OmiLogEntry, SupportActionOut } from "../types";

export const MOCK_FEED: FeedItem[] = [
  {
    slug: "sarahs-egg",
    name: "Sarah",
    phone: "+15551234567",
    base: "fried",
    is_sleeping: false,
    supported: true,
    support_count: 2,
    dimensions: { sleep: "red", stress: "red", meds: "red" },
    dimension_details: {
      sleep:    { score: 20, label: "2.0h",      sublabel: "severe deficit",  history: [65, 55, 45, 38, 30, 24, 20] },
      stress:   { score: 35, label: "HRV 22ms",  sublabel: "high stress",     history: [60, 52, 48, 42, 38, 35, 35] },
      activity: { score: 18, label: "340 steps",  sublabel: "very sedentary",  history: [50, 42, 35, 28, 22, 20, 18] },
      meds:     { score: 0,  label: "0/5 taken",  sublabel: "none taken",      history: [] },
    },
    vitals: { steps: 340, resting_hr: 88, hrv: 22 },
    recommended_actions: ["call", "food", "text"],
  },
  {
    slug: "emma-thriving",
    name: "Emma",
    phone: "+15559876543",
    base: "thriving",
    is_sleeping: false,
    supported: false,
    support_count: 0,
    dimensions: { sleep: "green", stress: "green", meds: "green" },
    dimension_details: {
      sleep:    { score: 92, label: "8.2h",      sublabel: "well rested",    history: [88, 91, 94, 90, 87, 93, 92] },
      stress:   { score: 88, label: "HRV 62ms",  sublabel: "good recovery",  history: [82, 85, 86, 88, 84, 87, 88] },
      activity: { score: 90, label: "9,420 steps", sublabel: "great movement", history: [78, 82, 88, 91, 85, 90, 90] },
      meds:     { score: 100, label: "Taken",    sublabel: "on schedule",    history: [] },
    },
    vitals: { steps: 9420, resting_hr: 54, hrv: 62 },
    recommended_actions: ["text", "coffee"],
  },
  {
    slug: "mia-struggling",
    name: "Mia",
    phone: "+15555550101",
    base: "fried",
    is_sleeping: false,
    supported: true,
    support_count: 4,
    dimensions: { sleep: "red", stress: "red", meds: "yellow" },
    dimension_details: {
      sleep:    { score: 44, label: "3.9h",      sublabel: "deep deficit",   history: [72, 65, 58, 50, 44, 40, 44] },
      stress:   { score: 51, label: "HRV 28ms",  sublabel: "needs rest",     history: [70, 62, 58, 53, 51, 49, 51] },
      activity: { score: 30, label: "820 steps", sublabel: "very sedentary", history: [55, 48, 40, 35, 32, 28, 30] },
      meds:     { score: 60, label: "Partial",   sublabel: "missed evening", history: [] },
    },
    vitals: { steps: 820, resting_hr: 78, hrv: 28 },
    recommended_actions: ["call", "food", "text"],
  },
  {
    slug: "jake-sleeping",
    name: "Jake",
    phone: "+15555550202",
    base: "okay",
    is_sleeping: true,
    supported: false,
    support_count: 0,
    dimensions: { sleep: "yellow", stress: "green", meds: "green" },
    dimension_details: {
      sleep:    { score: 65, label: "5.5h",       sublabel: "catching up",    history: [70, 58, 62, 55, 60, 63, 65] },
      stress:   { score: 80, label: "HRV 55ms",   sublabel: "recovering",     history: [74, 76, 78, 80, 77, 79, 80] },
      activity: { score: 68, label: "4,800 steps", sublabel: "moderate",       history: [72, 65, 70, 68, 60, 66, 68] },
      meds:     { score: 100, label: "Taken",      sublabel: "on schedule",    history: [] },
    },
    vitals: { steps: 4800, resting_hr: 60, hrv: 55 },
    recommended_actions: ["text", "coffee"],
  },
];

// Demo seeded state — Sarah, fried (2h sleep, high stress, no meds)
export const MOCK_TAMAGO_STATE: EggState = {
  base: "fried",
  is_sleeping: false,
  supported: true,
  support_count: 2,
  dimensions: { sleep: "red", stress: "red", meds: "red" },
  dimension_details: {
    sleep:  { score: 20, label: "2.0h",      sublabel: "severe deficit",  history: [65, 55, 45, 38, 30, 24, 20] },
    stress: { score: 35, label: "HRV 22ms",  sublabel: "high stress",     history: [60, 52, 48, 42, 38, 35, 35] },
    meds:   { score: 0,  label: "0/5 taken",  sublabel: "none taken",      history: [] },
  },
  vitals: { steps: 340, resting_hr: 88, hrv: 22 },
  recommended_actions: ["call", "food", "text"],
};

export const MOCK_SUPPORT_ACTIONS: SupportActionOut[] = [
  {
    id: "1",
    user_id: "u1",
    supporter_phone: "+15551111111",
    action_type: "food",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "u1",
    supporter_phone: "+15552222222",
    action_type: "text",
    created_at: new Date().toISOString(),
  },
];
