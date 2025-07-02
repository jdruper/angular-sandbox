import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Item, CreateItemRequest, UpdateItemRequest } from '../../sandbox/models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private items: Item[] = [
    {
      id: '1',
      name: 'Laptop',
      description: 'High-performance laptop for development',
      category: 'Electronics',
      quantity: 5,
      price: 1299.99,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Office Chair',
      description: 'Ergonomic office chair',
      category: 'Furniture',
      quantity: 12,
      price: 299.99,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      name: 'Wireless Mouse',
      description: 'Bluetooth wireless mouse',
      category: 'Electronics',
      quantity: 25,
      price: 49.99,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  getItems(): Observable<Item[]> {
    return of([...this.items]).pipe(delay(500));
  }

  getItem(id: string): Observable<Item> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      return throwError(() => new Error(`Item with id ${id} not found`));
    }
    return of({ ...item }).pipe(delay(300));
  }

  createItem(request: CreateItemRequest): Observable<Item> {
    const newItem: Item = {
      ...request,
      id: (this.items.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(newItem);
    return of({ ...newItem }).pipe(delay(400));
  }

  updateItem(request: UpdateItemRequest): Observable<Item> {
    const index = this.items.findIndex((i) => i.id === request.id);
    if (index === -1) {
      return throwError(() => new Error(`Item with id ${request.id} not found`));
    }

    const updatedItem: Item = {
      ...this.items[index],
      ...request,
      updatedAt: new Date(),
    };
    this.items[index] = updatedItem;
    return of({ ...updatedItem }).pipe(delay(400));
  }

  deleteItem(id: string): Observable<void> {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Item with id ${id} not found`));
    }

    this.items.splice(index, 1);
    return of(void 0).pipe(delay(300));
  }
}