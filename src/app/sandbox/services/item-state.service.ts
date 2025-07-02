import { Injectable, signal, computed } from '@angular/core';
import { Item } from '../models';

@Injectable()
export class ItemStateService {
  // Private signals for state management
  private _items = signal<Item[]>([]);
  private _selectedItem = signal<Item | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public readonly computed signals
  readonly items = this._items.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed derived state
  readonly itemCount = computed(() => this._items().length);
  readonly hasItems = computed(() => this._items().length > 0);
  readonly hasError = computed(() => this._error() !== null);
  readonly isItemSelected = computed(() => this._selectedItem() !== null);

  // Computed filtered/sorted data
  readonly itemsByCategory = computed(() => {
    const items = this._items();
    const categories = [...new Set(items.map((item) => item.category))];
    return categories.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }));
  });

  // State update methods
  setItems(items: Item[]): void {
    this._items.set(items);
  }

  addItem(item: Item): void {
    this._items.update((current) => [...current, item]);
  }

  updateItem(updatedItem: Item): void {
    this._items.update((current) =>
      current.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    // Update selected item if it's the one being updated
    if (this._selectedItem()?.id === updatedItem.id) {
      this._selectedItem.set(updatedItem);
    }
  }

  removeItem(itemId: string): void {
    this._items.update((current) => current.filter((item) => item.id !== itemId));
    // Clear selection if the selected item is being removed
    if (this._selectedItem()?.id === itemId) {
      this._selectedItem.set(null);
    }
  }

  selectItem(item: Item | null): void {
    this._selectedItem.set(item);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  reset(): void {
    this._items.set([]);
    this._selectedItem.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}