import { Injectable } from '@angular/core';
import {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ApiItem,
  ApiCreateItemRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ItemTransformationService {
  /**
   * Transform API item to domain item model
   */
  transformApiItemToItem(apiItem: ApiItem): Item {
    return {
      id: apiItem.id,
      name: apiItem.name,
      description: apiItem.description,
      category: apiItem.category,
      quantity: apiItem.quantity,
      price: apiItem.price,
      createdAt: new Date(apiItem.created_at),
      updatedAt: new Date(apiItem.updated_at),
    };
  }

  /**
   * Transform array of API items to domain items
   */
  transformApiItemsToItems(apiItems: ApiItem[]): Item[] {
    return apiItems.map((apiItem) => this.transformApiItemToItem(apiItem));
  }

  /**
   * Transform domain create request to API create request
   */
  transformCreateRequestToApiRequest(request: CreateItemRequest): ApiCreateItemRequest {
    return {
      name: request.name,
      description: request.description,
      category: request.category,
      quantity: request.quantity,
      price: request.price,
    };
  }

  /**
   * Transform domain update request to API update request
   */
  transformUpdateRequestToApiRequest(request: UpdateItemRequest): Partial<ApiCreateItemRequest> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateFields } = request;
    return updateFields;
  }

  /**
   * Calculate total inventory value
   */
  calculateTotalValue(items: Item[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  /**
   * Calculate low stock items (quantity < threshold)
   */
  getLowStockItems(items: Item[], threshold = 5): Item[] {
    return items.filter((item) => item.quantity < threshold);
  }

  /**
   * Group items by category
   */
  groupItemsByCategory(items: Item[]): Record<string, Item[]> {
    return items.reduce(
      (groups, item) => {
        const category = item.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      },
      {} as Record<string, Item[]>
    );
  }

  /**
   * Sort items by various criteria
   */
  sortItems(
    items: Item[],
    sortBy: 'name' | 'price' | 'quantity' | 'createdAt',
    direction: 'asc' | 'desc' = 'asc'
  ): Item[] {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Filter items by search criteria
   */
  filterItems(items: Item[], searchTerm: string, category?: string): Item[] {
    let filtered = items;

    // Filter by search term (name or description)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter((item) => item.category === category);
    }

    return filtered;
  }

  /**
   * Validate item data
   */
  validateItemData(item: CreateItemRequest | UpdateItemRequest): string[] {
    const errors: string[] = [];

    if (!item.name?.trim()) {
      errors.push('Name is required');
    }

    if (!item.description?.trim()) {
      errors.push('Description is required');
    }

    if (!item.category?.trim()) {
      errors.push('Category is required');
    }

    if (item.quantity !== undefined && item.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }

    if (item.price !== undefined && item.price < 0) {
      errors.push('Price cannot be negative');
    }

    return errors;
  }
}