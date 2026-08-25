export const RELATIONSHIP_ROLES = [
  "Peer",
  "Direct report",
  "Upper management",
  "Stakeholder",
  "Subordinate",
  "Other",
] as const;

export type RelationshipRole = (typeof RELATIONSHIP_ROLES)[number];
