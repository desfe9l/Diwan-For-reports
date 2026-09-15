import { isCompoundShape, shapeDef } from "@/lib/editor/shapes";

/**
 * Small monochrome shape preview for palette buttons.
 *
 * Renders the same geometry as the canvas (shared `shapes.ts`) filled with
 * `currentColor`, so a button tints with its own text colour and needs no
 * per-shape styling.
 */
export function ShapePreview({ shapeId, className }: { shapeId: string; className?: string }) {
  const def = shapeDef(shapeId);
  const evenOdd = isCompoundShape(def.id);
  return (
    <svg
      viewBox="-2 -2 104 104"
      className={className}
      fill="currentColor"
      fillRule={evenOdd ? "evenodd" : undefined}
      aria-hidden
      focusable="false"
    >
      {def.parts.map((part, i) => {
        if (part.k === "rect") {
          return <rect key={i} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.rx} />;
        }
        if (part.k === "circle") {
          return <circle key={i} cx={part.cx} cy={part.cy} r={part.r} />;
        }
        if (part.k === "ellipse") {
          return <ellipse key={i} cx={part.cx} cy={part.cy} rx={part.rx} ry={part.ry} />;
        }
        if (part.k === "poly") {
          return <polygon key={i} points={part.points} />;
        }
        return <path key={i} d={part.d} />;
      })}
    </svg>
  );
}