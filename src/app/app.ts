import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './core/components/navbar/navbar';
import { Footer } from './core/components/footer/footer';
import { Branding } from './core/components/branding/branding';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Branding, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('GreenBasketUI');
}
