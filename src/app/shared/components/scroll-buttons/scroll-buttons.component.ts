import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * Floating "scroll to top" / "scroll to bottom" buttons for long list pages.
 *
 * Shows the top button once the user has scrolled past a threshold, and the
 * bottom button while there is still content below the fold. Visibility is
 * toggled on a throttled (requestAnimationFrame) scroll listener so the page
 * stays responsive, and scrolling uses the browser's smooth-scroll API.
 */
@Component({
  selector: 'gb-scroll-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-buttons.component.html',
  styleUrl: './scroll-buttons.component.css',
})
export class ScrollButtonsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly threshold = 220; // px scrolled before the top button shows
  private rafId: number | null = null;

  showTop = false;
  showBottom = false;

  private readonly onScroll = (): void => {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => this.updateVisibility());
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.updateVisibility();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private updateVisibility(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const doc = document.documentElement;
    const scrolled =
      doc.scrollTop || document.body.scrollTop || window.scrollY || 0;
    const scrollHeight = doc.scrollHeight;
    const clientHeight = doc.clientHeight || window.innerHeight;
    const atBottom =
      scrolled + clientHeight >= scrollHeight - 20;

    this.showTop = scrolled > this.threshold;
    this.showBottom = scrolled > 0 && !atBottom;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    this.showTop = false;
  }

  scrollToBottom(): void {
    const max = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight || 0
    );
    window.scrollTo({ top: max, left: 0, behavior: 'smooth' });
    this.showBottom = false;
  }

}
