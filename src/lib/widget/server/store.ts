export const WIDGET_EVENTS = ["view", "play", "click"] as const;
export type WidgetEvent = (typeof WIDGET_EVENTS)[number];

export type ReportRow = { day: string; host: string; event: WidgetEvent; hits: number; uniques: number };

export type WidgetStore = {
  /** Adds a hit to the day, host and event, and a unique when this visitor hash has not been seen for it today. */
  record: (day: string, host: string, event: WidgetEvent, visitor: string) => Promise<void>;
  /** Counts one more hit in the bucket's window and returns the total so far. */
  hit: (bucket: string, windowStart: Date) => Promise<number>;
  /** Every counted row from `sinceDay` (YYYY-MM-DD) on. */
  report: (sinceDay: string) => Promise<ReportRow[]>;
  /** Removes visitor hashes from days before `day` (YYYY-MM-DD) and returns how many went. */
  purgeVisitors: (day: string) => Promise<number>;
};
