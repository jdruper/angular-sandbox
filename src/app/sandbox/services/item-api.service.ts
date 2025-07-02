import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { ApiItem, ApiCreateItemRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ItemApiService {
  // Mock data storage (simulating API database)
  private mockItems: ApiItem[] = [
    {
      id: '1',
      name: 'Laptop',
      description: 'High-performance laptop for development',
      category: 'Electronics',
      quantity: 5,
      price: 1299.99,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Office Chair',
      description: 'Ergonomic office chair',
      category: 'Furniture',
      quantity: 12,
      price: 299.99,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      name: 'Wireless Mouse',
      description: 'Bluetooth wireless mouse',
      category: 'Electronics',
      quantity: 25,
      price: 49.99,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
  ];

  // HTTP operations only - no business logic
  getItems(): Observable<ApiItem[]> {
    return of([...this.mockItems]).pipe(delay(500));
  }

  getItem(id: string): Observable<ApiItem> {
    const item = this.mockItems.find((i) => i.id === id);
    if (!item) {
      return throwError(() => ({ error: 'Item not found', status: 404 }));
    }
    return of({ ...item }).pipe(delay(300));
  }

  createItem(request: ApiCreateItemRequest): Observable<ApiItem> {
    const newItem: ApiItem = {
      ...request,
      id: (this.mockItems.length + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockItems.push(newItem);
    return of({ ...newItem }).pipe(delay(400));
  }

  updateItem(id: string, request: Partial<ApiCreateItemRequest>): Observable<ApiItem> {
    const index = this.mockItems.findIndex((i) => i.id === id);
    if (index === -1) {
      return throwError(() => ({ error: 'Item not found', status: 404 }));
    }

    const updatedItem: ApiItem = {
      ...this.mockItems[index],
      ...request,
      updated_at: new Date().toISOString(),
    };
    this.mockItems[index] = updatedItem;
    return of({ ...updatedItem }).pipe(delay(400));
  }

  deleteItem(id: string): Observable<void> {
    const index = this.mockItems.findIndex((i) => i.id === id);
    if (index === -1) {
      return throwError(() => ({ error: 'Item not found', status: 404 }));
    }

    this.mockItems.splice(index, 1);
    return of(void 0).pipe(delay(300));
  }
}