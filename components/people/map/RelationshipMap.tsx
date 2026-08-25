"use client";

import { useCallback, useState } from "react";
import { useNodesState, useEdgesState, type Node, type Edge } from "@xyflow/react";
import Canvas, { type MapTool } from "./Canvas";
import Toolbar from "./Toolbar";
import Legend from "./Legend";
import SuggestionsPanel from "./SuggestionsPanel";
import AddPersonToMapDialog from "./AddPersonToMapDialog";
import EdgeDetailDialog from "./EdgeDetailDialog";
import { EDGE_KIND_STYLES } from "./types";
import type { MapNodeData, MapEdgeData, MapNoteData } from "./types";

function edgeStyle(kind: MapEdgeData["edgeKind"]) {
  const s = EDGE_KIND_STYLES[kind];
  return { stroke: s.stroke, strokeDasharray: s.dash, strokeWidth: 1.75 };
}

function toFlowNodes(mapNodes: MapNodeData[], mapNotes: MapNoteData[]): Node[] {
  return [
    ...mapNodes.map((n) => ({
      id: n.id,
      type: n.nodeKind,
      position: { x: n.positionX, y: n.positionY },
      data: n,
    })),
    ...mapNotes.map((note) => ({
      id: note.id,
      type: "note" as const,
      position: { x: note.positionX, y: note.positionY },
      data: note,
    })),
  ];
}

function toFlowEdges(mapEdges: MapEdgeData[]): Edge[] {
  return mapEdges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: "floating",
    label: e.label,
    style: edgeStyle(e.edgeKind),
    labelStyle: { fill: "var(--color-cocoa-soft)", fontSize: 11 },
    labelBgStyle: { fill: "var(--color-cream)" },
    data: {
      content: e.content,
      edgeKind: e.edgeKind,
      sourceRelationshipInsightId: e.sourceRelationshipInsightId,
      createdBy: e.createdBy,
    },
  }));
}

function edgeToMapEdgeData(edge: Edge): MapEdgeData {
  const data = (edge.data ?? {}) as Partial<MapEdgeData>;
  return {
    id: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    label: typeof edge.label === "string" ? edge.label : "",
    content: data.content ?? null,
    edgeKind: data.edgeKind ?? "custom",
    sourceRelationshipInsightId: data.sourceRelationshipInsightId ?? null,
    createdBy: data.createdBy ?? "user",
  };
}

