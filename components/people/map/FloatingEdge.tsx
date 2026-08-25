"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type Node,
} from "@xyflow/react";

/**
 * Our nodes carry a single invisible handle each (see PersonNode) rather
 * than fixed connection points, since the map is auto-laid-out once and
 * then freely dragged anywhere by the user — there's no "top" or "bottom"
 * side that's always correct. This edge type computes its own anchor point
 * on each node's border every render, using the classic React Flow
 * "floating edges" line/rect-intersection technique.
 */
function getNodeIntersection(intersectionNode: InternalNode<Node>, targetNode: InternalNode<Node>) {
  const { width, height } = intersectionNode.measured;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;

  const w = (width ?? 0) / 2;
  const h = (height ?? 0) / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.measured.width ?? 0) / 2;
  const y1 = targetPosition.y + (targetNode.measured.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgePosition(node: InternalNode<Node>, intersectionPoint: { x: number; y: number }) {
  const { x: nx, y: ny } = node.internals.positionAbsolute;
  const width = node.measured.width ?? 0;
  const height = node.measured.height ?? 0;
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= Math.round(nx) + 1) return Position.Left;
  if (px >= Math.round(nx + width) - 1) return Position.Right;
  if (py <= Math.round(ny) + 1) return Position.Top;
  if (py >= Math.round(ny + height) - 1) return Position.Bottom;
  return Position.Top;
}

function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
  const sourceIntersection = getNodeIntersection(source, target);
  const targetIntersection = getNodeIntersection(target, source);
  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourcePos: getEdgePosition(source, sourceIntersection),
    targetPos: getEdgePosition(target, targetIntersection),
  };
}

export default function FloatingEdge({ id, source, target, style, label, labelStyle, labelBgStyle, markerEnd, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  const onSelect = (data as { onSelect?: () => void } | undefined)?.onSelect;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            onClick={onSelect}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              maxWidth: 220,
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11.5,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: onSelect ? "pointer" : undefined,
              background: (labelBgStyle as { fill?: string } | undefined)?.fill ?? "var(--color-cream)",
              color: (labelStyle as { fill?: string } | undefined)?.fill ?? "var(--color-cocoa-soft)",
            }}
            className="nodrag nopan shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
