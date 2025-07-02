import { TestBed } from '@angular/core/testing';
import { ItemStateService } from './item-state.service';
import { Item } from '../models';

describe('ItemStateService', () => {
  let service: ItemStateService;

  const mockItem1: Item = {
    id: '1',
    name: 'Laptop',
    description: 'Gaming laptop',
    category: 'Electronics',
    quantity: 10,
    price: 999.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockItem2: Item = {
    id: '2',
    name: 'Mouse',
    description: 'Wireless mouse',
    category: 'Electronics',
    quantity: 25,
    price: 49.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(service.items()).toEqual([]);
      expect(service.selectedItem()).toBeNull();
      expect(service.loading()).toBeFalsy();
      expect(service.error()).toBeNull();
      expect(service.itemCount()).toBe(0);
      expect(service.hasItems()).toBeFalsy();
      expect(service.hasError()).toBeFalsy();
      expect(service.isItemSelected()).toBeFalsy();
    });
  });

  describe('setItems', () => {
    it('should set items', () => {
      const items = [mockItem1, mockItem2];
      service.setItems(items);

      expect(service.items()).toEqual(items);
      expect(service.itemCount()).toBe(2);
      expect(service.hasItems()).toBeTruthy();
    });

    it('should update computed properties', () => {
      service.setItems([mockItem1, mockItem2]);

      const itemsByCategory = service.itemsByCategory();
      expect(itemsByCategory).toEqual([
        {
          category: 'Electronics',
          items: [mockItem1, mockItem2],
        },
      ]);
    });
  });

  describe('addItem', () => {
    it('should add item to existing items', () => {
      service.setItems([mockItem1]);
      service.addItem(mockItem2);

      expect(service.items()).toEqual([mockItem1, mockItem2]);
      expect(service.itemCount()).toBe(2);
    });

    it('should add item to empty list', () => {
      service.addItem(mockItem1);

      expect(service.items()).toEqual([mockItem1]);
      expect(service.itemCount()).toBe(1);
      expect(service.hasItems()).toBeTruthy();
    });
  });

  describe('updateItem', () => {
    beforeEach(() => {
      service.setItems([mockItem1, mockItem2]);
    });

    it('should update existing item', () => {
      const updatedItem = { ...mockItem1, name: 'Updated Laptop' };
      service.updateItem(updatedItem);

      const items = service.items();
      expect(items[0].name).toBe('Updated Laptop');
      expect(items[1]).toEqual(mockItem2);
    });

    it('should update selected item if it matches', () => {
      service.selectItem(mockItem1);
      const updatedItem = { ...mockItem1, name: 'Updated Laptop' };
      service.updateItem(updatedItem);

      expect(service.selectedItem()?.name).toBe('Updated Laptop');
    });

    it('should not affect selected item if different', () => {
      service.selectItem(mockItem1);
      const updatedItem = { ...mockItem2, name: 'Updated Mouse' };
      service.updateItem(updatedItem);

      expect(service.selectedItem()).toEqual(mockItem1);
    });

    it('should not modify items if id not found', () => {
      const nonExistentItem = { ...mockItem1, id: '999' };
      service.updateItem(nonExistentItem);

      expect(service.items()).toEqual([mockItem1, mockItem2]);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      service.setItems([mockItem1, mockItem2]);
    });

    it('should remove item by id', () => {
      service.removeItem('1');

      expect(service.items()).toEqual([mockItem2]);
      expect(service.itemCount()).toBe(1);
    });

    it('should clear selection if selected item is removed', () => {
      service.selectItem(mockItem1);
      service.removeItem('1');

      expect(service.selectedItem()).toBeNull();
      expect(service.isItemSelected()).toBeFalsy();
    });

    it('should not affect selection if different item is removed', () => {
      service.selectItem(mockItem1);
      service.removeItem('2');

      expect(service.selectedItem()).toEqual(mockItem1);
    });

    it('should handle non-existent id gracefully', () => {
      service.removeItem('999');

      expect(service.items()).toEqual([mockItem1, mockItem2]);
    });
  });

  describe('selectItem', () => {
    it('should select an item', () => {
      service.selectItem(mockItem1);

      expect(service.selectedItem()).toEqual(mockItem1);
      expect(service.isItemSelected()).toBeTruthy();
    });

    it('should clear selection when null is passed', () => {
      service.selectItem(mockItem1);
      service.selectItem(null);

      expect(service.selectedItem()).toBeNull();
      expect(service.isItemSelected()).toBeFalsy();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      service.setLoading(true);
      expect(service.loading()).toBeTruthy();

      service.setLoading(false);
      expect(service.loading()).toBeFalsy();
    });
  });

  describe('error state', () => {
    it('should set error state', () => {
      service.setError('Something went wrong');

      expect(service.error()).toBe('Something went wrong');
      expect(service.hasError()).toBeTruthy();
    });

    it('should clear error', () => {
      service.setError('Error message');
      service.clearError();

      expect(service.error()).toBeNull();
      expect(service.hasError()).toBeFalsy();
    });

    it('should set error to null', () => {
      service.setError(null);

      expect(service.error()).toBeNull();
      expect(service.hasError()).toBeFalsy();
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      const electronicsItem1 = { ...mockItem1, category: 'Electronics' };
      const electronicsItem2 = { ...mockItem2, category: 'Electronics' };
      const booksItem = { ...mockItem1, id: '3', name: 'Book', category: 'Books' };

      service.setItems([electronicsItem1, electronicsItem2, booksItem]);
    });

    it('should compute itemsByCategory correctly', () => {
      const itemsByCategory = service.itemsByCategory();

      expect(itemsByCategory.length).toBe(2);
      expect(itemsByCategory[0].category).toBe('Electronics');
      expect(itemsByCategory[0].items.length).toBe(2);
      expect(itemsByCategory[1].category).toBe('Books');
      expect(itemsByCategory[1].items.length).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      service.setItems([mockItem1, mockItem2]);
      service.selectItem(mockItem1);
      service.setLoading(true);
      service.setError('Some error');

      // Reset
      service.reset();

      // Verify all state is reset
      expect(service.items()).toEqual([]);
      expect(service.selectedItem()).toBeNull();
      expect(service.loading()).toBeFalsy();
      expect(service.error()).toBeNull();
      expect(service.itemCount()).toBe(0);
      expect(service.hasItems()).toBeFalsy();
      expect(service.hasError()).toBeFalsy();
      expect(service.isItemSelected()).toBeFalsy();
    });
  });

  describe('signal reactivity', () => {
    it('should update computed signals when items change', () => {
      expect(service.hasItems()).toBeFalsy();
      expect(service.itemCount()).toBe(0);

      service.addItem(mockItem1);

      expect(service.hasItems()).toBeTruthy();
      expect(service.itemCount()).toBe(1);
    });

    it('should update computed signals when selection changes', () => {
      expect(service.isItemSelected()).toBeFalsy();

      service.selectItem(mockItem1);

      expect(service.isItemSelected()).toBeTruthy();
    });
  });
});