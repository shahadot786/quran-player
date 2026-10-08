export type Spring = { value: number; velocity: number };

// A critically damped spring (the same idea as SmoothDamp in game engines): it eases toward a target without overshooting.
export function smoothDamp(spring: Spring, target: number, smoothTime: number, dt: number): Spring {
  if (dt <= 0) return spring;
  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = spring.value - target;
  const temp = (spring.velocity + omega * change) * dt;
  let velocity = (spring.velocity - omega * temp) * decay;
  let value = target + (change + temp) * decay;
  // Stop the spring from carrying past the target in a single large step.
  if (target - spring.value > 0 === value > target) {
    value = target;
    velocity = 0;
  }
  return { value, velocity };
}
