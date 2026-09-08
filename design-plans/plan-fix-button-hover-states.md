# Fix button hover states to preserve semantic colors

Written against: c5bc4c8

## Evidence chain

- Surface: `index.html:87-91` - Button group with Start/Stop/Reset buttons
- Problem: All buttons use same hover effect (`background: var(--bg-secondary)`) which replaces semantic colors on colored buttons, breaking visual feedback
- Design evidence: `src/styles.css:167-170` - Generic hover rule applies to all buttons without differentiation
- Owner: `src/styles.css:155-188` - Button styling rules
- Scope and affected surfaces: `.button-group button#btn-start:hover`, `.button-group button#btn-stop:hover`, `.button-group button#btn-reset:hover`
- Uncertainty: None - color values are clearly defined in `:root` tokens

## Design decision

Colored semantic buttons (Start=green, Stop=red, Reset=orange) should maintain their semantic color through hover states using brightness adjustment instead of replacing with neutral gray. This preserves action meaning and provides better visual feedback.

## Reuse

- Existing tokens: `--accent-green`, `--accent-red`, `--accent-orange` from `:root`
- Exemplar: None in current codebase - this pattern needs to be established

No new primitives required - use CSS `filter: brightness()` for hover effect.

## Changes

1. `src/styles.css:167-170`
   - Change: Split hover rules into neutral buttons and colored buttons
   - Preserve: Generic hover for neutral buttons (lines 167-170)
   - Add: Specific hover states for colored buttons using `filter: brightness(1.1)`
   - Verify: Colored buttons maintain hue while providing visible hover feedback

Implementation:
```css
/* Neutral buttons hover */
.button-group button:hover:not(#btn-start):not(#btn-stop):not(#btn-reset) {
  background: var(--bg-secondary);
  border-color: var(--accent-blue);
}

/* Colored buttons hover - preserve semantic color */
.button-group button#btn-start:hover {
  filter: brightness(1.1);
}

.button-group button#btn-stop:hover {
  filter: brightness(1.1);
}

.button-group button#btn-reset:hover {
  filter: brightness(1.1);
}
```

## Scope

- Inherit: All three action buttons (Start, Stop, Reset)
- Verify: Button labels remain readable, hover effect is visible but subtle
- Exclude: Other button states (focus, active, disabled) - separate concern

## Validation

- Product: Hover over Start/Stop/Reset buttons - color should lighten slightly but remain green/red/orange
- Interface: All three buttons in Controls panel
- System: Confirm no other buttons use these IDs elsewhere
- Repository: `node tools/renderers.test.js` → all tests pass

## Stop conditions

- Stop if brightness filter causes accessibility issues (WCAG contrast)
- Stop if filter affects button text readability

## Design documentation

- After acceptance: Record decision to use `filter: brightness()` for semantic button hover states in `docs/overview.md` under "Visual conventions"
