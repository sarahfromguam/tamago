import type { EggState, FeedItem, SupportActionOut } from "../types";

export const MOCK_FEED: FeedItem[] = [
  {
    slug: "sarahs-egg",
    name: "Sarah",
    phone: "+15551234567",
    base: "struggling",
    is_sleeping: false,
    supported: true,
    support_count: 3,
    dimensions: { sleep: "red", stress: "yellow", meds: "green" },
    dimension_details: {
      sleep:  { score: 48, label: "4.2h",   sublabel: "deep deficit" },
      stress: { score: 63, label: "HRV 31", sublabel: "elevated stress" },
      meds:   { score: 100, label: "Taken", sublabel: "on schedule" },
    },
    recommended_actions: ["food", "text", "call"],
  },
  {
    slug: "emmas-egg",
    name: "Emma",
    phone: "+15559876543",
    base: "thriving",
    is_sleeping: false,
    supported: false,
    support_count: 0,
    dimensions: { sleep: "green", stress: "green", meds: "green" },
    dimension_details: {
      sleep:  { score: 91, label: "8.1h",   sublabel: "well rested" },
      stress: { score: 88, label: "HRV 58", sublabel: "good recovery" },
      meds:   { score: 100, label: "Taken", sublabel: "on schedule" },
    },
    recommended_actions: ["text", "coffee"],
  },
  {
    slug: "mias-egg",
    name: "Mia",
    phone: "+15555555555",
    base: "okay",
    is_sleeping: true,
    supported: true,
    support_count: 1,
    dimensions: { sleep: "yellow", stress: "green", meds: "grey" },
    dimension_details: {
      sleep:  { score: 72, label: "6.5h",  sublabel: "slightly short" },
      stress: { score: 80, label: "HRV 47", sublabel: "recovering" },
      meds:   { score: 0,  label: "—",     sublabel: "not tracked" },
    },
    recommended_actions: ["text", "coffee", "food"],
  },
];

// Real Oura data — Sarah, April 18 2026
export const MOCK_TAMAGO_STATE: EggState = {
  base: "okay",
  is_sleeping: false,
  supported: true,
  support_count: 2,
  dimensions: { sleep: "yellow", stress: "yellow", meds: "grey" },
  dimension_details: {
    sleep:  { score: 79, label: "6.3h",   sublabel: "slightly short" },
    stress: { score: 74, label: "HRV 43", sublabel: "moderate recovery" },
    meds:   { score: 0,  label: "—",      sublabel: "not tracked" },
  },
  recommended_actions: ["coffee", "food", "text"],
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
