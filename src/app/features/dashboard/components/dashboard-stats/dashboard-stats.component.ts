import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Dumb component - pure presentation with @Input properties
@Component({
  selector: 'app-dashboard-stats',
  imports: [CommonModule],
  templateUrl: './dashboard-stats.component.html',
  styleUrl: './dashboard-stats.component.scss',
})
export class DashboardStatsComponent {
  @Input() totalItems = 0;
  @Input() totalValue = 0;
  @Input() lowStockCount = 0;
  @Input() loading = false;
}
