export function starPoints(center: number, outer: number, inner: number, tips = 8) {
  return Array.from({ length: tips * 2 }, (_, i) => {
    const angle = (Math.PI / tips) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
  }).join(" ");
}
