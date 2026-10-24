import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  signal,
} from '@angular/core';

let nextDialogId = 0;

/**
 * Accessible, responsive confirmation dialog used for destructive actions.
 *
 * Usage:
 *   <app-confirm-dialog #deleteDialog
 *       title="Delete this record?"
 *       message="The selected record will be removed."
 *       (confirmed)="onDeleteConfirmed()"
 *       (cancelled)="onDeleteCancelled()">
 *   </app-confirm-dialog>
 *
 *   this.deleteDialog.show();
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="open()"
      class="gb-confirm-backdrop"
      role="presentation"
      (click)="onBackdropClick($event)">
      <div
        #dialogCard
        class="gb-confirm-card"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="messageId"
        (click)="$event.stopPropagation()">
        <span class="gb-confirm-accent" aria-hidden="true"></span>

        <button
          type="button"
          class="gb-confirm-close"
          aria-label="Close dialog"
          [disabled]="busy"
          (click)="requestCancel()">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <div class="gb-confirm-body">
          <div class="gb-confirm-icon" aria-hidden="true">
            <i class="bi" [ngClass]="icon"></i>
          </div>

          <h2 [id]="titleId" class="gb-confirm-title">{{ title }}</h2>
          <p [id]="messageId" class="gb-confirm-message">{{ message }}</p>

          <p class="gb-confirm-warning" *ngIf="showWarning">
            <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
            <span>This action cannot be undone.</span>
          </p>
        </div>

        <div class="gb-confirm-actions">
          <button
            #cancelButton
            type="button"
            class="gb-confirm-btn gb-confirm-btn--ghost"
            [disabled]="busy"
            (click)="requestCancel()">
            {{ cancelLabel }}
          </button>

          <button
            type="button"
            class="gb-confirm-btn gb-confirm-btn--danger"
            [disabled]="busy"
            [attr.aria-busy]="busy"
            (click)="requestConfirm()">
            <span class="gb-confirm-spinner" *ngIf="busy" aria-hidden="true"></span>
            <i class="bi bi-trash3" *ngIf="!busy" aria-hidden="true"></i>
            <span>{{ busy ? busyLabel : confirmLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .gb-confirm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
        overflow-y: auto;
        background: rgba(9, 30, 24, 0.62);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        animation: gb-confirm-fade 0.18s ease-out;
      }

      .gb-confirm-card {
        position: relative;
        width: 100%;
        max-width: 440px;
        margin: auto;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.55);
        border-radius: 22px;
        background: #ffffff;
        box-shadow:
          0 32px 80px rgba(4, 33, 22, 0.32),
          0 4px 14px rgba(4, 33, 22, 0.1);
        animation: gb-confirm-in 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      .gb-confirm-accent {
        display: block;
        height: 5px;
        background: linear-gradient(90deg, #d64545 0%, #ef7d6a 55%, #f6b3a0 100%);
      }

      .gb-confirm-close {
        position: absolute;
        top: 16px;
        right: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #f3f7f4;
        color: #49665a;
        font-size: 16px;
        cursor: pointer;
        transition:
          background-color 0.18s ease,
          color 0.18s ease,
          transform 0.18s ease;
      }

      .gb-confirm-close:hover:not(:disabled) {
        background: #e7efea;
        color: #17384a;
      }

      .gb-confirm-close:active:not(:disabled) {
        transform: scale(0.94);
      }

      .gb-confirm-close:focus-visible,
      .gb-confirm-btn:focus-visible {
        outline: 3px solid rgba(8, 125, 75, 0.45);
        outline-offset: 2px;
      }

      .gb-confirm-close:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .gb-confirm-body {
        padding: 30px 32px 22px;
        text-align: center;
      }

      .gb-confirm-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 68px;
        margin: 0 auto 18px;
        border: 1px solid #f7d2cc;
        border-radius: 50%;
        background: radial-gradient(circle at 32% 26%, #ffffff 0%, #fdeae6 48%, #fbd7d1 100%);
        color: #c93f3f;
        font-size: 28px;
        box-shadow: 0 10px 24px rgba(201, 63, 63, 0.18);
      }

      .gb-confirm-title {
        margin: 0 0 8px;
        padding: 0 12px;
        color: #123b2c;
        font-size: 21px;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -0.01em;
        overflow-wrap: anywhere;
      }

      .gb-confirm-message {
        margin: 0;
        color: #5b7266;
        font-size: 14px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }

      .gb-confirm-warning {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: 8px;
        margin: 18px 0 0;
        padding: 11px 14px;
        border: 1px solid #f6d8d2;
        border-radius: 12px;
        background: #fdf3f1;
        color: #a63a33;
        font-size: 12.5px;
        font-weight: 600;
        line-height: 1.45;
        text-align: left;
      }

      .gb-confirm-warning .bi {
        flex-shrink: 0;
        margin-top: 1px;
        font-size: 13.5px;
      }

      .gb-confirm-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
        gap: 10px;
        padding: 18px 24px max(20px, env(safe-area-inset-bottom));
        border-top: 1px solid #edf2ef;
        background: #fbfdfc;
      }

      .gb-confirm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        padding: 11px 18px;
        border: 1px solid transparent;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.2;
        cursor: pointer;
        transition:
          background-color 0.18s ease,
          border-color 0.18s ease,
          color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.12s ease;
      }

      .gb-confirm-btn:active:not(:disabled) {
        transform: translateY(1px);
      }

      .gb-confirm-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .gb-confirm-btn--ghost {
        border-color: #d8e4dc;
        background: #ffffff;
        color: #31584a;
      }

      .gb-confirm-btn--ghost:hover:not(:disabled) {
        border-color: #bcd2c5;
        background: #f4f9f6;
      }

      .gb-confirm-btn--danger {
        border-color: #b93434;
        background: linear-gradient(180deg, #d74747 0%, #bf3434 100%);
        color: #ffffff;
        box-shadow: 0 8px 18px rgba(191, 52, 52, 0.26);
      }

      .gb-confirm-btn--danger:hover:not(:disabled) {
        background: linear-gradient(180deg, #c93d3d 0%, #a82a2a 100%);
        box-shadow: 0 10px 22px rgba(191, 52, 52, 0.32);
      }

      .gb-confirm-spinner {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: gb-confirm-spin 0.7s linear infinite;
      }

      @media (max-width: 480px) {
        .gb-confirm-backdrop {
          padding: 12px;
          align-items: flex-end;
        }

        .gb-confirm-card {
          max-width: 100%;
          border-radius: 18px;
        }

        .gb-confirm-body {
          padding: 26px 20px 18px;
        }

        .gb-confirm-icon {
          width: 60px;
          height: 60px;
          margin-bottom: 14px;
          font-size: 24px;
        }

        .gb-confirm-title {
          font-size: 18.5px;
          padding: 0 6px;
        }

        .gb-confirm-message {
          font-size: 13.5px;
        }

        .gb-confirm-close {
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
        }

        .gb-confirm-actions {
          padding: 14px 16px max(16px, env(safe-area-inset-bottom));
        }
      }

      @media (max-width: 360px) {
        .gb-confirm-actions {
          grid-template-columns: 1fr;
        }

        .gb-confirm-btn--danger {
          order: -1;
        }
      }

      @media (max-height: 520px) {
        .gb-confirm-backdrop {
          align-items: flex-start;
          padding-top: 16px;
        }

        .gb-confirm-card {
          margin: 0 auto;
        }

        .gb-confirm-body {
          padding-top: 22px;
        }

        .gb-confirm-icon {
          width: 54px;
          height: 54px;
          margin-bottom: 12px;
          font-size: 21px;
        }
      }

      @keyframes gb-confirm-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes gb-confirm-in {
        from {
          opacity: 0;
          transform: translateY(14px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes gb-confirm-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .gb-confirm-backdrop,
        .gb-confirm-card,
        .gb-confirm-spinner {
          animation: none;
        }

        .gb-confirm-btn,
        .gb-confirm-close {
          transition: none;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent implements OnDestroy {
  private readonly uid = ++nextDialogId;

  readonly titleId = `gb-confirm-title-${this.uid}`;
  readonly messageId = `gb-confirm-message-${this.uid}`;

  @Input() title = 'Delete this record?';
  @Input() message = 'The selected record will be permanently removed from the system.';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';
  @Input() busyLabel = 'Deleting…';
  @Input() icon = 'bi-trash3';
  @Input() showWarning = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  /** Signals notify Angular's zoneless scheduler, so the template re-renders. */
  readonly open = signal(false);

  private busyState = false;

  /** Kept settable from parents: `dialog.busy = true` while the API call runs. */
  @Input()
  get busy(): boolean {
    return this.busyState;
  }

  set busy(value: boolean) {
    if (this.busyState === value) return;
    this.busyState = value;
    this.changeDetector.markForCheck();
  }

  @ViewChild('dialogCard') private dialogCard?: ElementRef<HTMLElement>;
  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  private lastFocusedElement: HTMLElement | null = null;
  private previousBodyOverflow: string | null = null;
  private previousBodyPaddingRight: string | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private changeDetector: ChangeDetectorRef
  ) {}

  /** Opens the dialog. Called from the delete icon handler only. */
  show(): void {
    if (this.open()) return;

    this.open.set(true);
    this.busy = false;

    if (!isPlatformBrowser(this.platformId)) return;

    this.lastFocusedElement =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.lockBodyScroll();

    // Focus the safe action first so keyboard and screen-reader users
    // cannot confirm a destructive action by accident.
    setTimeout(() => this.cancelButton?.nativeElement.focus(), 0);
  }

  /** Closes the dialog without emitting a cancel event (used after success). */
  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.busy = false;
    this.releaseBodyScroll();
    this.restoreFocus();
  }

  requestConfirm(): void {
    if (this.busy) return;
    this.confirmed.emit();
  }

  requestCancel(): void {
    if (this.busy) return;
    this.open.set(false);
    this.releaseBodyScroll();
    this.restoreFocus();
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestCancel();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.open() || this.busy) return;
    event.preventDefault();
    this.requestCancel();
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTabKey(event: Event): void {
    if (!this.open()) return;

    const keyboardEvent = event as KeyboardEvent;
    const card = this.dialogCard?.nativeElement;
    if (!card) return;

    const focusable = Array.from(
      card.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (keyboardEvent.shiftKey && (active === first || !card.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    this.releaseBodyScroll();
  }

  private lockBodyScroll(): void {
    const body = this.document.body;
    if (!body) return;

    this.previousBodyOverflow = body.style.overflow;
    this.previousBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - this.document.documentElement.clientWidth;
    this.renderer.setStyle(body, 'overflow', 'hidden');

    if (scrollbarWidth > 0) {
      this.renderer.setStyle(body, 'padding-right', `${scrollbarWidth}px`);
    }
  }

  private releaseBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const body = this.document.body;
    if (!body) return;

    if (this.previousBodyOverflow !== null) {
      if (this.previousBodyOverflow) {
        this.renderer.setStyle(body, 'overflow', this.previousBodyOverflow);
      } else {
        this.renderer.removeStyle(body, 'overflow');
      }
      this.previousBodyOverflow = null;
    }

    if (this.previousBodyPaddingRight !== null) {
      if (this.previousBodyPaddingRight) {
        this.renderer.setStyle(body, 'padding-right', this.previousBodyPaddingRight);
      } else {
        this.renderer.removeStyle(body, 'padding-right');
      }
      this.previousBodyPaddingRight = null;
    }
  }

  private restoreFocus(): void {
    const element = this.lastFocusedElement;
    this.lastFocusedElement = null;

    if (element && this.document.contains(element)) {
      setTimeout(() => element.focus(), 0);
    }
  }
}
