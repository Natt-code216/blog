/** Decorative markup shared by React routes and independent tool documents. */
export const ambientOrbitMarkup = `
  <div class="ambient-orbit-mist"></div>
  <svg class="ambient-orbit-ring ambient-orbit-primary" viewBox="0 0 600 600" fill="none" aria-hidden="true" focusable="false">
    <circle cx="300" cy="300" r="270" />
    <ellipse cx="300" cy="300" rx="278" ry="150" transform="rotate(-32 300 300)" />
    <ellipse cx="300" cy="300" rx="190" ry="264" transform="rotate(23 300 300)" />
    <circle class="ambient-orbit-satellite" cx="300" cy="30" r="4" />
    <circle class="ambient-orbit-satellite" cx="76" cy="450" r="2.5" />
  </svg>
  <svg class="ambient-orbit-ring ambient-orbit-secondary" viewBox="0 0 600 600" fill="none" aria-hidden="true" focusable="false">
    <circle cx="300" cy="300" r="268" stroke-dasharray="1 17" />
    <ellipse cx="300" cy="300" rx="270" ry="178" transform="rotate(28 300 300)" />
    <circle class="ambient-orbit-satellite" cx="568" cy="300" r="3" />
  </svg>
  <div class="ambient-orbit-stars"></div>
`;
