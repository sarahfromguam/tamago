import type {
  ActionType,
  CircleMember,
  DimensionVisibility,
  EggState,
  FeedItem,
  InviteOut,
  MedicationLog,
  OmiConversation,
  OmiRunResult,
  ScheduledMedication,
  SupportActionOut,
  UserOut,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  createUser(phone: string, name: string) {
    return request<UserOut>("/api/users", {
      method: "POST",
      body: JSON.stringify({ phone, name }),
    });
  },

  getTamagoState(slug: string) {
    return request<EggState & { name?: string; phone?: string }>(`/api/demo/patient/${slug}`);
  },

  updateUser(slug: string, body: Partial<{ name: string; oura_token: string; omi_enabled: boolean }>) {
    return request<UserOut>(`/api/users/${slug}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  getOuraConnectUrl(slug: string) {
    return request<{ url: string }>(`/api/users/${slug}/connect-oura`);
  },

  refreshHealth(slug: string) {
    return request<EggState>(`/api/users/${slug}/refresh`, { method: "POST" });
  },

  sendInvite(slug: string, invitee_phone: string) {
    return request<InviteOut>(`/api/users/${slug}/invite`, {
      method: "POST",
      body: JSON.stringify({ invitee_phone }),
    });
  },

  acceptInvite(code: string, phone: string) {
    return request<void>(`/api/invite/${code}/accept`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  logSupport(slug: string, supporter_phone: string, action_type: ActionType) {
    return request<SupportActionOut>(`/api/users/${slug}/support`, {
      method: "POST",
      body: JSON.stringify({ supporter_phone, action_type }),
    });
  },

  getTodaySupport(slug: string) {
    return request<SupportActionOut[]>(`/api/users/${slug}/support`);
  },

  getFeed(_phone: string) {
    return request<FeedItem[]>("/api/demo/feed");
  },

  getSchedule(uid: string) {
    return request<ScheduledMedication[]>(`/api/schedule?uid=${uid}`);
  },

  getLogs(uid: string, date?: string) {
    const q = date ? `&date=${date}` : "";
    return request<MedicationLog[]>(`/api/logs?uid=${uid}${q}`);
  },

  getVisibility(slug: string) {
    return request<DimensionVisibility>(`/api/demo/visibility/${slug}`);
  },

  setVisibility(slug: string, config: DimensionVisibility) {
    return request<DimensionVisibility>(`/api/demo/visibility/${slug}`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  },

  getCircle(slug: string) {
    return request<CircleMember[]>(`/api/demo/circle/${slug}`);
  },

  direAlert(slug: string) {
    return request<{ sent: boolean; message: string; recipients: string[]; phones: string[]; sent_at: string }>(
      `/api/demo/dire-alert/${slug}`,
      { method: "POST" },
    );
  },

  babyBreak(message?: string) {
    return request<{ sent: boolean; message: string; recipients: string[]; sent_at: string }>(
      "/api/demo/baby-break",
      { method: "POST", body: JSON.stringify({ message }) },
    );
  },

  logOmi(medication: string) {
    return request<{ logged: boolean; medication: string; logged_at: string; source: string }>(
      "/api/demo/omi-log",
      { method: "POST", body: JSON.stringify({ medication }) },
    );
  },

  getOmiLog() {
    return request<{ medication: string; logged_at: string; source: string }[]>("/api/demo/omi-log");
  },

  getSupport(uid: string) {
    return request<{ status: string; friend?: string; caregiver?: string }>(
      `/api/get-support?uid=${uid}`,
      { method: "POST" }
    );
  },

  getSupportFriend(uid: string) {
    return request<{ status: string; friend?: string }>(
      `/api/get-support?uid=${uid}&target=friend`,
      { method: "POST" }
    );
  },

  getSupportCaregiver(uid: string) {
    return request<{ status: string; caregiver?: string }>(
      `/api/get-support?uid=${uid}&target=caregiver`,
      { method: "POST" }
    );
  },

  getOmiConversations(limit = 10) {
    return request<OmiConversation[]>(`/api/demo/omi-conversations?limit=${limit}`);
  },

  getWebhookLog() {
    return request<OmiConversation[]>("/api/demo/webhook-log");
  },

  runOmiPipeline(transcript: string, conversation_id: string) {
    return request<OmiRunResult>("/api/demo/omi-run", {
      method: "POST",
      body: JSON.stringify({ transcript, conversation_id }),
    });
  },

  takeMeds() {
    return request<{ status: string; new_base: string }>("/api/demo/take-meds", { method: "POST" });
  },

  resetSarah() {
    return request<{ status: string; new_base: string }>("/api/demo/reset-sarah", { method: "POST" });
  },

  simulateOmiWebhook(transcript: string, uid = "user_mia") {
    const id = `sim-${Date.now()}`;
    const now = new Date().toISOString();
    const url = `https://backed-research-material.ngrok-free.dev/webhook/omi?uid=${uid}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        created_at: now,
        started_at: now,
        finished_at: now,
        source: "demo_console",
        transcript_segments: [{ text: transcript, speaker: "SPEAKER_00", is_user: true, start: 0, end: 1 }],
        discarded: false,
      }),
    }).then(res => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });
  },
};
