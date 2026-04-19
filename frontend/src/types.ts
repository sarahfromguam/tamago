export type DimensionState = "green" | "yellow" | "red" | "grey";

export interface Dimensions {
  sleep: DimensionState;
  stress: DimensionState;
  meds: DimensionState;
}

/** Numeric detail for one dimension, sourced from Oura */
export interface DimensionDetail {
  score: number;        // 0–100 Oura score
  label: string;        // e.g. "5.8h", "HRV 42ms", "Taken"
  sublabel?: string;    // e.g. "below target", "good recovery"
  history?: number[];   // 7-day scores oldest→newest, for sparkline
}

export interface DimensionDetails {
  sleep?: DimensionDetail;
  stress?: DimensionDetail;
  meds?: DimensionDetail;
  activity?: DimensionDetail;
}

export interface Vitals {
  steps?: number;
  resting_hr?: number;
  hrv?: number;
}

export interface OmiLogEntry {
  medication: string;
  logged_at: string;
  source: string;
}

export type EggBase = "thriving" | "okay" | "struggling" | "fried";

export interface EggState {
  base: EggBase;
  is_sleeping: boolean;
  supported: boolean;
  support_count: number;
  dimensions: Dimensions;
  dimension_details?: DimensionDetails;
  vitals?: Vitals;
  recommended_actions: string[];
}

export interface FeedItem extends EggState {
  slug: string;
  name: string;
  phone: string;
}

export interface UserOut {
  id: string;
  phone: string;
  name: string;
  slug: string;
  oura_connected: boolean;
  omi_enabled: boolean;
  created_at: string;
}

export type ActionType = "text" | "call" | "facetime" | "coffee" | "food" | "gift";

export interface SupportActionOut {
  id: string;
  user_id: string;
  supporter_phone: string;
  action_type: ActionType;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  uid: string;
  date: string;
  medication_name: string;
  dose: string | null;
  unit: string | null;
  taken_at: string | null;
  source: "webhook" | "manual" | "realtime";
  confidence_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface ScheduledMedication {
  id: string;
  uid: string;
  medication_name: string;
  dose: string;
  unit: string | null;
  frequency: string;
  scheduled_times: string[];
  reminders_enabled: boolean;
}

export interface DimensionVisibility {
  sleep: boolean;
  stress: boolean;
  meds: boolean;
  activity: boolean;
}

export interface CircleMember {
  name: string;
  phone: string;
  relationship: string;
  tier: number;
  role?: "caregiver" | "friend";
}

export interface InviteOut {
  id: string;
  user_id: string;
  invitee_phone: string;
  invite_code: string;
  status: "pending" | "accepted";
  created_at: string;
}

export type OmiPipelinePath = "taken" | "distress" | "llm" | "none";

export interface OmiConversation {
  id: string;
  started_at: string | null;
  finished_at: string | null;
  transcript: string;
  path: OmiPipelinePath;
  match: { medication: string; quote: string } | null;
}

export interface OmiPipelineStep {
  step: string;
  label: string;
  detail: string;
  result?: "match" | "skip" | "success" | "pending";
}

export interface OmiRunResult {
  path: OmiPipelinePath;
  steps: OmiPipelineStep[];
}
