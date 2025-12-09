import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import LuigiClient from '@luigi-project/client';
import { ILuigiContextTypes, LuigiContextService } from '@luigi-project/client-support-angular';
import { delay, Observable, of } from 'rxjs';

@Component({
  selector: 'app-object-page',
  standalone: true,
  imports: [],
  templateUrl: './object-page.component.html',
  styleUrl: './object-page.component.scss',
})
export class ObjectPageComponent {
  private luigiContextService = inject(LuigiContextService);

  public luigiContext = toSignal(this.luigiContextService.contextObservable(), {
    initialValue: { context: {}, contextType: ILuigiContextTypes.INIT },
  });

  public product$ = signal<any>(null);
  constructor() {
    effect(() => {
      console.log('context updated');
      console.log(this.luigiContext().context);
    });
  }

  public ngOnInit(): void {
    LuigiClient.addInitListener((initialContext: any) => {
      LuigiClient.uxManager().showLoadingIndicator();
      LuigiClient.uxManager().showAlert({
        text: 'Microfrontend initialized on url: ' + initialContext.portalBaseUrl,
        type: 'success',
        closeAfter: 3000,
      });

      this.loadProduct().subscribe((product) => {
        this.product$.set(product);
        LuigiClient.uxManager().hideLoadingIndicator();
      });
    });
  }

  private loadProduct(): Observable<any> {
    return of({
      name: 'Notebook Basic 15',
      subtitle: 'Product Details',
      description:
        'Notebook Basic 15 with 2,80 GHz quad core, 15" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro',
      supplier: 'Very Best Screens',
      category: 'Laptops',
      status: 'Available',
      price: '956.00',
      currency: 'EUR',
      specifications: [
        { label: 'Processor', value: '2.80 GHz quad core' },
        { label: 'Display', value: '15" LCD' },
        { label: 'Memory', value: '4 GB DDR3 RAM' },
        { label: 'Storage', value: '500 GB Hard Disc' },
        { label: 'Operating System', value: 'Windows 8 Pro' },
      ],
    }).pipe(delay(3000));
  }
}
