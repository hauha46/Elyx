export type ActivityType = "fitness" | "food" | "medication" | "therapy" | "consultation";
export type Frequency = { times: number; per: "day" | "week" | "month" };
export type Location = "home" | "gym" | "clinic" | "remote";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export type Activity = {
  id: string;
  type: ActivityType;
  name: string;
  priority: number;
  frequency: Frequency;
  durationMinutes: number;
  details: string;
  facilitatorId: string | null;
  equipmentId: string | null;
  location: Location;
  remoteEligible: boolean;
  prepNotes: string;
  backupActivityIds: string[];
  adjustmentIfSkipped: string;
  metrics: string[];
  preferredTimeOfDay?: TimeOfDay;
};

export type ActionPlan = {
  memberId: string;
  memberName: string;
  activities: Activity[];
};

export type ResourceType = "trainer" | "specialist" | "allied-health" | "equipment";
export type AvailabilityWindow = { date: string; start: string; end: string };

export type Resource = {
  id: string;
  type: ResourceType;
  name: string;
  windows: AvailabilityWindow[];
};

export type Travel = { start: string; end: string; location: string; remoteOk: boolean };

export type Availability = { resources: Resource[]; travel: Travel[] };

export type EventStatus = "scheduled" | "backup-substitute" | "skipped";

export type ScheduledEvent = {
  activityId: string;
  date: string;
  start: string;
  end: string;
  facilitatorId: string | null;
  status: EventStatus;
  substituteForActivityId?: string;
  adjustmentApplied?: string;
  notes?: string;
};

export type Schedule = {
  dateRange: { start: string; end: string };
  events: ScheduledEvent[];
  summary: { scheduled: number; substituted: number; skipped: number };
};
