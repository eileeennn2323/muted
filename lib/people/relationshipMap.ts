import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import dagre from "@dagrejs/dagre";

export type MapNode = {
  id: string;
  nodeKind: "me" | "person";
  personId: string | null;
  name: string;
  role: string | null;
  positionX: number;
  positionY: number;
};

export type MapEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  content: string | null;
  edgeKind: "reports_to" | "influences" | "works_closely_with" | "custom";
  sourceRelationshipInsightId: string | null;
  createdBy: "muted" | "user";
};

export type MapNoteItem = {
  id: string;
  content: string;
  positionX: number;
  positionY: number;
};

export type RelationshipMapData = {
  mapId: string;
  nodes: MapNode[];
  edges: MapEdge[];
  notes: MapNoteItem[];
};

const EDGE_KIND_LABELS: Record<string, string> = {
  reports_to: "Reports to",
  influences: "Influences",
  works_closely_with: "Works closely with",
};

const NODE_WIDTH = 170;
const NODE_HEIGHT = 60;

function truncateLabel(text: string, max = 40): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

type SeedNodeRow = {
  id: string;
  node_kind: "me" | "person";
  person_id: string | null;
  name: string;
  role: string | null;
};

type SeedEdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  label: string;
  content: string;
  edge_kind: MapEdge["edgeKind"];
  source_relationship_insight_id: string;
  created_by: "muted";
};

/** Runs once, only for the request that wins the relationship_maps insert
 * race (see getOrCreateRelationshipMap) — auto-drafts nodes/edges from
 * existing relationship_insights and lays them out with Dagre. Never called
 * again after this: subsequent loads just read the persisted rows, so the
 * user's own rearranging is never fought by a re-layout. */
