import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LuigiContextService } from '@luigi-project/client-support-angular';

@Component({
  selector: 'app-object-page',
  standalone: true,
  imports: [],
  templateUrl: './object-page.component.html',
  styleUrl: './object-page.component.scss',
})
export class ObjectPageComponent {
  private luigiContextService = inject(LuigiContextService);

  public luigiContext = toSignal(this.luigiContextService.contextObservable());
  public product = {
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
  };
}

