import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item } from '../../../sandbox/models';

// Dumb component - receives data via @Input, emits events via @Output
@Component({
  selector: 'app-item-list',
  imports: [CommonModule],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  @Input() items: Item[] = [];
  @Input() loading = false;
  @Input() selectedItemId: string | null = null;

  @Output() itemSelected = new EventEmitter<Item>();
  @Output() itemDeleted = new EventEmitter<string>();
  @Output() itemEdited = new EventEmitter<Item>();

  onSelectItem(item: Item): void {
    this.itemSelected.emit(item);
  }

  onDeleteItem(itemId: string): void {
    this.itemDeleted.emit(itemId);
  }

  onEditItem(item: Item): void {
    this.itemEdited.emit(item);
  }
}