export default function RelationshipMap({
  personId,
  initialNodes,
  initialEdges,
  initialNotes,
  workspacePeople,
}: {
  personId: string;
  initialNodes: MapNodeData[];
  initialEdges: MapEdgeData[];
  initialNotes: MapNoteData[];
  workspacePeople: { id: string; name: string; roles: string[] }[];
}) {
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<Node>(toFlowNodes(initialNodes, initialNotes));
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>(toFlowEdges(initialEdges));
  const [activeTool, setActiveTool] = useState<MapTool>("select");
  const [expanded, setExpanded] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [detailEdge, setDetailEdge] = useState<MapEdgeData | null>(null);

  const handleNoteContentChange = useCallback(
    (id: string, content: string) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, content } } : n)));
      fetch(`/api/people/${personId}/map/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).catch(() => {});
    },
    [personId, setNodes]
  );

  const handleNoteDelete = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      fetch(`/api/people/${personId}/map/notes/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [personId, setNodes]
  );

  const handlePersonDelete = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
      fetch(`/api/people/${personId}/map/nodes/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [personId, setNodes, setEdges]
  );

  const renderNodes = nodes.map((n) => {
    if (n.type === "note") {
      return { ...n, data: { ...n.data, onContentChange: handleNoteContentChange, onDelete: handleNoteDelete } };
    }
    if (n.type === "person") {
      return { ...n, data: { ...n.data, onDelete: handlePersonDelete } };
    }
    return n;
  });

  const handleNodeDragStop = useCallback(
    (nodeId: string, nodeType: string, x: number, y: number) => {
      const endpoint = nodeType === "note" ? "notes" : "nodes";
      fetch(`/api/people/${personId}/map/${endpoint}/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: x, positionY: y }),
      }).catch(() => {});
    },
    [personId]
  );

  const handleConnectPair = useCallback(
    async (sourceNodeId: string, targetNodeId: string) => {
      try {
        const res = await fetch(`/api/people/${personId}/map/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceNodeId, targetNodeId }),
        });
        const data = await res.json();
        if (!res.ok) return;
        setEdges((prev) => [...prev, ...toFlowEdges([data.edge])]);
      } catch {
        // Connection wasn't saved — the user can retry.
      }
    },
    [personId, setEdges]
  );

  const handleCanvasClick = useCallback(
    async (x: number, y: number) => {
      try {
        const res = await fetch(`/api/people/${personId}/map/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "New note", positionX: x, positionY: y }),
        });
        const data = await res.json();
        if (!res.ok) return;
        setNodes((prev) => [...prev, ...toFlowNodes([], [data.note])]);
        setActiveTool("select");
      } catch {
        // Note wasn't saved — the user can retry.
      }
    },
    [personId, setNodes]
  );

  const handleEdgeSelect = useCallback((edge: Edge) => {
    setDetailEdge(edgeToMapEdgeData(edge));
  }, []);

  const handleEdgeUpdated = useCallback(
    (patch: { id: string; label?: string; content?: string }) => {
      setEdges((prev) =>
        prev.map((e) => {
          if (e.id !== patch.id) return e;
          return {
            ...e,
            label: patch.label ?? e.label,
            data: patch.content !== undefined ? { ...e.data, content: patch.content } : e.data,
          };
        })
      );
    },
    [setEdges]
  );

  const handleEdgeDeleted = useCallback(
    (edgeId: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  const handlePersonAdded = useCallback(
    (node: MapNodeData) => {
      const index = nodes.length;
      const x = 80 + (index % 5) * 190;
      const y = 80 + Math.floor(index / 5) * 110;
      setNodes((prev) => [...prev, ...toFlowNodes([{ ...node, positionX: x, positionY: y }], [])]);
      fetch(`/api/people/${personId}/map/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: x, positionY: y }),
      }).catch(() => {});
    },
    [personId, nodes.length, setNodes]
  );

  const handleSuggestionAccepted = useCallback(async () => {
    try {
      const res = await fetch(`/api/people/${personId}/map`);
      if (!res.ok) return;
      const data = await res.json();
      setNodes(toFlowNodes(data.nodes, data.notes));
      setEdges(toFlowEdges(data.edges));
    } catch {
      // The accept already went through server-side; the canvas will catch up next load.
    }
  }, [personId, setNodes, setEdges]);

  const existingPersonIds = new Set(
    nodes.filter((n): n is Node & { data: MapNodeData } => n.type === "person").map((n) => n.data.personId as string)
  );

  return (
    <div className={expanded ? "fixed inset-0 z-50 flex flex-col gap-3 bg-cream p-4" : "flex flex-col gap-3"}>
      <div className="flex items-center justify-between gap-3">
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} onAddPerson={() => setAddPersonOpen(true)} />
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 rounded-full border border-border bg-paper px-4 py-1.5 text-[13.5px] text-cocoa transition-colors hover:border-cedar"
        >
          {expanded ? "✕ Close" : "⤢ Open full canvas"}
        </button>
      </div>

      <div className={expanded ? "flex flex-1 gap-3 overflow-hidden" : "flex flex-col gap-3 md:flex-row"}>
        <div className={expanded ? "min-w-0 flex-1" : "min-w-0 flex-1"}>
          <Canvas
            nodes={renderNodes}
            edges={edges}
            activeTool={activeTool}
            onNodesChange={onNodesChangeRaw}
            onEdgesChange={onEdgesChangeRaw}
            onNodeDragStop={handleNodeDragStop}
            onConnectPair={handleConnectPair}
            onCanvasClick={handleCanvasClick}
            onEdgeSelect={handleEdgeSelect}
            fullscreen={expanded}
          />
        </div>
        <SuggestionsPanel personId={personId} onAccepted={handleSuggestionAccepted} />
      </div>

      <Legend />

      {addPersonOpen && (
        <AddPersonToMapDialog
          personId={personId}
          workspacePeople={workspacePeople}
          excludeIds={existingPersonIds}
          onClose={() => setAddPersonOpen(false)}
          onAdded={handlePersonAdded}
        />
      )}

      {detailEdge && (
        <EdgeDetailDialog
          edge={detailEdge}
          personId={personId}
          onClose={() => setDetailEdge(null)}
          onUpdated={handleEdgeUpdated}
          onDeleted={handleEdgeDeleted}
        />
      )}
    </div>
  );
}
