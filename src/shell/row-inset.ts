// One inset for every clickable list row in a card: its hover and open background, and the lines between rows, sit
// exactly in the card's content box (never past it), and everything inside the row starts 8 px (`px-2`) in.

/** A link or button row: rounded, inset by `px-2`, lit on hover, with the focus ring. Add the row's own layout. */
export const ROW_SURFACE_CLASS =
  "rounded-md px-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/**
 * On the `li` around a theme `FoldRow`: its summary (the bar with the chevron) and its opened content take the same
 * `px-2`, so the details line up with the chevron. The package pads the two differently (`px-1` and `p-3`).
 */
export const FOLD_ROW_INSET_CLASS = "[&_[data-slot=fold-row-summary]]:px-2 [&_[data-slot=fold-row-content]]:px-2 [&_[data-slot=fold-row-content]]:py-3";
