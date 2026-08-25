"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { avatarColorForRole } from "@/lib/people/avatarColor";
import { initialsFor } from "@/lib/people/format";
import type { MapNodeData } from "./types";

export type PersonFlowNode = Node<MapNodeData & { onDelete?: (id: string) => void }, "person">;

// Edges are drawn by a custom "floating" edge type that computes its own
// anchor point on each node's border, so these handles never need to be
// seen or dragged — they only exist because React Flow requires at least
// one source and one target handle per node to resolve an edge's endpoints
// at all. isConnectable is false to keep native handle-dragging disabled
// (connections are made via the toolbar's click-two-nodes Connect tool).
function InvisibleHandles() {
  return (
    <>
      <Handle type="source" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
    </>
  );
}

export default function PersonNode({ data, selected }: NodeProps<PersonFlowNode>) {
  const color = data.nodeKind === "me" ? { bg: "bg-cocoa", text: "text-cream" } : avatarColorForRole(data.role);

  return (
    <div
      className={`group relative flex items-center gap-2.5 rounded-2xl border bg-paper px-3.5 py-2.5 shadow-sm transition-shadow ${
        selected ? "border-cedar shadow-md" : "border-border"
      }`}
      style={{ width: 170 }}
    >
      <InvisibleHandles />
      {data.nodeKind === "person" && data.onDelete && (
        <button
          type="button"
          onClick={() => data.onDelete?.(data.id)}
          aria-label={`Remove ${data.name} from the map`}
          className="absolute top-1 right-1 hidden h-5 w-5 items-center justify-center rounded-full text-cocoa-quiet/60 hover:bg-cocoa/10 hover:text-cocoa group-hover:flex"
        >
          ×
        </button>
      )}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm ${color.bg} ${color.text}`}
      >
        {data.nodeKind === "me" ? "Me" : initialsFor(data.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] text-cocoa">{data.name}</p>
        {data.role && <p className="truncate font-mono text-[10px] text-cocoa-faint">{data.role}</p>}
      </div>
    </div>
  );
}
