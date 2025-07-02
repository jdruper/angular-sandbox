import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemActionService, ItemStateService } from '../../../../sandbox/services';
import { Item } from '../../../../sandbox/models';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats.component';
import { ItemListComponent } from '../../../../shared/components/item-list/item-list.component';

// Smart component - connects to ActionService, handles business logic
@Component({
  selector: 'app-inventory-dashboard',
  imports: [CommonModule, DashboardStatsComponent, ItemListComponent],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss',
  providers: [ItemActionService, ItemStateService], // Component-scoped services
})
export class InventoryDashboardComponent implements OnInit {
  // Inject the component-scoped ActionService
  private actionService = inject(ItemActionService);

  // Expose ActionService state directly to template
  items = this.actionService.items;
  loading = this.actionService.loading;
  error = this.actionService.error;
  selectedItem = this.actionService.selectedItem;
  
  // Computed business logic from ActionService
  totalInventoryValue = this.actionService.totalInventoryValue;
  lowStockItems = this.actionService.lowStockItems;
  itemCount = this.actionService.itemCount;

  ngOnInit(): void {
    // Load data on component initialization
    this.actionService.loadItems();
  }

  onItemSelected(item: Item): void {
    this.actionService.selectItem(item.id);
  }

  onItemDeleted(itemId: string): void {
    this.actionService.deleteItem(itemId);
  }

  onItemEdited(item: Item): void {
    // In a real app, this would open an edit modal/form
    console.log('Edit item:', item);
  }

  clearError(): void {
    this.actionService.clearError();
  }
}
