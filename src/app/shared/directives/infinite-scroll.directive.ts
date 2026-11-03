import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Lightweight infinite-scroll sentinel.
 *
 * Attach it to an element placed after the last rendered row/card. The
 * directive finds the nearest scrollable ancestor (the app scrolls inside
 * `.main-content`, not the window) and emits once the sentinel approaches the
 * bottom of that container. Scroll handling is throttled with
 * requestAnimationFrame and a short cooldown so fast scrolling cannot queue
 * several page loads in the same frame.
 *
 * A manual "load more" button should still be rendered next to the sentinel:
 * it keeps the list fully usable with a keyboard and when the container does
 * not emit scroll events (for example, very short content).
 */
@Directive({
  selector: '[gbInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  /** Distance in pixels from the bottom at which loading starts. */
  @Input() gbInfiniteScrollDistance = 320;

  /** Prevents emissions while a page is already being appended. */
  @Input() gbInfiniteScrollDisabled = false;

  /** Emits when the sentinel nears the bottom of the scroll container. */
  @Output() readonly gbInfiniteScrollLoad = new EventEmitter<void>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private scrollRoot: HTMLElement | Window | null = null;
  private rafId: number | null = null;
  private destroyed = false;
  private lastEmitAt = 0;

  private static readonly EMIT_COOLDOWN_MS = 250;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Scroll listeners run outside Angular; the component is only notified
    // when a new page actually needs to be rendered.
    this.zone.runOutsideAngular(() => {
      this.scrollRoot = this.findScrollRoot();
      this.addScrollListener();
      window.addEventListener('resize', this.onViewportChange, { passive: true });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.removeScrollListener();

    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onViewportChange);
    }
  }

  private readonly onViewportChange = (): void => {
    this.scheduleCheck();
  };

  private addScrollListener(): void {
    if (!this.scrollRoot) {
      return;
    }

    if (this.scrollRoot === window) {
      window.addEventListener('scroll', this.onViewportChange, { passive: true });
    } else {
      (this.scrollRoot as HTMLElement).addEventListener(
        'scroll',
        this.onViewportChange,
        { passive: true }
      );
    }
  }

  private removeScrollListener(): void {
    if (!this.scrollRoot) {
      return;
    }

    if (this.scrollRoot === window) {
      window.removeEventListener('scroll', this.onViewportChange);
    } else {
      (this.scrollRoot as HTMLElement).removeEventListener(
        'scroll',
        this.onViewportChange
      );
    }
  }

  /**
   * Finds the element that actually scrolls the page. Falls back to the
   * window when the component is used on a conventionally scrolling page.
   */
  private findScrollRoot(): HTMLElement | Window {
    let ancestor = this.element.nativeElement.parentElement;

    while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
      const overflowY = getComputedStyle(ancestor).overflowY;

      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        return ancestor;
      }

      ancestor = ancestor.parentElement;
    }

    return window;
  }

  private scheduleCheck(): void {
    if (this.destroyed || this.rafId !== null) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.checkSentinel();
    });
  }

  private checkSentinel(): void {
    if (
      this.destroyed ||
      this.gbInfiniteScrollDisabled ||
      !this.scrollRoot
    ) {
      return;
    }

    const sentinel = this.element.nativeElement;

    if (!sentinel.isConnected) {
      return;
    }

    const sentinelRect = sentinel.getBoundingClientRect();

    const rootRect =
      this.scrollRoot === window
        ? {
            top: 0,
            bottom: window.innerHeight || document.documentElement.clientHeight,
          }
        : (this.scrollRoot as HTMLElement).getBoundingClientRect();

    const isInsideScrollArea = sentinelRect.bottom >= rootRect.top;
    const isNearBottom =
      sentinelRect.top <= rootRect.bottom + this.gbInfiniteScrollDistance;

    if (!isInsideScrollArea || !isNearBottom) {
      return;
    }

    const now = performance.now();

    if (now - this.lastEmitAt < InfiniteScrollDirective.EMIT_COOLDOWN_MS) {
      return;
    }

    this.lastEmitAt = now;
    this.zone.run(() => this.gbInfiniteScrollLoad.emit());
  }
}
