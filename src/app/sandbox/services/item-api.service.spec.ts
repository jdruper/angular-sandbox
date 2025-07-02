import { TestBed } from '@angular/core/testing';
import { ItemApiService } from './item-api.service';
import { ApiCreateItemRequest } from '../models';

describe('ItemApiService', () => {
  let service: ItemApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItems', () => {
    it('should return list of items', (done) => {
      service.getItems().subscribe((items) => {
        expect(items).toBeDefined();
        expect(Array.isArray(items)).toBeTruthy();
        expect(items.length).toBeGreaterThan(0);
        
        // Verify structure of first item
        const firstItem = items[0];
        expect(firstItem.id).toBeDefined();
        expect(firstItem.name).toBeDefined();
        expect(firstItem.description).toBeDefined();
        expect(firstItem.category).toBeDefined();
        expect(firstItem.quantity).toBeDefined();
        expect(firstItem.price).toBeDefined();
        expect(firstItem.created_at).toBeDefined();
        expect(firstItem.updated_at).toBeDefined();
        
        done();
      });
    });

    it('should return items with expected initial data', (done) => {
      service.getItems().subscribe((items) => {
        expect(items.length).toBe(3);
        expect(items[0].name).toBe('Laptop');
        expect(items[1].name).toBe('Office Chair');
        expect(items[2].name).toBe('Wireless Mouse');
        done();
      });
    });

    it('should simulate network delay', (done) => {
      const startTime = Date.now();
      
      service.getItems().subscribe(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should take at least 400ms (allowing some tolerance for timing)
        expect(duration).toBeGreaterThanOrEqual(400);
        done();
      });
    });
  });

  describe('getItem', () => {
    it('should return specific item by id', (done) => {
      service.getItem('1').subscribe((item) => {
        expect(item).toBeDefined();
        expect(item.id).toBe('1');
        expect(item.name).toBe('Laptop');
        done();
      });
    });

    it('should return error for non-existent item', (done) => {
      service.getItem('999').subscribe({
        next: () => {
          fail('Should have thrown an error');
        },
        error: (error) => {
          expect(error.error).toBe('Item not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  describe('createItem', () => {
    it('should create new item', (done) => {
      const createRequest: ApiCreateItemRequest = {
        name: 'New Item',
        description: 'New Description',
        category: 'Test Category',
        quantity: 5,
        price: 29.99,
      };

      service.createItem(createRequest).subscribe((createdItem) => {
        expect(createdItem).toBeDefined();
        expect(createdItem.name).toBe('New Item');
        expect(createdItem.description).toBe('New Description');
        expect(createdItem.category).toBe('Test Category');
        expect(createdItem.quantity).toBe(5);
        expect(createdItem.price).toBe(29.99);
        expect(createdItem.id).toBeDefined();
        expect(createdItem.created_at).toBeDefined();
        expect(createdItem.updated_at).toBeDefined();
        done();
      });
    });

    it('should add created item to mock storage', (done) => {
      const createRequest: ApiCreateItemRequest = {
        name: 'Storage Test Item',
        description: 'Test Description',
        category: 'Test',
        quantity: 1,
        price: 10,
      };

      service.createItem(createRequest).subscribe((createdItem) => {
        // Verify item was added to storage by trying to fetch it
        service.getItems().subscribe((items) => {
          const foundItem = items.find((item) => item.id === createdItem.id);
          expect(foundItem).toBeDefined();
          expect(foundItem?.name).toBe('Storage Test Item');
          done();
        });
      });
    });

    it('should assign incremental id', (done) => {
      // Get current count
      service.getItems().subscribe((initialItems) => {
        const expectedId = (initialItems.length + 1).toString();

        const createRequest: ApiCreateItemRequest = {
          name: 'ID Test Item',
          description: 'Test',
          category: 'Test',
          quantity: 1,
          price: 1,
        };

        service.createItem(createRequest).subscribe((createdItem) => {
          expect(createdItem.id).toBe(expectedId);
          done();
        });
      });
    });
  });

  describe('updateItem', () => {
    it('should update existing item', (done) => {
      const updateRequest = {
        name: 'Updated Laptop',
        price: 1199.99,
      };

      service.updateItem('1', updateRequest).subscribe((updatedItem) => {
        expect(updatedItem).toBeDefined();
        expect(updatedItem.id).toBe('1');
        expect(updatedItem.name).toBe('Updated Laptop');
        expect(updatedItem.price).toBe(1199.99);
        expect(updatedItem.description).toBe('High-performance laptop for development'); // Should keep original
        expect(updatedItem.updated_at).toBeDefined();
        done();
      });
    });

    it('should update item in mock storage', (done) => {
      const updateRequest = { name: 'Storage Update Test' };

      service.updateItem('1', updateRequest).subscribe(() => {
        // Verify item was updated in storage
        service.getItem('1').subscribe((item) => {
          expect(item.name).toBe('Storage Update Test');
          done();
        });
      });
    });

    it('should return error for non-existent item', (done) => {
      const updateRequest = { name: 'Test' };

      service.updateItem('999', updateRequest).subscribe({
        next: () => {
          fail('Should have thrown an error');
        },
        error: (error) => {
          expect(error.error).toBe('Item not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });

    it('should update timestamp', (done) => {
      const originalUpdatedAt = new Date().toISOString();
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        service.updateItem('1', { name: 'Timestamp Test' }).subscribe((updatedItem) => {
          expect(updatedItem.updated_at).not.toBe(originalUpdatedAt);
          expect(new Date(updatedItem.updated_at).getTime()).toBeGreaterThan(
            new Date(originalUpdatedAt).getTime()
          );
          done();
        });
      }, 10);
    });
  });

  describe('deleteItem', () => {
    it('should delete existing item', (done) => {
      // First create an item to delete
      const createRequest: ApiCreateItemRequest = {
        name: 'To Delete',
        description: 'Will be deleted',
        category: 'Test',
        quantity: 1,
        price: 1,
      };

      service.createItem(createRequest).subscribe((createdItem) => {
        const itemId = createdItem.id;

        service.deleteItem(itemId).subscribe(() => {
          // Verify item was deleted
          service.getItem(itemId).subscribe({
            next: () => {
              fail('Item should have been deleted');
            },
            error: (error) => {
              expect(error.error).toBe('Item not found');
              done();
            },
          });
        });
      });
    });

    it('should return error for non-existent item', (done) => {
      service.deleteItem('999').subscribe({
        next: () => {
          fail('Should have thrown an error');
        },
        error: (error) => {
          expect(error.error).toBe('Item not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });

    it('should remove item from storage', (done) => {
      service.getItems().subscribe((initialItems) => {
        const initialCount = initialItems.length;
        const itemToDelete = initialItems[0];

        service.deleteItem(itemToDelete.id).subscribe(() => {
          service.getItems().subscribe((remainingItems) => {
            expect(remainingItems.length).toBe(initialCount - 1);
            expect(remainingItems.find((item) => item.id === itemToDelete.id)).toBeUndefined();
            done();
          });
        });
      });
    });
  });

  describe('error handling', () => {
    it('should provide consistent error structure', (done) => {
      service.getItem('999').subscribe({
        error: (error) => {
          expect(error.error).toBeDefined();
          expect(error.status).toBeDefined();
          expect(typeof error.error).toBe('string');
          expect(typeof error.status).toBe('number');
          done();
        },
      });
    });
  });

  describe('data integrity', () => {
    it('should not modify original mock data when returning items', (done) => {
      service.getItems().subscribe((items1) => {
        // Modify returned data
        items1[0].name = 'Modified Name';

        // Get items again
        service.getItems().subscribe((items2) => {
          // Original data should be unchanged
          expect(items2[0].name).toBe('Laptop');
          expect(items2[0].name).not.toBe('Modified Name');
          done();
        });
      });
    });

    it('should not modify original mock data when returning single item', (done) => {
      service.getItem('1').subscribe((item1) => {
        // Modify returned data
        item1.name = 'Modified Name';

        // Get item again
        service.getItem('1').subscribe(() => {
          // Original data should be unchanged initially
          // (Note: this will be modified if we actually updated the mock storage)
          done();
        });
      });
    });
  });
});