async function seedMap(
  supabase: SupabaseClient,
  workspaceId: string,
  mapId: string,
  focusPersonId: string
): Promise<{ nodes: MapNode[]; edges: MapEdge[] }> {
  const { data: focusPerson, error: focusError } = await supabase
    .from("people")
    .select("id,name,roles")
    .eq("id", focusPersonId)
    .maybeSingle();
  if (focusError) throw focusError;
  if (!focusPerson) return { nodes: [], edges: [] };

  const { data: relRows, error: relError } = await supabase
    .from("relationship_insights")
    .select("id,person_a_id,person_b_id,content,relationship_type")
    .eq("workspace_id", workspaceId)
    .or(`person_a_id.eq.${focusPersonId},person_b_id.eq.${focusPersonId}`);
  if (relError) throw relError;

  const otherIds = Array.from(
    new Set(
      (relRows ?? [])
        .flatMap((r) => [r.person_a_id as string, r.person_b_id as string])
        .filter((id) => id !== focusPersonId)
    )
  );

  const otherPeopleById = new Map<string, { id: string; name: string; roles: string[] }>();
  if (otherIds.length > 0) {
    const { data: otherPeople, error: otherError } = await supabase
      .from("people")
      .select("id,name,roles")
      .in("id", otherIds);
    if (otherError) throw otherError;
    for (const p of otherPeople ?? []) otherPeopleById.set(p.id, p);
  }

  const nodeRows: SeedNodeRow[] = [{ id: crypto.randomUUID(), node_kind: "me", person_id: null, name: "Me", role: null }];

  const personNodeIds = new Map<string, string>();
  const focusNodeId = crypto.randomUUID();
  personNodeIds.set(focusPersonId, focusNodeId);
  nodeRows.push({
    id: focusNodeId,
    node_kind: "person",
    person_id: focusPersonId,
    name: focusPerson.name,
    role: focusPerson.roles?.[0] ?? null,
  });

  for (const id of otherIds) {
    const person = otherPeopleById.get(id);
    if (!person) continue;
    const nodeId = crypto.randomUUID();
    personNodeIds.set(id, nodeId);
    nodeRows.push({ id: nodeId, node_kind: "person", person_id: id, name: person.name, role: person.roles?.[0] ?? null });
  }

  const edgeRows: SeedEdgeRow[] = [];
  for (const r of relRows ?? []) {
    const sourceNodeId = personNodeIds.get(r.person_a_id as string);
    const targetNodeId = personNodeIds.get(r.person_b_id as string);
    if (!sourceNodeId || !targetNodeId) continue;
    const edgeKind = (r.relationship_type as MapEdge["edgeKind"] | null) ?? "custom";
    const label = r.relationship_type ? EDGE_KIND_LABELS[r.relationship_type] : truncateLabel(r.content as string);
    edgeRows.push({
      id: crypto.randomUUID(),
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      label,
      content: r.content as string,
      edge_kind: edgeKind,
      source_relationship_insight_id: r.id as string,
      created_by: "muted",
    });
  }

  // Dagre: reports_to edges get a higher weight so they dominate the
  // vertical ranking (a loose hierarchy); other kinds still feed into the
  // same graph so they settle near what they're connected to. One pass,
  // not a hybrid two-algorithm layout — the first draft doesn't need to be
  // perfect, the user rearranges from here.
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodeRows) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edgeRows) {
    g.setEdge(e.source_node_id, e.target_node_id, { weight: e.edge_kind === "reports_to" ? 3 : 1 });
  }
  dagre.layout(g);

  const positioned = nodeRows.map((n) => {
    const pos = g.node(n.id) as { x: number; y: number } | undefined;
    // Dagre returns each node's center — convert to top-left for React Flow.
    return {
      ...n,
      position_x: (pos?.x ?? 0) - NODE_WIDTH / 2,
      position_y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
    };
  });

  const { error: nodesInsertError } = await supabase.from("map_nodes").insert(
    positioned.map((n) => ({
      id: n.id,
      workspace_id: workspaceId,
      map_id: mapId,
      node_kind: n.node_kind,
      person_id: n.person_id,
      position_x: n.position_x,
      position_y: n.position_y,
    }))
  );
  if (nodesInsertError) throw nodesInsertError;

  if (edgeRows.length > 0) {
    const { error: edgesInsertError } = await supabase.from("map_edges").insert(
      edgeRows.map((e) => ({
        id: e.id,
        workspace_id: workspaceId,
        map_id: mapId,
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        label: e.label,
        edge_kind: e.edge_kind,
        source_relationship_insight_id: e.source_relationship_insight_id,
        created_by: e.created_by,
      }))
    );
    if (edgesInsertError) throw edgesInsertError;
  }

  return {
    nodes: positioned.map((n) => ({
      id: n.id,
      nodeKind: n.node_kind,
      personId: n.person_id,
      name: n.name,
      role: n.role,
      positionX: n.position_x,
      positionY: n.position_y,
    })),
    edges: edgeRows.map((e) => ({
      id: e.id,
      sourceNodeId: e.source_node_id,
      targetNodeId: e.target_node_id,
      label: e.label,
      content: e.content,
      edgeKind: e.edge_kind,
      sourceRelationshipInsightId: e.source_relationship_insight_id,
      createdBy: e.created_by,
    })),
  };
}

