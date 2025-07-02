import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InventoryDashboardComponent } from './features/dashboard/containers/inventory-dashboard/inventory-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InventoryDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'sandbox-pattern-app';
}
