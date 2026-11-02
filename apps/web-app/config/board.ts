export const BOARD_NAME = "Jarida";
export const BOARD_TAGLINE = "Scholarly research & clinical intelligence board for East Africa";
export const GATED_ACTIONS = ["comment", "contribute", "save", "follow", "fullpaper"] as const;
export const DEFAULT_TOPICS = [
  "East Africa",
  "Tanzania",
  "pharmacy practice",
  "laboratory diagnostics",
  "antimicrobial resistance",
  "malaria",
  "pharmacovigilance",
  "health informatics"
] as const;

export type GatedAction = typeof GATED_ACTIONS[number];
