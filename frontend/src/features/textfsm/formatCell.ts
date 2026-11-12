import type { TextFsmCellValue } from './types';

export function formatTextFsmCell(
  value: TextFsmCellValue | undefined,
  separator: string,
): string {
  if (!Array.isArray(value)) return value ?? '';
  return value.every((item) => typeof item === 'string')
    ? value.join(separator)
    : JSON.stringify(value);
}
