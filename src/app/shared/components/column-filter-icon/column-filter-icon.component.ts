import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-column-filter-icon',
  standalone: true,
  template: `
    <button
      type="button"
      class="column-filter-icon"
      title="Filter this column"
      aria-label="Filter this column"
      (click)="focusFilter()">
      <i class="bi bi-funnel" aria-hidden="true"></i>
    </button>
  `,
})
export class ColumnFilterIconComponent implements AfterViewInit {
  private ariaLabel = 'Filter this column';

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const th = this.host.nativeElement.closest('th');
    const label = th?.textContent?.trim();

    if (label && label !== 'Actions') {
      this.ariaLabel = `Filter by ${label}`;
      const button = this.host.nativeElement.querySelector('button');
      button?.setAttribute('aria-label', this.ariaLabel);
      button?.setAttribute('title', this.ariaLabel);
    }
  }

  focusFilter(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const th = this.host.nativeElement.closest('th');
    const headerRow = th?.parentElement;
    const thead = headerRow?.parentElement;

    if (!th || !headerRow || !thead) return;

    const index = Array.from(headerRow.children).indexOf(th);
    const filterRow = thead.querySelector('tr.column-filter-row');
    const filterCell = filterRow?.children.item(index);
    const field = filterCell?.querySelector<HTMLElement>('input, select');

    if (!field) return;

    field.focus();
    field.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    if (field instanceof HTMLInputElement) {
      field.select();
    }
  }
}
