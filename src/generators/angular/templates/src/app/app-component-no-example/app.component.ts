import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [],
  template: `
    <div class="mfe-container">
      <h1>Micro Frontend</h1>
      <p>Your micro frontend is ready for integration.</p>
    </div>
  `,
  styles: `
    .mfe-container {
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class AppComponent {}

