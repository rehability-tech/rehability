export type NotificationChannel =
  | "IN_APP"
  | "PUSH"
  | "EMAIL"
  | "ACTIVITY"
  | "SYSTEM_UPDATE";

export type TargetAudience = "USER" | "ADMIN" | "GLOBAL";

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "BOOKING"
  | "PAYMENT"
  | "HEALTH"
  | "SPA"
  | "SYSTEM"
  | "CAMP"
  | "VOD";

export type SystemUpdateType = "VOD" | "CAMP" | "BLOG" | "SYSTEM";

export interface DispatchPayload {
  target: TargetAudience;
  userIds?: string[];
  title: string;
  message: string;
  link?: string;
  channels: NotificationChannel[];

  // Akceptuje zarówno NotificationType (dla IN_APP / ACTIVITY) jak i SystemUpdateType
  // (dla SYSTEM_UPDATE) — bo trafia do różnych tabel z różnymi enumami.
  type?: NotificationType | SystemUpdateType;
  tripId?: string;
  kind?: string;
  who?: string;
}

export type CampEventKind =
  | "DEPOSIT_PAID"
  | "FULLY_PAID"
  | "HEALTH_FILLED"
  | "HEALTH_UPDATED"
  | "SERVICE_BOUGHT"
  | "SIGNUP"
  | "CHECK_IN";

export interface LogCampEventInput {
  kind: CampEventKind;
  tripId: string;
  tripTitle?: string | null;
  userName: string;
  amount?: string | null;
  detail?: string | null;
}

export interface CreateSystemUpdateInput {
  type: SystemUpdateType;
  title: string;
  description: string;
  link?: string;
  push?: boolean;
}
