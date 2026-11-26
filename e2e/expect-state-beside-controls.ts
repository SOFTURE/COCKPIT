// COCKPIT's row standard (app/row-layout.css): a row's state and its controls share one line on the right, the state
// on the left of the controls, their middles level. Only when both do not fit in the row's width (a long badge on a
// phone) the controls wrap under the state. Every row layout check calls this with the boxes it measured.
import { expect } from "@softure-ai/testing/playwright";

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Half a pixel of rounding either way. */
const TOLERANCE = 1;
/** How far the middles of the state and the controls may sit apart. */
const MIDDLE_TOLERANCE = 2;
/** The gap between the state and the controls (`column-gap` in app/row-layout.css). */
const GAP = 8;
/** The row's side padding (`px-2`, both sides). */
const ROW_PADDING = 16;

/** `rowBox` is the whole row (`ListEntry` or `FoldRow`): the line may take its width less the padding. */
export function expectStateBesideControls(stateBox: Box, controlsBox: Box, rowBox: Box): void {
  const fits = stateBox.width + GAP + controlsBox.width <= rowBox.width - ROW_PADDING + TOLERANCE;
  if (!fits) {
    expect(controlsBox.y, "the controls wrap under a state too wide to share their line").toBeGreaterThanOrEqual(stateBox.y + stateBox.height - TOLERANCE);
    return;
  }
  expect(stateBox.x + stateBox.width, "the state ends before the controls start").toBeLessThanOrEqual(controlsBox.x + TOLERANCE);
  expect(
    Math.abs(stateBox.y + stateBox.height / 2 - (controlsBox.y + controlsBox.height / 2)),
    "the state and the controls sit on one line",
  ).toBeLessThanOrEqual(MIDDLE_TOLERANCE);
}
