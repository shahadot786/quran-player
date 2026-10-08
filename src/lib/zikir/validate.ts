import type { GroupStep } from "./types";

export const MAX_COUNT = 100_000;

export type ItemForm = {
  name: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  limited: boolean;
  target: number;
  hasGoal: boolean;
  dailyGoal: number;
};
export type GroupForm = { name: string; steps: GroupStep[]; hasGoal: boolean; dailyGoal: number };

export type ItemErrors = { name?: "required"; target?: "invalid"; dailyGoal?: "invalid" };
export type GroupErrors = { name?: "required"; steps?: "empty" | "invalid"; dailyGoal?: "invalid" };

const isValidCount = (value: number) => Number.isInteger(value) && value >= 1 && value <= MAX_COUNT;

export function validateItem(form: ItemForm): ItemErrors {
  const errors: ItemErrors = {};
  if (!form.name.trim()) errors.name = "required";
  if (form.limited && !isValidCount(form.target)) errors.target = "invalid";
  if (form.hasGoal && !isValidCount(form.dailyGoal)) errors.dailyGoal = "invalid";
  return errors;
}

export function validateGroup(form: GroupForm): GroupErrors {
  const errors: GroupErrors = {};
  if (!form.name.trim()) errors.name = "required";
  if (form.steps.length === 0) errors.steps = "empty";
  else if (!form.steps.every((step) => isValidCount(step.target))) errors.steps = "invalid";
  if (form.hasGoal && !isValidCount(form.dailyGoal)) errors.dailyGoal = "invalid";
  return errors;
}
