export type DimensionState = "green" | "yellow" | "red" | "grey";

export interface Dimensions {
  sleep: DimensionState;
  stress: DimensionState;
  meds: DimensionState;
}

/** Numeric detail for one dimension, sourced from Oura */
export interface DimensionDetail {
  score: number;       // 0–100 Oura score
  label: string;       // e.g. "5.8h", "HRV 42ms", "Taken"
  sublabel?: string;   // e.g. "below target", "good recovery"
}

export interface DimensionDetails {
  sleep?: DimensionDetail;
  stress?: DimensionDetail;
  meds?: DimensionDetail;
}

export type EggBase = "thriving" | "okay" | "struggling" | "fried";

export interface EggState {
  base: EggBase;
  is_sleeping: boolean;
  supported: boolean;
  support_count: number;
  dimensions: Dimensions;
  dimension_details?: DimensionDetails;
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

export type ActionType = "text" | "call" | "facetime" | "coffee" | "food";

export interface SupportActionOut {
  id: string;
  user_id: string;
  supporter_phone: string;
  action_type: ActionType;
  created_at: string;
}

export interface InviteOut {
  id: string;
  user_id: string;
  invitee_phone: string;
  invite_code: string;
  status: "pending" | "accepted";
  created_at: string;
}
