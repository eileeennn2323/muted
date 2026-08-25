export const RELATIONSHIP_ROLES = [
  "Manager",
  "Peer",
  "Direct report",
  "Stakeholder",
  "Upper management",
  "Other",
] as const;

export type RelationshipRole = (typeof RELATIONSHIP_ROLES)[number];
