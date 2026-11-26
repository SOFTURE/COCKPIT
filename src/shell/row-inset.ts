// One inset for every clickable list row in a card: its hover and open background, and the lines between rows, sit
// exactly in the card's content box (never past it), and everything inside the row starts 8 px (`px-2`) in. A theme
// `FoldRow` already insets its bar and its content by `px-2` itself (@softure-ai/theme-notion 0.32).

/** A link or button row: rounded, inset by `px-2`, lit on hover, with the focus ring. Add the row's own layout. */
export const ROW_SURFACE_CLASS =
  "rounded-md px-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
