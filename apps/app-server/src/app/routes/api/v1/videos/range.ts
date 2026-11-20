/**
 * Single-range parser for GET /api/v1/videos/{video_id}/stream (contracts/api-http.md):
 * `bytes=a-b`, `bytes=a-` or `bytes=-n`. A multi-range, malformed or unsatisfiable header is
 * `unsatisfiable` (416 `range_not_satisfiable`); no header is `full` (200).
 */
export interface ByteRange {
  /** first byte, inclusive */
  start: number;
  /** last byte, inclusive */
  end: number;
}

export type RangeResult = { kind: 'full' } | { kind: 'partial'; range: ByteRange } | { kind: 'unsatisfiable' };

const SINGLE_RANGE = /^bytes=(\d*)-(\d*)$/;

export function parseRange(header: string | undefined, total: number): RangeResult {
  if (header === undefined) return { kind: 'full' };
  const m = SINGLE_RANGE.exec(header.trim());
  if (!m) return { kind: 'unsatisfiable' };
  const [, first, last] = m;
  if (first === '' && last === '') return { kind: 'unsatisfiable' };

  if (first === '') {
    // suffix range: the last n bytes (the whole file when n exceeds it)
    const n = Number(last);
    if (!Number.isSafeInteger(n) || n <= 0 || total === 0) return { kind: 'unsatisfiable' };
    return { kind: 'partial', range: { start: Math.max(0, total - n), end: total - 1 } };
  }

  const start = Number(first);
  if (!Number.isSafeInteger(start) || start >= total) return { kind: 'unsatisfiable' };
  if (last === '') return { kind: 'partial', range: { start, end: total - 1 } };
  const end = Number(last);
  if (!Number.isSafeInteger(end) || end < start) return { kind: 'unsatisfiable' };
  // an end past the file is clamped to the last byte (RFC 9110 14.1.2)
  return { kind: 'partial', range: { start, end: Math.min(end, total - 1) } };
}
