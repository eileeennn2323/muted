export type MapNodeData = {
  id: string;
  nodeKind: "me" | "person";
  personId: string | null;
  name: string;
  role: string | null;
  positionX: number;
  positionY: number;
};

export type MapEdgeData = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  content: string | null;
  edgeKind: "reports_to" | "influences" | "works_closely_with" | "custom";
  sourceRelationshipInsightId: string | null;
  createdBy: "muted" | "user";
};

export type MapNoteData = {
  id: string;
  content: string;
  positionX: number;
  positionY: number;
};

export type ExistingInsightSuggestion = {
  kind: "existing_insight";
  relationshipInsightId: string;
  otherPersonId: string;
  otherPersonName: string;
  content: string;
  evidenceCount: number;
};

export type CoOccurrenceSuggestion = {
  kind: "co_occurrence";
  otherPersonId: string;
  otherPersonName: string;
  noteCount: number;
};

export type MapSuggestion = ExistingInsightSuggestion | CoOccurrenceSuggestion;

export const EDGE_KIND_STYLES: Record<MapEdgeData["edgeKind"], { stroke: string; dash?: string }> = {
  reports_to: { stroke: "var(--color-cedar)" },
  influences: { stroke: "var(--color-brass)", dash: "6 4" },
  works_closely_with: { stroke: "var(--color-cedar-dark)", dash: "2 3" },
  custom: { stroke: "var(--color-cocoa-quiet)", dash: "4 3" },
};

export const EDGE_KIND_LEGEND: { kind: MapEdgeData["edgeKind"]; label: string }[] = [
  { kind: "reports_to", label: "Reports to" },
  { kind: "influences", label: "Influences" },
  { kind: "works_closely_with", label: "Works closely with" },
  { kind: "custom", label: "Your annotation" },
];
