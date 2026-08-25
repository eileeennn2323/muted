"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import PersonNode from "./PersonNode";
import StickyNoteNode from "./StickyNoteNode";
import FloatingEdge from "./FloatingEdge";

const NODE_TYPES: NodeTypes = {
  me: PersonNode,
  person: PersonNode,
  note: StickyNoteNode,
};

const EDGE_TYPES: EdgeTypes = {
  floating: FloatingEdge,
};

export type MapTool = "select" | "connect" | "note";

type CanvasProps = {
  nodes: Node[];
  edges: Edge[];
  activeTool: MapTool;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeDragStop: (nodeId: string, nodeType: string, x: number, y: number) => void;
  onConnectPair: (sourceId: string, targetId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  onEdgeSelect: (edge: Edge) => void;
  fullscreen: boolean;
};

function FlowInner({
  nodes,
  edges,
  activeTool,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  onConnectPair,
  onCanvasClick,
  onEdgeSelect,
}: Omit<CanvasProps, "fullscreen">) {
  const { screenToFlowPosition } = useReactFlow();
  const [connectSource, setConnectSource] = useState<string | null>(null);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (activeTool !== "connect" || node.type === "note") return;
      if (!connectSource) {
        setConnectSource(node.id);
        return;
      }
      if (connectSource !== node.id) {
        onConnectPair(connectSource, node.id);
      }
      setConnectSource(null);
    },
    [activeTool, connectSource, onConnectPair]
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool !== "note") return;
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onCanvasClick(pos.x, pos.y);
    },
    [activeTool, screenToFlowPosition, onCanvasClick]
  );

  const displayNodes = connectSource ? nodes.map((n) => (n.id === connectSource ? { ...n, selected: true } : n)) : nodes;

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      onNodeDragStop={(_event, node) => onNodeDragStop(node.id, node.type ?? "person", node.position.x, node.position.y)}
      onEdgeClick={(_event, edge) => {
        if (activeTool === "select") onEdgeSelect(edge);
      }}
      nodesConnectable={false}
      deleteKeyCode={null}
      className={activeTool === "note" ? "cursor-crosshair" : undefined}
      fitView
      minZoom={0.3}
      maxZoom={1.5}
    >
      <Background gap={20} color="var(--color-border)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function Canvas({ fullscreen, ...rest }: CanvasProps) {
  return (
    <div
      className={
        fullscreen
          ? "h-screen w-full"
          : "h-[520px] w-full overflow-hidden rounded-2xl border border-border bg-cream"
      }
    >
      <ReactFlowProvider>
        <FlowInner {...rest} />
      </ReactFlowProvider>
    </div>
  );
}
