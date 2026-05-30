import { z } from "zod";

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm");
const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "yyyy-mm-dd");

const FrequencySchema = z.object({
  times: z.number().int().positive(),
  per: z.enum(["day", "week", "month"]),
});

export const ActivitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["fitness", "food", "medication", "therapy", "consultation"]),
  name: z.string().min(1),
  priority: z.number().int().min(1),
  frequency: FrequencySchema,
  durationMinutes: z.number().int().positive(),
  details: z.string(),
  facilitatorId: z.string().nullable(),
  equipmentId: z.string().nullable(),
  location: z.enum(["home", "gym", "clinic", "remote"]),
  remoteEligible: z.boolean(),
  prepNotes: z.string(),
  backupActivityIds: z.array(z.string()),
  adjustmentIfSkipped: z.string(),
  metrics: z.array(z.string()),
  preferredTimeOfDay: z.enum(["morning", "afternoon", "evening"]).optional(),
});

export const ActionPlanSchema = z.object({
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  activities: z.array(ActivitySchema).min(1),
});

const WindowSchema = z.object({ date: ISODate, start: HHMM, end: HHMM });

export const ResourceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["trainer", "specialist", "allied-health", "equipment"]),
  name: z.string().min(1),
  windows: z.array(WindowSchema),
});

export const TravelSchema = z.object({
  start: ISODate,
  end: ISODate,
  location: z.string(),
  remoteOk: z.boolean(),
});

export const AvailabilitySchema = z.object({
  resources: z.array(ResourceSchema),
  travel: z.array(TravelSchema),
});
