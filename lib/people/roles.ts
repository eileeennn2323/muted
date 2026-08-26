export const RELATIONSHIP_ROLES = [
  "Peer",
  "Direct boss",
  "Upper management",
  "Stakeholder",
  "Subordinate",
  "Vendor",
  "Other",
] as const;

export type RelationshipRole = (typeof RELATIONSHIP_ROLES)[number];
