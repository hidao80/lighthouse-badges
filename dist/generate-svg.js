function getSvgColor(score) {
    if (score >= 90)
        return '#0cce6b';
    if (score >= 50)
        return '#ffa400';
    return '#ff4e42';
}
function createDonut(score, color, x) {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    return `
    <g transform="translate(${x}, 0)">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="${color}">
        ${score}
      </text>
    </g>
  `;
}
export function generateSvg(scores) {
    return `
<svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">
  ${createDonut(scores.accessibility, getSvgColor(scores.accessibility), 0)}
  ${createDonut(scores.bestPractices, getSvgColor(scores.bestPractices), 120)}
  ${createDonut(scores.performance, getSvgColor(scores.performance), 240)}
  ${createDonut(scores.seo, getSvgColor(scores.seo), 360)}
</svg>
  `.trim();
}
//# sourceMappingURL=generate-svg.js.map