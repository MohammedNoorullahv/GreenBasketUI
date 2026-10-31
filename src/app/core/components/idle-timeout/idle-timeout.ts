import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdleTimeoutService } from '../../services/idle-timeout.service';

@Component({
  selector: 'app-idle-timeout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './idle-timeout.html',
  styleUrl: './idle-timeout.css'
})
export class IdleTimeoutComponent {
  readonly idle = inject(IdleTimeoutService);

  private readonly stayButton =
    viewChild<ElementRef<HTMLButtonElement>>('stayButton');

  constructor() {
    afterNextRender(() => this.idle.initialize());

    effect(() => {
      if (this.idle.warningOpen()) {
        queueMicrotask(() =>
          this.stayButton()?.nativeElement.focus()
        );
      }
    });
  }

  staySignedIn(): void {
    this.idle.staySignedIn();
  }

  logoutNow(): void {
    this.idle.logoutNow();
  }
}
