import { Pipe, PipeTransform } from '@angular/core';

/**
 * Simple, local, per-column table filter.
 *
 * Filters are keyed by the row property (dot paths are supported) and matched
 * with a case-insensitive "contains" check. All active columns must match.
 * This pipe is intentionally impure because the filter object is mutated by
 * ngModel as the user types.
 */
@Pipe({
  name: 'columnFilter',
  standalone: true,
  pure: false,
})
export class ColumnFilterPipe implements PipeTransform {
  transform<T>(
    items: readonly T[] | null | undefined,
    filters: Record<string, unknown> | null | undefined
  ): T[] {
    if (!items?.length) return [];

    const activeFilters = Object.entries(filters ?? {})
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
      .map(([path, value]) => [path, String(value).trim().toLowerCase()] as const);

    if (!activeFilters.length) return items as T[];

    return items.filter(item =>
      activeFilters.every(([path, term]) =>
        this.normalize(this.readPath(item, path)).includes(term)
      )
    );
  }

  private readPath(value: unknown, path: string): unknown {
    let current: any = value;

    for (const part of path.split('.')) {
      if (current === null || current === undefined) return '';

      current = current[part];
    }

    return current;
  }

  private normalize(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (value instanceof Date) {
      return this.searchableDate(value);
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return `${value.slice(0, 10)} ${this.searchableDate(date)}`;
      }
    }

    return String(value).toLowerCase();
  }

  // Include the ISO date, the long date, and the compact table format
  // (for example 20-Oct-26) so date filters match what users see.
  private searchableDate(value: Date): string {
    if (Number.isNaN(value.getTime())) return '';

    const day = String(value.getDate()).padStart(2, '0');
    const month = value.toLocaleString('en-GB', { month: 'short' });
    const shortYear = String(value.getFullYear()).slice(-2);

    return `${this.isoDate(value)} ${value.toDateString()} ${day}-${month}-${shortYear}`.toLowerCase();
  }

  private isoDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
