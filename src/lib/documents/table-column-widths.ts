export const MIN_TABLE_COLUMN_PERCENT = 8;

export function equalColumnWidths(columnCount: number): number[] {
  if (columnCount <= 0) return [100];
  const share = 100 / columnCount;
  return Array.from({ length: columnCount }, () => share);
}

export function resolveTableColumnWidths(
  columnCount: number,
  stored?: number[],
): number[] {
  if (columnCount <= 0) return [100];

  if (
    stored &&
    stored.length === columnCount &&
    stored.every((value) => Number.isFinite(value) && value > 0)
  ) {
    const total = stored.reduce((sum, value) => sum + value, 0);
    if (total > 0) {
      return stored.map((value) => (value / total) * 100);
    }
  }

  return equalColumnWidths(columnCount);
}

export function insertTableColumnWidth(widths: number[]): number[] {
  const columnCount = widths.length + 1;
  const share = 100 / columnCount;
  return Array.from({ length: columnCount }, () => share);
}

export function removeTableColumnWidth(
  widths: number[],
  columnIndex: number,
): number[] {
  if (columnIndex < 0 || columnIndex >= widths.length || widths.length <= 1) {
    return widths;
  }

  const remaining = widths.filter((_, index) => index !== columnIndex);
  const total = remaining.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return equalColumnWidths(remaining.length);

  return remaining.map((value) => (value / total) * 100);
}

export function resizeAdjacentColumns(
  widths: number[],
  leftIndex: number,
  deltaPercent: number,
): number[] {
  const rightIndex = leftIndex + 1;
  if (rightIndex >= widths.length) return widths;

  const next = [...widths];
  let left = next[leftIndex]! + deltaPercent;
  let right = next[rightIndex]! - deltaPercent;

  if (left < MIN_TABLE_COLUMN_PERCENT) {
    right -= MIN_TABLE_COLUMN_PERCENT - left;
    left = MIN_TABLE_COLUMN_PERCENT;
  }

  if (right < MIN_TABLE_COLUMN_PERCENT) {
    left -= MIN_TABLE_COLUMN_PERCENT - right;
    right = MIN_TABLE_COLUMN_PERCENT;
  }

  if (left < MIN_TABLE_COLUMN_PERCENT || right < MIN_TABLE_COLUMN_PERCENT) {
    return widths;
  }

  next[leftIndex] = left;
  next[rightIndex] = right;
  return next;
}