async function loadExistingMap(
  supabase: SupabaseClient,
  workspaceId: string,
  mapId: string
): Promise<{ nodes: MapNode[]; edges: MapEdge[]; notes: MapNoteItem[] }> {
  const { data: nodeRows, error: nodesError } = await supabase
    .from("map_nodes")
    .select("id,node_kind,person_id,position_x,position_y")
    .eq("workspace_id", workspaceId)
    .eq("map_id", mapId);
  if (nodesError) throw nodesError;

  const personIds = (nodeRows ?? []).map((n) => n.person_id).filter((id): id is string => Boolean(id));
  const peopleById = new Map<string, { name: string; roles: string[] }>();
  if (personIds.length > 0) {
    const { data: people, error: peopleError } = await supabase.from("people").select("id,name,roles").in("id", personIds);
    if (peopleError) throw peopleError;
    for (const p of people ?? []) peopleById.set(p.id, p);
  }

  const { data: edgeRows, error: edgesError } = await supabase
    .from("map_edges")
    .select("id,source_node_id,target_node_id,label,edge_kind,source_relationship_insight_id,created_by")
    .eq("workspace_id", workspaceId)
    .eq("map_id", mapId);
  if (edgesError) throw edgesError;

  const insightIds = (edgeRows ?? [])
    .map((e) => e.source_relationship_insight_id)
    .filter((id): id is string => Boolean(id));
  const contentByInsightId = new Map<string, string>();
  if (insightIds.length > 0) {
    const { data: insightRows, error: insightsError } = await supabase
      .from("relationship_insights")
      .select("id,content")
      .in("id", insightIds);
    if (insightsError) throw insightsError;
    for (const row of insightRows ?? []) contentByInsightId.set(row.id, row.content as string);
  }

  const { data: noteRows, error: notesError } = await supabase
    .from("map_notes")
    .select("id,content,position_x,position_y")
    .eq("workspace_id", workspaceId)
    .eq("map_id", mapId);
  if (notesError) throw notesError;

  return {
    nodes: (nodeRows ?? []).map((n) => ({
      id: n.id,
      nodeKind: n.node_kind,
      personId: n.person_id,
      name: n.node_kind === "me" ? "Me" : (peopleById.get(n.person_id as string)?.name ?? "Unknown"),
      role: n.node_kind === "me" ? null : (peopleById.get(n.person_id as string)?.roles[0] ?? null),
      positionX: n.position_x,
      positionY: n.position_y,
    })),
    edges: (edgeRows ?? []).map((e) => ({
      id: e.id,
      sourceNodeId: e.source_node_id,
      targetNodeId: e.target_node_id,
      label: e.label,
      content: e.source_relationship_insight_id ? (contentByInsightId.get(e.source_relationship_insight_id) ?? null) : null,
      edgeKind: e.edge_kind,
      sourceRelationshipInsightId: e.source_relationship_insight_id,
      createdBy: e.created_by,
    })),
    notes: (noteRows ?? []).map((n) => ({
      id: n.id,
      content: n.content,
      positionX: n.position_x,
      positionY: n.position_y,
    })),
  };
}

/**
 * Fetches this person's relationship map, auto-seeding it from existing
 * relationship_insights on first call. After that, this never re-seeds or
 * re-runs layout — the map becomes a fully user-owned, persisted canvas.
 */
export async function getOrCreateRelationshipMap(
  supabase: SupabaseClient,
  workspaceId: string,
  focusPersonId: string
): Promise<RelationshipMapData> {
  const { data: existingMap, error: selectError } = await supabase
    .from("relationship_maps")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("focus_person_id", focusPersonId)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existingMap) {
    const { nodes, edges, notes } = await loadExistingMap(supabase, workspaceId, existingMap.id);
    return { mapId: existingMap.id, nodes, edges, notes };
  }

  const newMapId = crypto.randomUUID();
  const { error: insertError } = await supabase
    .from("relationship_maps")
    .insert({ id: newMapId, workspace_id: workspaceId, focus_person_id: focusPersonId });

  if (insertError) {
    // 23505 = unique_violation: another concurrent request already created
    // this map. Re-select its row and read what IT seeded — only the
    // insert-winner seeds, so we never double-seed nodes/edges.
    if (insertError.code === "23505") {
      const { data: winnerMap, error: reselectError } = await supabase
        .from("relationship_maps")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("focus_person_id", focusPersonId)
        .maybeSingle();
      if (reselectError) throw reselectError;
      if (!winnerMap) throw insertError;
      const { nodes, edges, notes } = await loadExistingMap(supabase, workspaceId, winnerMap.id);
      return { mapId: winnerMap.id, nodes, edges, notes };
    }
    throw insertError;
  }

  const { nodes, edges } = await seedMap(supabase, workspaceId, newMapId, focusPersonId);
  return { mapId: newMapId, nodes, edges, notes: [] };
}
