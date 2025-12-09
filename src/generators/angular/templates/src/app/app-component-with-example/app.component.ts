import { Component } from "@angular/core";
import { ObjectPageComponent } from "./object-page/object-page.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ObjectPageComponent],
  template: `<app-object-page></app-object-page>`,
  styles: ``,
})
export class AppComponent {}

