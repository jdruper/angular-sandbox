import { Injectable, inject, computed } from '@angular/core';
import { catchError, of, finalize } from 'rxjs';
import { ItemApiService } from './item-api.service';
import { ItemStateService } from './item-state.service';
import { ItemTransformationService } from './item-transformation.service';
import { CreateItemRequest, UpdateItemRequest } from '../models';

@Injectable()
export class ItemActionService {
  private apiService = inject(ItemApiService);
  private stateService = inject(ItemStateService);
  private transformationService = inject(ItemTransformationService);

  // Expose state through computed properties to avoid boilerplate
  // This addresses the state exposure challenge
  readonly items = this.stateService.items;
  readonly selectedItem = this.stateService.selectedItem;
  readonly loading = this.stateService.loading;
  readonly error = this.stateService.error;
  readonly itemCount = this.stateService.itemCount;
  readonly hasItems = this.stateService.hasItems;
  readonly hasError = this.stateService.hasError;
  readonly isItemSelected = this.stateService.isItemSelected;

  // Computed business logic using transformations
  readonly totalInventoryValue = computed(() => 
    this.transformationService.calculateTotalValue(this.items())
  );
  readonly lowStockItems = computed(() => 
    this.transformationService.getLowStockItems(this.items())
  );
  readonly hasLowStockItems = computed(() => this.lowStockItems().length > 0);

  // Sort and filter capabilities
  readonly sortedItems = computed(() => {
    // Default sort by name
    return this.transformationService.sortItems(this.items(), 'name', 'asc');
  });

  // Business actions orchestrated through this service

  loadItems(): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();

    this.apiService
      .getItems()
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to load items';
          this.stateService.setError(errorMessage);
          return of([]);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiItems) => {
        const items = this.transformationService.transformApiItemsToItems(apiItems);
        this.stateService.setItems(items);
      });
  }

  loadItem(id: string): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();

    this.apiService
      .getItem(id)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || `Failed to load item ${id}`;
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiItem) => {
        if (apiItem) {
          const item = this.transformationService.transformApiItemToItem(apiItem);
          this.stateService.selectItem(item);
        }
      });
  }

  createItem(request: CreateItemRequest): void {
    // Validate data using transformation service
    const validationErrors = this.transformationService.validateItemData(request);
    if (validationErrors.length > 0) {
      this.stateService.setError(validationErrors.join(', '));
      return;
    }

    this.stateService.setLoading(true);
    this.stateService.clearError();

    const apiRequest = this.transformationService.transformCreateRequestToApiRequest(request);

    this.apiService
      .createItem(apiRequest)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to create item';
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiItem) => {
        if (apiItem) {
          const item = this.transformationService.transformApiItemToItem(apiItem);
          this.stateService.addItem(item);
        }
      });
  }

  updateItem(request: UpdateItemRequest): void {
    // Validate data using transformation service
    const validationErrors = this.transformationService.validateItemData(request);
    if (validationErrors.length > 0) {
      this.stateService.setError(validationErrors.join(', '));
      return;
    }

    this.stateService.setLoading(true);
    this.stateService.clearError();

    const apiRequest = this.transformationService.transformUpdateRequestToApiRequest(request);

    this.apiService
      .updateItem(request.id, apiRequest)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to update item';
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiItem) => {
        if (apiItem) {
          const item = this.transformationService.transformApiItemToItem(apiItem);
          this.stateService.updateItem(item);
        }
      });
  }

  deleteItem(id: string): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();

    this.apiService
      .deleteItem(id)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to delete item';
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe(() => {
        this.stateService.removeItem(id);
      });
  }

  selectItem(itemId: string | null): void {
    if (!itemId) {
      this.stateService.selectItem(null);
      return;
    }

    const item = this.items().find((i) => i.id === itemId);
    this.stateService.selectItem(item || null);
  }

  clearSelection(): void {
    this.stateService.selectItem(null);
  }

  clearError(): void {
    this.stateService.clearError();
  }

  // Search and filter methods using transformation service
  searchItems(searchTerm: string, category?: string) {
    return computed(() => 
      this.transformationService.filterItems(this.items(), searchTerm, category)
    );
  }

  getSortedItems(sortBy: 'name' | 'price' | 'quantity' | 'createdAt', direction: 'asc' | 'desc') {
    return computed(() => 
      this.transformationService.sortItems(this.items(), sortBy, direction)
    );
  }

  reset(): void {
    this.stateService.reset();
  }
}