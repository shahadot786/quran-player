// The top of a chart's axis: the smallest "round" value that fits the biggest bar, then whole fallback steps beyond the scale.
export function axisTop(max: number, steps: readonly number[], fallbackStep: number) {
  return steps.find((step) => step >= max) ?? Math.ceil(max / fallbackStep) * fallbackStep;
}
