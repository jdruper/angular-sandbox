import { TestBed } from '@angular/core/testing';
import { ItemTransformationService } from './item-transformation.service';
import { Item, CreateItemRequest, UpdateItemRequest, ApiItem } from '../models';

describe('ItemTransformationService', () => {
  let service: ItemTransformationService;

  const mockApiItem: ApiItem = {
    id: '1',
    name: 'Test Item',
    description: 'Test Description',
    category: 'Electronics',
    quantity: 10,
    price: 99.99,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockItem: Item = {
    id: '1',
    name: 'Test Item',
    description: 'Test Description',
    category: 'Electronics',
    quantity: 10,
    price: 99.99,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemTransformationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('transformApiItemToItem', () => {
    it('should transform API item to domain item', () => {
      const result = service.transformApiItemToItem(mockApiItem);

      expect(result).toEqual(mockItem);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('transformApiItemsToItems', () => {
    it('should transform array of API items to domain items', () => {
      const apiItems = [mockApiItem, { ...mockApiItem, id: '2', name: 'Item 2' }];
      const result = service.transformApiItemsToItems(apiItems);

      expect(result.length).toBe(2);
      expect(result[0]).toEqual(mockItem);
      expect(result[1].id).toBe('2');
      expect(result[1].name).toBe('Item 2');
    });

    it('should handle empty array', () => {
      const result = service.transformApiItemsToItems([]);
      expect(result).toEqual([]);
    });
  });

  describe('transformCreateRequestToApiRequest', () => {
    it('should transform create request to API request', () => {
      const createRequest: CreateItemRequest = {
        name: 'New Item',
        description: 'New Description',
        category: 'Books',
        quantity: 5,
        price: 29.99,
      };

      const result = service.transformCreateRequestToApiRequest(createRequest);

      expect(result).toEqual({
        name: 'New Item',
        description: 'New Description',
        category: 'Books',
        quantity: 5,
        price: 29.99,
      });
    });
  });

  describe('transformUpdateRequestToApiRequest', () => {
    it('should transform update request to API request, excluding id', () => {
      const updateRequest: UpdateItemRequest = {
        id: '1',
        name: 'Updated Item',
        price: 39.99,
      };

      const result = service.transformUpdateRequestToApiRequest(updateRequest);

      expect(result).toEqual({
        name: 'Updated Item',
        price: 39.99,
      });
      expect(Object.prototype.hasOwnProperty.call(result, 'id')).toBeFalsy();
    });
  });

  describe('calculateTotalValue', () => {
    it('should calculate total inventory value', () => {
      const items: Item[] = [
        { ...mockItem, quantity: 10, price: 100 },
        { ...mockItem, id: '2', quantity: 5, price: 50 },
      ];

      const result = service.calculateTotalValue(items);
      expect(result).toBe(1250); // (10 * 100) + (5 * 50)
    });

    it('should return 0 for empty array', () => {
      const result = service.calculateTotalValue([]);
      expect(result).toBe(0);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items with quantity below threshold', () => {
      const items: Item[] = [
        { ...mockItem, id: '1', quantity: 3 },
        { ...mockItem, id: '2', quantity: 10 },
        { ...mockItem, id: '3', quantity: 1 },
      ];

      const result = service.getLowStockItems(items, 5);
      expect(result.length).toBe(2);
      expect(result.map((item) => item.id)).toEqual(['1', '3']);
    });

    it('should use default threshold of 5', () => {
      const items: Item[] = [
        { ...mockItem, id: '1', quantity: 3 },
        { ...mockItem, id: '2', quantity: 10 },
      ];

      const result = service.getLowStockItems(items);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('groupItemsByCategory', () => {
    it('should group items by category', () => {
      const items: Item[] = [
        { ...mockItem, id: '1', category: 'Electronics' },
        { ...mockItem, id: '2', category: 'Books' },
        { ...mockItem, id: '3', category: 'Electronics' },
      ];

      const result = service.groupItemsByCategory(items);

      expect(result).toEqual({
        Electronics: [items[0], items[2]],
        Books: [items[1]],
      });
    });
  });

  describe('sortItems', () => {
    const items: Item[] = [
      { ...mockItem, id: '1', name: 'B Item', price: 100, quantity: 5 },
      { ...mockItem, id: '2', name: 'A Item', price: 50, quantity: 10 },
      { ...mockItem, id: '3', name: 'C Item', price: 200, quantity: 2 },
    ];

    it('should sort by name ascending', () => {
      const result = service.sortItems(items, 'name', 'asc');
      expect(result.map((item) => item.name)).toEqual(['A Item', 'B Item', 'C Item']);
    });

    it('should sort by name descending', () => {
      const result = service.sortItems(items, 'name', 'desc');
      expect(result.map((item) => item.name)).toEqual(['C Item', 'B Item', 'A Item']);
    });

    it('should sort by price ascending', () => {
      const result = service.sortItems(items, 'price', 'asc');
      expect(result.map((item) => item.price)).toEqual([50, 100, 200]);
    });

    it('should sort by quantity descending', () => {
      const result = service.sortItems(items, 'quantity', 'desc');
      expect(result.map((item) => item.quantity)).toEqual([10, 5, 2]);
    });

    it('should not modify original array', () => {
      const originalItems = [...items];
      service.sortItems(items, 'name', 'asc');
      expect(items).toEqual(originalItems);
    });
  });

  describe('filterItems', () => {
    const items: Item[] = [
      { ...mockItem, id: '1', name: 'Laptop', description: 'Gaming laptop', category: 'Electronics' },
      { ...mockItem, id: '2', name: 'Book', description: 'Programming book', category: 'Books' },
      { ...mockItem, id: '3', name: 'Mouse', description: 'Wireless mouse', category: 'Electronics' },
    ];

    it('should filter by search term in name', () => {
      const result = service.filterItems(items, 'laptop');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Laptop');
    });

    it('should filter by search term in description', () => {
      const result = service.filterItems(items, 'wireless');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Mouse');
    });

    it('should filter by category', () => {
      const result = service.filterItems(items, '', 'Electronics');
      expect(result.length).toBe(2);
      expect(result.map((item) => item.name)).toEqual(['Laptop', 'Mouse']);
    });

    it('should filter by both search term and category', () => {
      const result = service.filterItems(items, 'mouse', 'Electronics');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Mouse');
    });

    it('should return all items when no filters applied', () => {
      const result = service.filterItems(items, '', 'all');
      expect(result.length).toBe(3);
    });

    it('should be case insensitive', () => {
      const result = service.filterItems(items, 'LAPTOP');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Laptop');
    });
  });

  describe('validateItemData', () => {
    it('should return empty array for valid data', () => {
      const validItem: CreateItemRequest = {
        name: 'Valid Item',
        description: 'Valid Description',
        category: 'Valid Category',
        quantity: 10,
        price: 99.99,
      };

      const result = service.validateItemData(validItem);
      expect(result).toEqual([]);
    });

    it('should validate required name', () => {
      const invalidItem: CreateItemRequest = {
        name: '',
        description: 'Valid Description',
        category: 'Valid Category',
        quantity: 10,
        price: 99.99,
      };

      const result = service.validateItemData(invalidItem);
      expect(result).toContain('Name is required');
    });

    it('should validate required description', () => {
      const invalidItem: CreateItemRequest = {
        name: 'Valid Name',
        description: '   ',
        category: 'Valid Category',
        quantity: 10,
        price: 99.99,
      };

      const result = service.validateItemData(invalidItem);
      expect(result).toContain('Description is required');
    });

    it('should validate required category', () => {
      const invalidItem: CreateItemRequest = {
        name: 'Valid Name',
        description: 'Valid Description',
        category: '',
        quantity: 10,
        price: 99.99,
      };

      const result = service.validateItemData(invalidItem);
      expect(result).toContain('Category is required');
    });

    it('should validate negative quantity', () => {
      const invalidItem: CreateItemRequest = {
        name: 'Valid Name',
        description: 'Valid Description',
        category: 'Valid Category',
        quantity: -1,
        price: 99.99,
      };

      const result = service.validateItemData(invalidItem);
      expect(result).toContain('Quantity cannot be negative');
    });

    it('should validate negative price', () => {
      const invalidItem: CreateItemRequest = {
        name: 'Valid Name',
        description: 'Valid Description',
        category: 'Valid Category',
        quantity: 10,
        price: -5,
      };

      const result = service.validateItemData(invalidItem);
      expect(result).toContain('Price cannot be negative');
    });

    it('should return multiple errors for multiple issues', () => {
      const invalidItem: CreateItemRequest = {
        name: '',
        description: '',
        category: '',
        quantity: -1,
        price: -5,
      };

      const result = service.validateItemData(invalidItem);
      expect(result.length).toBe(5);
    });
  });
});