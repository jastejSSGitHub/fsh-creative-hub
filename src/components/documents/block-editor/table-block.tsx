"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Columns3, Rows3, Trash2 } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { UrlAwareField } from "@/components/documents/block-editor/url-aware-field";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import {
  insertTableColumnWidth,
  removeTableColumnWidth,
  resizeAdjacentColumns,
  resolveTableColumnWidths,
} from "@/lib/documents/table-column-widths";
import { cn } from "@/lib/utils";

type TableBlockProps = {
  rows: string[][];
  columnWidths?: number[];
  canEdit: boolean;
  onChange: (rows: string[][]) => void;
  onColumnWidthsChange: (widths: number[]) => void;
};

function createEmptyRow(columnCount: number): string[] {
  return Array.from({ length: columnCount }, () => "");
}

export function TableBlock({
  rows,
  columnWidths: storedWidths,
  canEdit,
  onChange,
  onColumnWidthsChange,
}: TableBlockProps) {
  const reduceMotion = useReducedMotion();
  const tableRef = useRef<HTMLTableElement>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(null);
  const [animatingRowIndex, setAnimatingRowIndex] = useState<number | null>(null);
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(null);

  const columnCount = Math.max(1, ...rows.map((row) => row.length));

  const normalizedRows = rows.map((row) => {
    if (row.length >= columnCount) return row;
    return [...row, ...createEmptyRow(columnCount - row.length)];
  });

  const columnWidths = useMemo(
    () => resolveTableColumnWidths(columnCount, storedWidths),
    [columnCount, storedWidths],
  );

  const updateCell = useCallback(
    (rowIndex: number, cellIndex: number, value: string) => {
      const nextRows = normalizedRows.map((row, ri) =>
        ri === rowIndex
          ? row.map((cell, ci) => (ci === cellIndex ? value : cell))
          : row,
      );
      onChange(nextRows);
    },
    [normalizedRows, onChange],
  );

  const addRow = useCallback(() => {
    const nextIndex = normalizedRows.length;
    onChange([...normalizedRows, createEmptyRow(columnCount)]);
    setAnimatingRowIndex(nextIndex);
    window.setTimeout(() => setAnimatingRowIndex(null), 400);
  }, [columnCount, normalizedRows, onChange]);

  const addColumn = useCallback(() => {
    onChange(normalizedRows.map((row) => [...row, ""]));
    onColumnWidthsChange(insertTableColumnWidth(columnWidths));
  }, [columnWidths, normalizedRows, onChange, onColumnWidthsChange]);

  const canDeleteRow = canEdit && normalizedRows.length > 1;
  const canDeleteColumn = canEdit && columnCount > 2;

  const deleteRow = useCallback(
    (rowIndex: number) => {
      if (normalizedRows.length <= 1) return;
      onChange(normalizedRows.filter((_, index) => index !== rowIndex));
      setHoveredRowIndex(null);
    },
    [normalizedRows, onChange],
  );

  const deleteColumn = useCallback(
    (columnIndex: number) => {
      if (columnCount <= 2) return;
      onChange(
        normalizedRows.map((row) => row.filter((_, index) => index !== columnIndex)),
      );
      onColumnWidthsChange(removeTableColumnWidth(columnWidths, columnIndex));
      setHoveredColumnIndex(null);
    },
    [columnCount, columnWidths, normalizedRows, onChange, onColumnWidthsChange],
  );

  const startColumnResize = useCallback(
    (columnIndex: number, event: ReactPointerEvent<HTMLDivElement>) => {
      if (!canEdit || columnIndex >= columnWidths.length - 1) return;

      event.preventDefault();
      event.stopPropagation();

      const table = tableRef.current;
      if (!table) return;

      const startX = event.clientX;
      const tableWidth = table.offsetWidth;
      const startWidths = [...columnWidths];

      const handle = event.currentTarget;
      setResizingColumnIndex(columnIndex);
      handle.setPointerCapture(event.pointerId);

      const previousUserSelect = document.body.style.userSelect;
      const previousCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (tableWidth <= 0) return;
        const deltaPercent = ((moveEvent.clientX - startX) / tableWidth) * 100;
        onColumnWidthsChange(
          resizeAdjacentColumns(startWidths, columnIndex, deltaPercent),
        );
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        document.body.style.userSelect = previousUserSelect;
        document.body.style.cursor = previousCursor;
        setResizingColumnIndex(null);

        if (handle.hasPointerCapture(upEvent.pointerId)) {
          handle.releasePointerCapture(upEvent.pointerId);
        }

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [canEdit, columnWidths, onColumnWidthsChange],
  );

  const resizeHandlePositions = useMemo(() => {
    let cumulative = 0;
    return columnWidths.slice(0, -1).map((width) => {
      cumulative += width;
      return cumulative;
    });
  }, [columnWidths]);

  const columnDeletePositions = useMemo(() => {
    let cumulative = 0;
    return columnWidths.map((width) => {
      const left = cumulative;
      cumulative += width;
      return { left, width };
    });
  }, [columnWidths]);

  return (
    <div
      className={cn(
        "relative pb-8",
        canDeleteRow && "pr-7",
        canDeleteColumn && "pb-12",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (resizingColumnIndex === null) {
          setHovered(false);
          setHoveredRowIndex(null);
          setHoveredColumnIndex(null);
        }
      }}
    >
      <div className="relative">
        <div className="rounded-[6px] border border-hub-foreground/12">
          <div className="relative">
            <table
              ref={tableRef}
              className="w-full table-fixed border-collapse text-[0.8125rem]"
            >
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={`col-${index}`} style={{ width: `${width}%` }} />
              ))}
            </colgroup>
            <tbody>
              <AnimatePresence initial={false}>
                {normalizedRows.map((row, rowIndex) => {
                  const isHeader = rowIndex === 0;
                  const isNewRow = animatingRowIndex === rowIndex;

                  return (
                    <motion.tr
                      key={`row-${rowIndex}`}
                      initial={
                        isNewRow && !reduceMotion
                          ? { opacity: 0, height: 0 }
                          : false
                      }
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.28,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                      onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                      className={cn(
                        "border-b border-hub-foreground/8 last:border-0",
                        isHeader &&
                          "bg-hub-foreground/[0.045] font-medium text-hub-foreground/90",
                      )}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`cell-${rowIndex}-${cellIndex}`}
                          onMouseEnter={() => setHoveredColumnIndex(cellIndex)}
                          className={cn(
                            "relative border-r border-hub-foreground/8 p-2 align-top last:border-0",
                            "min-w-0 overflow-hidden",
                          )}
                        >
                          <UrlAwareField
                            value={cell}
                            onChange={(value) =>
                              updateCell(rowIndex, cellIndex, value)
                            }
                            readOnly={!canEdit}
                            placeholder={isHeader ? "Header" : ""}
                            inputClassName="min-w-0 text-[0.8125rem]"
                            truncate
                            title={cell.trim() || undefined}
                          />
                        </td>
                      ))}
                      {canDeleteRow ? (
                        <td className="relative w-0 border-0 p-0 align-middle">
                          <div
                            className={cn(
                              "absolute left-full top-1/2 z-20 ml-1 flex -translate-y-1/2 items-center transition-opacity duration-150",
                              hoveredRowIndex === rowIndex
                                ? "pointer-events-auto opacity-100"
                                : "pointer-events-none opacity-0",
                            )}
                          >
                            <HubTooltip label="Delete row" side="top">
                              <button
                                type="button"
                                onClick={() => deleteRow(rowIndex)}
                                aria-label={`Delete row ${rowIndex + 1}`}
                                className="inline-flex size-6 items-center justify-center rounded-[4px] text-hub-foreground/35 transition-colors hover:bg-hub-rejected/10 hover:text-hub-rejected"
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </button>
                            </HubTooltip>
                          </div>
                        </td>
                      ) : null}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {canEdit
            ? resizeHandlePositions.map((leftPercent, columnIndex) => (
                <div
                  key={`resize-${columnIndex}`}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize column ${columnIndex + 1}`}
                  onPointerDown={(event) => startColumnResize(columnIndex, event)}
                  className={cn(
                    "absolute top-0 bottom-0 z-10 w-2 -translate-x-1/2 touch-none",
                    "cursor-col-resize transition-opacity",
                    hovered || resizingColumnIndex === columnIndex
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                  style={{ left: `${leftPercent}%` }}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-1/2 w-px -translate-x-1/2",
                      resizingColumnIndex === columnIndex
                        ? "bg-hub-primary/70"
                        : "bg-transparent hover:bg-hub-primary/45",
                    )}
                  />
                </div>
              ))
            : null}
          </div>
        </div>

        {canDeleteColumn
          ? columnDeletePositions.map(({ left, width }, columnIndex) => (
              <div
                key={`col-delete-${columnIndex}`}
                className="pointer-events-none absolute top-full mt-1"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <div className="pointer-events-auto flex justify-center">
                  <HubTooltip label="Delete column" side="bottom">
                    <button
                      type="button"
                      onClick={() => deleteColumn(columnIndex)}
                      onMouseEnter={() => setHoveredColumnIndex(columnIndex)}
                      aria-label={`Delete column ${columnIndex + 1}`}
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-[4px] text-hub-foreground/35 transition-all duration-150 hover:bg-hub-rejected/10 hover:text-hub-rejected",
                        hoveredColumnIndex === columnIndex
                          ? "opacity-100"
                          : "pointer-events-none opacity-0",
                      )}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </HubTooltip>
                </div>
              </div>
            ))
          : null}
      </div>

      {canEdit ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex justify-center",
            "transition-all duration-200",
            hovered || resizingColumnIndex !== null
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0",
          )}
        >
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-1 py-0.5 shadow-sm">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[0.75rem] font-medium text-hub-foreground/75 transition-colors hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
            >
              <Rows3 className="size-3.5" aria-hidden />
              Add row
            </button>
            <span className="h-4 w-px bg-hub-foreground/10" aria-hidden />
            <button
              type="button"
              onClick={addColumn}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[0.75rem] font-medium text-hub-foreground/75 transition-colors hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
            >
              <Columns3 className="size-3.5" aria-hidden />
              Add column
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
