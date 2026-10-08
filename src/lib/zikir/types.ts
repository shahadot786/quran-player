export type ZikirItem = {
  id: string;
  name: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  /** How many counts finish a round; null counts without limit. */
  target: number | null;
  /** Counts per day to aim for; null means no goal. */
  dailyGoal: number | null;
  createdAt: number;
  updatedAt: number;
  /** Deleted items stay as markers so a later sync can't bring them back. */
  deletedAt: number | null;
};

export type GroupStep = { itemId: string; target: number };

export type ZikirGroup = {
  id: string;
  name: string;
  steps: GroupStep[];
  /** Finished rounds per day to aim for; null means no goal. */
  dailyGoal: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type RunKind = "item" | "group";
export type RunRef = { kind: RunKind; id: string };

/** A round in progress: which step it is on and how many counts that step has. */
export type Run = RunRef & { step: number; count: number; startedAt: number; updatedAt: number };

export type HistoryEntry = {
  id: string;
  kind: RunKind;
  refId: string;
  /** Null for built-in items and groups, whose names come from the translations. */
  name: string | null;
  count: number;
  finishedAt: number;
  /** False when the round was ended by hand before reaching its target. */
  completed: boolean;
};

/** Each device writes only its own cell, so merging two devices can simply keep the newer cell. */
export type DeviceCell = { n: number; at: number };
export type Counts = Record<string, Record<string, Record<string, DeviceCell>>>;

export type ZikirView = "beads" | "dial" | "simple";
export type ZikirSettings = { view: ZikirView; sound: boolean; haptics: boolean; keepAwake: boolean };

/** A counting step as the counter sees it, whether it comes from one item or a group. */
export type Step = { itemId: string; target: number | null };
