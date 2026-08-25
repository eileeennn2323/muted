"use client";

type Tool = "select" | "connect" | "note";

export default function Toolbar({
  activeTool,
  onToolChange,
  onAddPerson,
}: {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onAddPerson: () => void;
}) {
  function toggle(tool: Tool) {
    onToolChange(activeTool === tool ? "select" : tool);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onAddPerson}
        className="rounded-full border border-border bg-paper px-4 py-1.5 text-[13.5px] text-cocoa transition-colors hover:border-cedar"
      >
        + Add person
      </button>
      <button
        type="button"
        onClick={() => toggle("connect")}
        className={`rounded-full border px-4 py-1.5 text-[13.5px] transition-colors ${
          activeTool === "connect" ? "border-cedar bg-cedar text-cream" : "border-border bg-paper text-cocoa hover:border-cedar"
        }`}
      >
        → Connect
      </button>
      <button
        type="button"
        onClick={() => toggle("note")}
        className={`rounded-full border px-4 py-1.5 text-[13.5px] transition-colors ${
          activeTool === "note" ? "border-cedar bg-cedar text-cream" : "border-border bg-paper text-cocoa hover:border-cedar"
        }`}
      >
        ▤ Note
      </button>
      {activeTool !== "select" && (
        <span className="self-center font-mono text-[10.5px] text-cocoa-quiet">
          {activeTool === "connect" ? "Click two people to connect them" : "Click the canvas to drop a note"}
        </span>
      )}
    </div>
  );
}
