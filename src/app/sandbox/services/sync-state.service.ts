import { Injectable, signal, computed } from '@angular/core';
import { SyncStatus, SyncOperation, SyncInfo, ConflictInfo } from '../models';

/**
 * Service responsible for managing synchronization state in the application.
 * This service tracks sync operations, errors, conflicts, and pending records.
 * 
 * Key responsibilities:
 * - Track synchronization status and operations
 * - Manage sync errors and conflict resolution
 * - Count pending records awaiting synchronization
 * - Provide reactive sync state for UI components
 * 
 * @example
 * ```typescript
 * // Monitor sync status
 * const isSyncing = this.syncStateService.isSyncing();
 * const syncError = this.syncStateService.syncError();
 * 
 * // Update sync state
 * this.syncStateService.setSyncStatus('syncing');
 * this.syncStateService.setCurrentOperation('create', 'audit-123');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SyncStateService {
  // ==========================================================================
  // PRIVATE STATE SIGNALS
  // ==========================================================================

  /** Current synchronization status */
  private readonly _syncStatus = signal<SyncStatus>('idle');
  
  /** Currently executing sync operation */
  private readonly _currentOperation = signal<SyncOperation | null>(null);
  
  /** ID of item being processed in current operation */
  private readonly _currentItemId = signal<string | null>(null);
  
  /** Timestamp of last successful synchronization */
  private readonly _lastSyncTime = signal<Date | null>(null);
  
  /** Current synchronization error message */
  private readonly _syncError = signal<string | null>(null);
  
  /** Number of records pending synchronization */
  private readonly _pendingRecordsCount = signal<number>(0);
  
  /** Collection of unresolved data conflicts */
  private readonly _conflicts = signal<ConflictInfo[]>([]);

  // ==========================================================================
  // PUBLIC READONLY SIGNALS - Exposed for component consumption
  // ==========================================================================

  /** Observable sync status */
  readonly syncStatus = this._syncStatus.asReadonly();
  
  /** Observable current operation */
  readonly currentOperation = this._currentOperation.asReadonly();
  
  /** Observable current item ID */
  readonly currentItemId = this._currentItemId.asReadonly();
  
  /** Observable last sync time */
  readonly lastSyncTime = this._lastSyncTime.asReadonly();
  
  /** Observable sync error */
  readonly syncError = this._syncError.asReadonly();
  
  /** Observable pending records count */
  readonly pendingRecordsCount = this._pendingRecordsCount.asReadonly();
  
  /** Observable conflicts collection */
  readonly conflicts = this._conflicts.asReadonly();

  // ==========================================================================
  // COMPUTED DERIVED STATE
  // ==========================================================================

  /** Whether synchronization is currently in progress */
  readonly isSyncing = computed(() => this._syncStatus() === 'syncing');
  
  /** Whether a sync error is present */
  readonly hasError = computed(() => this._syncError() !== null);
  
  /** Whether there are records pending synchronization */
  readonly hasPendingRecords = computed(() => this._pendingRecordsCount() > 0);
  
  /** Whether there are unresolved conflicts */
  readonly hasConflicts = computed(() => this._conflicts().length > 0);
  
  /** Whether synchronization can be initiated */
  readonly canSync = computed(() => !this.isSyncing() && !this.hasError());

  // Computed sync info
  readonly syncInfo = computed<SyncInfo>(() => ({
    status: this._syncStatus(),
    operation: this._currentOperation(),
    itemId: this._currentItemId(),
    error: this._syncError(),
    timestamp: this._lastSyncTime()
  }));

  // ==========================================================================
  // STATE MUTATION METHODS
  // ==========================================================================

  /**
   * Set the current synchronization status.
   * Automatically clears errors and updates timestamp on success.
   * 
   * @param status - The new sync status
   * 
   * @example
   * ```typescript
   * this.syncStateService.setSyncStatus('syncing');
   * this.syncStateService.setSyncStatus('success');
   * ```
   */
  setSyncStatus(status: SyncStatus): void {
    this._syncStatus.set(status);
    if (status === 'success') {
      this._lastSyncTime.set(new Date());
      this._syncError.set(null);
    }
  }

  /**
   * Set the currently executing sync operation.
   * 
   * @param operation - The sync operation being performed
   * @param itemId - Optional ID of the item being processed
   * 
   * @example
   * ```typescript
   * this.syncStateService.setCurrentOperation('create', 'audit-123');
   * this.syncStateService.setCurrentOperation(null); // Clear operation
   * ```
   */
  setCurrentOperation(operation: SyncOperation | null, itemId: string | null = null): void {
    this._currentOperation.set(operation);
    this._currentItemId.set(itemId);
  }

  /**
   * Set a synchronization error message.
   * Automatically sets sync status to 'error' when an error is provided.
   * 
   * @param error - Error message or null to clear error
   * 
   * @example
   * ```typescript
   * this.syncStateService.setSyncError('Network connection failed');
   * this.syncStateService.setSyncError(null); // Clear error
   * ```
   */
  setSyncError(error: string | null): void {
    this._syncError.set(error);
    if (error) {
      this._syncStatus.set('error');
    }
  }

  /**
   * Clear any existing sync error.
   * Resets status to 'idle' if currently in error state.
   * 
   * @example
   * ```typescript
   * this.syncStateService.clearSyncError();
   * ```
   */
  clearSyncError(): void {
    this._syncError.set(null);
    if (this._syncStatus() === 'error') {
      this._syncStatus.set('idle');
    }
  }

  /**
   * Set the number of records pending synchronization.
   * 
   * @param count - Number of pending records
   * 
   * @example
   * ```typescript
   * this.syncStateService.setPendingRecordsCount(5);
   * ```
   */
  setPendingRecordsCount(count: number): void {
    this._pendingRecordsCount.set(Math.max(0, count)); // Ensure non-negative
  }

  /**
   * Add or update a data conflict.
   * 
   * @param itemId - ID of the item with conflict
   * @param localModified - Local modification timestamp
   * @param serverModified - Server modification timestamp
   * 
   * @example
   * ```typescript
   * this.syncStateService.addConflict('audit-123', localTime, serverTime);
   * ```
   */
  addConflict(itemId: string, localModified: number, serverModified: number): void {
    const conflict: ConflictInfo = {
      itemId,
      localModified,
      serverModified,
      resolved: false
    };
    
    this._conflicts.update(conflicts => {
      const existing = conflicts.find(c => c.itemId === itemId);
      if (existing) {
        return conflicts.map(c => c.itemId === itemId ? conflict : c);
      }
      return [...conflicts, conflict];
    });
  }

  /**
   * Remove a conflict from the collection.
   * 
   * @param itemId - ID of the item to remove conflict for
   * 
   * @example
   * ```typescript
   * this.syncStateService.removeConflict('audit-123');
   * ```
   */
  removeConflict(itemId: string): void {
    this._conflicts.update(conflicts => 
      conflicts.filter(c => c.itemId !== itemId)
    );
  }

  /**
   * Mark a conflict as resolved.
   * 
   * @param itemId - ID of the item whose conflict is resolved
   * 
   * @example
   * ```typescript
   * this.syncStateService.markConflictResolved('audit-123');
   * ```
   */
  markConflictResolved(itemId: string): void {
    this._conflicts.update(conflicts =>
      conflicts.map(c => 
        c.itemId === itemId ? { ...c, resolved: true } : c
      )
    );
  }

  /**
   * Clear all conflicts from the collection.
   * 
   * @example
   * ```typescript
   * this.syncStateService.clearConflicts();
   * ```
   */
  clearConflicts(): void {
    this._conflicts.set([]);
  }

  /**
   * Update the last successful synchronization timestamp.
   * 
   * @example
   * ```typescript
   * this.syncStateService.updateLastSyncTime();
   * ```
   */
  updateLastSyncTime(): void {
    this._lastSyncTime.set(new Date());
  }

  /**
   * Reset all synchronization state to initial values.
   * 
   * @example
   * ```typescript
   * this.syncStateService.reset();
   * ```
   */
  reset(): void {
    this._syncStatus.set('idle');
    this._currentOperation.set(null);
    this._currentItemId.set(null);
    this._lastSyncTime.set(null);
    this._syncError.set(null);
    this._pendingRecordsCount.set(0);
    this._conflicts.set([]);
  }
}