import { Injectable, inject, computed } from '@angular/core';
import { catchError, of, finalize, switchMap, map, lastValueFrom } from 'rxjs';
import { AuditApiService } from './audit-api.service';
import { AuditStateService } from './audit-state.service';
import { AuditTransformationService } from './audit-transformation.service';
import { AuditStorageService } from './audit-storage.service';
import { NetworkStatusService } from './network-status.service';
import { SyncStateService } from './sync-state.service';
import { AuditSyncService } from './audit-sync.service';
import { CreateAuditRequest, UpdateAuditRequest, ApiAuditRecord, OfflineAuditRecord } from '../models';

/**
 * Service responsible for coordinating audit operations across the application.
 * This service acts as a facade/orchestrator that combines multiple specialized services
 * to provide a unified interface for audit-related operations.
 * 
 * Key responsibilities:
 * - Orchestrate CRUD operations for audit records
 * - Manage offline-first data loading strategies
 * - Handle optimistic updates and conflict resolution
 * - Coordinate synchronization between local storage and server
 * - Provide reactive state management for audit operations
 * 
 * @example
 * ```typescript
 * // Load audits with offline-first strategy
 * this.auditActionService.loadAudits();
 * 
 * // Create new audit with optimistic update
 * this.auditActionService.createAudit({
 *   slotNumber: 'A-001',
 *   primaryBarcode: '12345',
 *   // ... other fields
 * });
 * ```
 */
@Injectable()
export class AuditActionService {
  private apiService = inject(AuditApiService);
  private stateService = inject(AuditStateService);
  private transformationService = inject(AuditTransformationService);
  private storageService = inject(AuditStorageService);
  private networkService = inject(NetworkStatusService);
  private syncStateService = inject(SyncStateService);
  private syncService = inject(AuditSyncService);

  // ==========================================================================
  // PUBLIC READONLY STATE - Exposed to components for reactive UI updates
  // ==========================================================================

  /** Core audit data state */
  readonly audits = this.stateService.audits;
  readonly selectedAudit = this.stateService.selectedAudit;
  readonly loading = this.stateService.loading;
  readonly error = this.stateService.error;
  readonly auditCount = this.stateService.auditCount;

  /** Network and synchronization state */
  readonly isOnline = this.networkService.isOnline;
  readonly isOffline = this.networkService.isOffline;
  readonly syncStatus = this.syncStateService.syncStatus;
  readonly isSyncing = this.syncStateService.isSyncing;
  readonly pendingAuditsCount = this.syncStateService.pendingRecordsCount;
  readonly hasConflicts = this.syncStateService.hasConflicts;
  readonly syncError = this.syncStateService.syncError;

  /** Computed business logic using transformations */
  readonly auditSummary = computed(() => 
    this.transformationService.getAuditSummary(this.audits())
  );
  readonly auditsByLocation = computed(() => 
    this.transformationService.groupAuditsByLocation(this.audits())
  );
  readonly todayAudits = computed(() => this.auditSummary().todayAudits);
  readonly syncedAudits = computed(() => this.auditSummary().syncedAudits);
  readonly pendingAudits = computed(() => this.auditSummary().pendingAudits);

  /** Default sorted audits (newest first) */
  readonly sortedAudits = computed(() => {
    return this.transformationService.sortAudits(this.audits(), 'dateReceived', 'desc');
  });

  // ==========================================================================
  // PUBLIC ACTIONS - Main entry points for audit operations
  // ==========================================================================

  /**
   * Load audits using offline-first strategy.
   * 
   * Strategy:
   * 1. Load from local storage first for immediate UI feedback
   * 2. If storage is empty and online, load from server
   * 3. If storage has data and online, background sync from server
   * 4. If offline, use storage data only
   * 
   * @example
   * ```typescript
   * this.auditActionService.loadAudits();
   * ```
   */
  loadAudits(): void {
    console.log('🚀 AuditActionService.loadAudits() called');
    this.stateService.setLoading(true);
    this.stateService.clearError();

    // Offline-first approach: load from storage first, then sync from server
    this.loadFromStorage();
  }

  /**
   * Load audit records from local storage with fallback strategies.
   * 
   * @private
   */
  private loadFromStorage(): void {
    this.storageService.getAllItems()
      .pipe(
        switchMap((offlineItems) => {
          console.log('Loaded from storage:', offlineItems.length, 'audit records');
          console.log('Network status:', this.networkService.isOnline() ? 'online' : 'offline');
          console.log('Storage items:', offlineItems);
          
          // If storage is empty and we're online, load from server first
          if (offlineItems.length === 0 && this.networkService.isOnline()) {
            console.log('Storage empty and online - loading from server');
            return this.loadFromServerWithFallback();
          }
          
          // Otherwise, use storage data first (offline-first for existing data)
          const audits = offlineItems.map(offlineItem => 
            this.transformationService.transformApiAuditToAudit(offlineItem)
          );
          this.stateService.setAudits(audits);
          this.updatePendingCount();

          // If online, sync from server in background
          if (this.networkService.isOnline()) {
            console.log('Online - starting background sync');
            return this.backgroundSyncFromServer();
          } else {
            console.log('Offline - using storage data only');
            this.stateService.setLoading(false);
            return of(audits);
          }
        }),
        catchError((error) => {
          console.error('Storage load failed:', error);
          // If storage fails and we're online, try server directly
          if (this.networkService.isOnline()) {
            console.log('Storage failed, trying server directly');
            return this.fallbackToServer();
          } else {
            this.stateService.setError('Failed to load audit records - offline and no cached data');
            this.stateService.setLoading(false);
            return of([]);
          }
        })
      )
      .subscribe();
  }

  /**
   * Load audits from server when storage is empty.
   * 
   * @private
   */
  private loadFromServerWithFallback() {
    return this.apiService.getAudits().pipe(
      switchMap((serverAudits) => {
        console.log('Initial server load:', serverAudits.length, 'audit records');
        const audits = this.transformationService.transformApiAuditsToAudits(serverAudits);
        this.stateService.setAudits(audits);
        
        // Save to storage for future offline use
        const savePromises = serverAudits.map(audit => 
          lastValueFrom(this.storageService.saveItem(audit, 'synced'))
        );
        
        return Promise.all(savePromises).then(() => {
          this.stateService.setLoading(false);
          return audits;
        });
      }),
      catchError((error) => {
        console.error('Initial server load failed:', error);
        this.stateService.setError('Failed to load audit records from server');
        this.stateService.setLoading(false);
        return of([]);
      })
    );
  }

  /**
   * Fallback to server when storage operations fail.
   * 
   * @private
   */
  private fallbackToServer() {
    return this.apiService.getAudits().pipe(
      switchMap((serverAudits) => {
        console.log('Fallback server load:', serverAudits.length, 'audit records');
        const audits = this.transformationService.transformApiAuditsToAudits(serverAudits);
        this.stateService.setAudits(audits);
        
        // Save to storage for future offline use
        const savePromises = serverAudits.map(audit => 
          lastValueFrom(this.storageService.saveItem(audit, 'synced'))
        );
        
        return Promise.all(savePromises).then(() => audits);
      }),
      catchError((error) => {
        console.error('Server fallback failed:', error);
        this.stateService.setError('Failed to load audit records from server');
        return of([]);
      }),
      finalize(() => {
        this.stateService.setLoading(false);
      })
    );
  }

  /**
   * Perform background sync from server while displaying cached data.
   * 
   * @private
   */
  private backgroundSyncFromServer() {
    this.syncStateService.setSyncStatus('syncing');
    this.syncStateService.setCurrentOperation('fetch');

    return this.apiService.getAudits().pipe(
      switchMap((serverAudits) => {
        // Update storage with server data
        const savePromises = serverAudits.map(audit => 
          lastValueFrom(this.storageService.saveItem(audit, 'synced'))
        );
        
        return Promise.all(savePromises).then(() => {
          // Update UI with fresh server data
          const audits = this.transformationService.transformApiAuditsToAudits(serverAudits);
          this.stateService.setAudits(audits);
          this.syncStateService.setSyncStatus('success');
          return audits;
        });
      }),
      catchError((error) => {
        console.warn('Background sync failed:', error);
        this.syncStateService.setSyncError('Failed to sync with server');
        // Continue with local data - don't fail the operation
        return of([]);
      }),
      finalize(() => {
        this.stateService.setLoading(false);
        this.syncStateService.setCurrentOperation(null);
        this.updatePendingCount();
      })
    );
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Update the count of pending items that need synchronization.
   * 
   * @private
   */
  private updatePendingCount(): void {
    this.storageService.getPendingItems().subscribe(pendingItems => {
      this.syncStateService.setPendingRecordsCount(pendingItems.length);
    });
  }

  /**
   * Load a specific audit record by ID.
   * 
   * @param id - The external ID of the audit record to load
   * 
   * @example
   * ```typescript
   * this.auditActionService.loadAudit('audit-123');
   * ```
   */
  loadAudit(id: string): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();

    this.apiService
      .getAudit(id)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || `Failed to load audit record ${id}`;
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiAudit) => {
        if (apiAudit) {
          const audit = this.transformationService.transformApiAuditToAudit(apiAudit);
          this.stateService.selectAudit(audit);
        }
      });
  }

  /**
   * Create a new audit record with optimistic updates.
   * 
   * Strategy:
   * 1. Validate input data
   * 2. Create optimistic audit record with local ID
   * 3. Save to local storage and update UI immediately
   * 4. If online, sync to server in background
   * 5. Replace optimistic record with server response
   * 
   * @param request - The audit creation request data
   * 
   * @example
   * ```typescript
   * this.auditActionService.createAudit({
   *   slotNumber: 'A-001',
   *   primaryBarcode: '12345678901234',
   *   warehouseLogistics: 'Inbound',
   *   comments: 'New audit entry',
   *   auditors: 'John Doe',
   *   warehouseLocation: 'Warehouse A - Zone 1'
   * });
   * ```
   */
  createAudit(request: CreateAuditRequest): void {
    // Validate data using transformation service
    const validationErrors = this.transformationService.validateAuditData(request);
    if (validationErrors.length > 0) {
      this.stateService.setError(validationErrors.join(', '));
      return;
    }

    this.stateService.setLoading(true);
    this.stateService.clearError();

    const apiRequest = this.transformationService.transformCreateRequestToApiRequest(request);
    
    // Create optimistic audit with local ID
    const optimisticAudit = {
      ExternalId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      SlotNumber: apiRequest.slotNumber,
      PrimaryBarcode: apiRequest.primaryBarcode,
      WarehouseLogistics: apiRequest.warehouseLogistics,
      Comments: apiRequest.comments,
      DateReceived: new Date().toISOString().split('T')[0],
      TimeReceived: new Date().toTimeString().split(' ')[0],
      Auditors: apiRequest.auditors,
      WarehouseLocation: apiRequest.warehouseLocation,
      Synced: 0, // Mark as unsynced initially
    };

    // Optimistic update: save to storage and update UI immediately
    this.storageService.saveItem(optimisticAudit, 'pending')
      .pipe(
        switchMap((savedAudit) => {
          const domainAudit = this.transformationService.transformApiAuditToAudit(savedAudit);
          this.stateService.addAudit(domainAudit);
          this.updatePendingCount();

          // Try to sync to server if online
          if (this.networkService.isOnline()) {
            return this.syncCreateToServer(optimisticAudit, apiRequest);
          } else {
            this.stateService.setLoading(false);
            return of(savedAudit);
          }
        }),
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to create audit record';
          this.stateService.setError(errorMessage);
          this.stateService.setLoading(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Sync a newly created audit record to the server.
   * 
   * @private
   */
  private syncCreateToServer(optimisticAudit: ApiAuditRecord, apiRequest: CreateAuditRequest) {
    this.syncStateService.setSyncStatus('syncing');
    this.syncStateService.setCurrentOperation('create', optimisticAudit.ExternalId);

    return this.apiService.createAudit(apiRequest).pipe(
      switchMap((serverAudit) => {
        // Replace optimistic audit with server audit
        return this.storageService.removeItem(optimisticAudit.ExternalId).pipe(
          switchMap(() => this.storageService.saveItem(serverAudit, 'synced')),
          switchMap(() => {
            // Update UI with server audit
            const domainAudit = this.transformationService.transformApiAuditToAudit(serverAudit);
            this.stateService.updateAudit(domainAudit);
            this.syncStateService.setSyncStatus('success');
            return of(serverAudit);
          })
        );
      }),
      catchError((error) => {
        // Keep optimistic audit as pending for later sync
        this.syncStateService.setSyncError(`Failed to sync create: ${error.message}`);
        return of(optimisticAudit);
      }),
      finalize(() => {
        this.stateService.setLoading(false);
        this.syncStateService.setCurrentOperation(null);
        this.updatePendingCount();
      })
    );
  }

  /**
   * Update an existing audit record.
   * 
   * @param request - The audit update request data including the external ID
   * 
   * @example
   * ```typescript
   * this.auditActionService.updateAudit({
   *   externalId: 'audit-123',
   *   slotNumber: 'A-002',
   *   comments: 'Updated audit entry'
   * });
   * ```
   */
  updateAudit(request: UpdateAuditRequest): void {
    // Validate data using transformation service
    const validationErrors = this.transformationService.validateAuditData(request);
    if (validationErrors.length > 0) {
      this.stateService.setError(validationErrors.join(', '));
      return;
    }

    this.stateService.setLoading(true);
    this.stateService.clearError();

    const apiRequest = this.transformationService.transformUpdateRequestToApiRequest(request);

    this.apiService
      .updateAudit(request.externalId, apiRequest)
      .pipe(
        catchError((error) => {
          const errorMessage = error?.error || 'Failed to update audit record';
          this.stateService.setError(errorMessage);
          return of(null);
        }),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe((apiAudit) => {
        if (apiAudit) {
          const audit = this.transformationService.transformApiAuditToAudit(apiAudit);
          this.stateService.updateAudit(audit);
        }
      });
  }

  /**
   * Delete an audit record with optimistic updates.
   * 
   * Strategy:
   * 1. Optimistically remove from UI immediately
   * 2. Mark as deleted in local storage
   * 3. If online, sync deletion to server
   * 4. On error, rollback optimistic update
   * 
   * @param id - The external ID of the audit record to delete
   * 
   * @example
   * ```typescript
   * this.auditActionService.deleteAudit('audit-123');
   * ```
   */
  deleteAudit(id: string): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();

    // Optimistic update: remove from UI immediately and mark as deleted in storage
    this.stateService.removeAudit(id);
    
    this.storageService.deleteItem(id)
      .pipe(
        switchMap(() => {
          this.updatePendingCount();
          
          // Try to sync deletion to server if online
          if (this.networkService.isOnline()) {
            return this.syncDeleteToServer(id);
          } else {
            this.stateService.setLoading(false);
            return of(void 0);
          }
        }),
        catchError((error) => {
          // Rollback optimistic update on error
          this.restoreDeletedAudit(id);
          const errorMessage = error?.error || 'Failed to delete audit record';
          this.stateService.setError(errorMessage);
          this.stateService.setLoading(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Sync audit deletion to the server.
   * 
   * @private
   */
  private syncDeleteToServer(id: string) {
    this.syncStateService.setSyncStatus('syncing');
    this.syncStateService.setCurrentOperation('delete', id);

    return this.apiService.deleteAudit(id).pipe(
      switchMap(() => {
        // Permanently remove from storage
        return this.storageService.removeItem(id);
      }),
      switchMap(() => {
        this.syncStateService.setSyncStatus('success');
        return of(void 0);
      }),
      catchError((error) => {
        // If server delete fails, keep as pending deletion
        this.syncStateService.setSyncError(`Failed to sync delete: ${error.message}`);
        return of(void 0);
      }),
      finalize(() => {
        this.stateService.setLoading(false);
        this.syncStateService.setCurrentOperation(null);
        this.updatePendingCount();
      })
    );
  }

  /**
   * Restore a deleted audit record when deletion fails.
   * 
   * @private
   */
  private restoreDeletedAudit(id: string): void {
    // In a real implementation, we'd restore from a backup or re-fetch
    // For now, just reload all audits to restore state
    this.loadAudits();
  }

  /**
   * Select an audit record for detailed view.
   * 
   * @param auditId - The external ID of the audit to select, or null to clear selection
   * 
   * @example
   * ```typescript
   * this.auditActionService.selectAudit('audit-123');
   * this.auditActionService.selectAudit(null); // Clear selection
   * ```
   */
  selectAudit(auditId: string | null): void {
    if (!auditId) {
      this.stateService.selectAudit(null);
      return;
    }

    const audit = this.audits().find((a) => a.externalId === auditId);
    this.stateService.selectAudit(audit || null);
  }

  /**
   * Clear the currently selected audit.
   * 
   * @example
   * ```typescript
   * this.auditActionService.clearSelection();
   * ```
   */
  clearSelection(): void {
    this.stateService.selectAudit(null);
  }

  /**
   * Clear any error messages from the state.
   * 
   * @example
   * ```typescript
   * this.auditActionService.clearError();
   * ```
   */
  clearError(): void {
    this.stateService.clearError();
  }

  // ==========================================================================
  // SEARCH AND FILTER OPERATIONS
  // ==========================================================================

  /**
   * Search and filter audits based on multiple criteria.
   * 
   * @param searchTerm - Text to search in barcode, slot number, or comments
   * @param location - Optional warehouse location filter
   * @param auditor - Optional auditor name filter
   * @returns Computed signal with filtered audit records
   * 
   * @example
   * ```typescript
   * const filteredAudits = this.auditActionService.searchAudits('A-001', 'Warehouse A');
   * ```
   */
  searchAudits(searchTerm: string, location?: string, auditor?: string) {
    return computed(() => 
      this.transformationService.filterAudits(this.audits(), searchTerm, location, auditor)
    );
  }

  /**
   * Get sorted audits by specified criteria.
   * 
   * @param sortBy - Field to sort by
   * @param direction - Sort direction (asc/desc)
   * @returns Computed signal with sorted audit records
   * 
   * @example
   * ```typescript
   * const sortedAudits = this.auditActionService.getSortedAudits('dateReceived', 'desc');
   * ```
   */
  getSortedAudits(sortBy: 'dateReceived' | 'slotNumber' | 'auditors' | 'warehouseLocation', direction: 'asc' | 'desc') {
    return computed(() => 
      this.transformationService.sortAudits(this.audits(), sortBy, direction)
    );
  }

  /**
   * Reset all service state to initial values.
   * 
   * @example
   * ```typescript
   * this.auditActionService.reset();
   * ```
   */
  reset(): void {
    this.stateService.reset();
  }

  // ==========================================================================
  // SYNCHRONIZATION OPERATIONS
  // ==========================================================================

  /**
   * Manually trigger synchronization of pending local changes to server.
   * 
   * This operation:
   * 1. Checks if online and not already syncing
   * 2. Retrieves pending and deleted items from storage
   * 3. Processes each item with appropriate API call
   * 4. Handles conflicts and errors gracefully
   * 
   * @example
   * ```typescript
   * this.auditActionService.syncToServer();
   * ```
   */
  syncToServer(): void {
    if (!this.networkService.isOnline()) {
      this.syncStateService.setSyncError('Cannot sync: offline');
      return;
    }

    if (this.syncStateService.isSyncing()) {
      return; // Already syncing
    }

    this.syncStateService.setSyncStatus('syncing');
    this.syncStateService.setCurrentOperation('fetch');

    // Get both pending and deleted items for sync
    this.storageService.getPendingItems().pipe(
      switchMap(pendingItems => 
        this.storageService.getDeletedItems().pipe(
          map(deletedItems => ({ pendingItems, deletedItems }))
        )
      )
    ).subscribe(({ pendingItems, deletedItems }) => {
      const totalItems = pendingItems.length + deletedItems.length;
      
      if (totalItems === 0) {
        this.syncStateService.setSyncStatus('success');
        this.syncStateService.setCurrentOperation(null);
        return;
      }

      console.log(`🔄 Syncing ${pendingItems.length} pending and ${deletedItems.length} deleted items`);
      this.processPendingAudits(pendingItems, deletedItems);
    });
  }

  /**
   * Process pending and deleted audit records for synchronization.
   * 
   * @private
   */
  private processPendingAudits(pendingItems: OfflineAuditRecord[], deletedItems: OfflineAuditRecord[] = []): void {
    let processed = 0;
    const total = pendingItems.length + deletedItems.length;

    pendingItems.forEach(audit => {
      const apiRequest = this.transformationService.transformCreateRequestToApiRequest(audit);
      
      if (audit.ExternalId.startsWith('local_')) {
        // New audit to create
        this.apiService.createAudit(apiRequest).subscribe({
          next: (serverAudit) => {
            this.handleSyncSuccess(audit.ExternalId, serverAudit);
            processed++;
            this.checkSyncCompletion(processed, total);
          },
          error: (error) => {
            this.handleSyncError(audit.ExternalId, error);
            processed++;
            this.checkSyncCompletion(processed, total);
          }
        });
      } else {
        // Existing audit to update
        this.apiService.updateAudit(audit.ExternalId, apiRequest).subscribe({
          next: (serverAudit) => {
            this.handleSyncSuccess(audit.ExternalId, serverAudit);
            processed++;
            this.checkSyncCompletion(processed, total);
          },
          error: (error) => {
            this.handleSyncError(audit.ExternalId, error);
            processed++;
            this.checkSyncCompletion(processed, total);
          }
        });
      }
    });

    // Process deleted items
    deletedItems.forEach(audit => {
      console.log(`🗑️ Syncing deletion of audit ${audit.ExternalId}`);
      this.apiService.deleteAudit(audit.ExternalId).subscribe({
        next: () => {
          console.log(`✅ Successfully deleted audit ${audit.ExternalId} on server`);
          // Permanently remove from storage
          this.storageService.removeItem(audit.ExternalId).subscribe(() => {
            processed++;
            this.checkSyncCompletion(processed, total);
          });
        },
        error: (error) => {
          console.error(`❌ Failed to delete audit ${audit.ExternalId}:`, error);
          this.handleSyncError(audit.ExternalId, error);
          processed++;
          this.checkSyncCompletion(processed, total);
        }
      });
    });
  }

  /**
   * Handle successful synchronization of an audit record.
   * 
   * @private
   */
  private handleSyncSuccess(localId: string, serverAudit: ApiAuditRecord): void {
    // Replace local audit with server audit
    if (localId.startsWith('local_')) {
      // Remove local audit and add server audit
      this.storageService.removeItem(localId).subscribe(() => {
        this.storageService.saveItem(serverAudit, 'synced').subscribe(() => {
          const domainAudit = this.transformationService.transformApiAuditToAudit(serverAudit);
          this.stateService.updateAudit(domainAudit);
        });
      });
    } else {
      // Mark existing audit as synced
      this.storageService.markAsSynced(localId).subscribe(() => {
        const domainAudit = this.transformationService.transformApiAuditToAudit(serverAudit);
        this.stateService.updateAudit(domainAudit);
      });
    }
  }

  /**
   * Handle synchronization errors and conflicts.
   * 
   * @private
   */
  private handleSyncError(auditId: string, error: unknown): void {
    console.error(`Failed to sync audit ${auditId}:`, error);
    
    // Check for conflicts (409 status typically indicates conflict)
    if (this.isConflictError(error)) {
      this.handleConflict(auditId, error.serverAudit);
    }
  }

  /**
   * Handle data conflicts between local and server records.
   * 
   * @private
   */
  private handleConflict(localId: string, serverAudit: ApiAuditRecord): void {
    this.storageService.getItem(localId).subscribe(localAudit => {
      if (!localAudit) return;

      const conflict = this.syncService.detectConflict(
        localAudit, 
        serverAudit, 
        localAudit._lastModified
      );

      if (conflict) {
        const resolution = this.syncService.resolveConflict(conflict);
        
        this.syncStateService.addConflict(
          localId,
          conflict.localModified,
          conflict.serverModified
        );

        // Apply resolution (last-write-wins)
        if (resolution === 'use-server') {
          this.storageService.saveItem(serverAudit, 'synced').subscribe(() => {
            const domainAudit = this.transformationService.transformApiAuditToAudit(serverAudit);
            this.stateService.updateAudit(domainAudit);
            this.syncStateService.markConflictResolved(localId);
          });
        } else {
          // Keep local version, mark conflict as resolved
          this.syncStateService.markConflictResolved(localId);
        }
      }
    });
  }

  /**
   * Check if synchronization is complete and update state accordingly.
   * 
   * @private
   */
  private checkSyncCompletion(processed: number, total: number): void {
    if (processed === total) {
      this.syncStateService.setSyncStatus('success');
      this.syncStateService.setCurrentOperation(null);
      this.updatePendingCount();
      this.loadAudits(); // Refresh to show latest state
    }
  }

  /**
   * Type guard to check if an error is a conflict error.
   * 
   * @private
   */
  private isConflictError(error: unknown): error is { status: number; serverAudit: ApiAuditRecord } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'serverAudit' in error &&
      (error as { status: number }).status === 409
    );
  }

  /**
   * Clear any synchronization error messages.
   * 
   * @example
   * ```typescript
   * this.auditActionService.clearSyncError();
   * ```
   */
  clearSyncError(): void {
    this.syncStateService.clearSyncError();
  }

  /**
   * Get current synchronization information.
   * 
   * @returns Computed signal with sync status, operation, and error details
   * 
   * @example
   * ```typescript
   * const syncInfo = this.auditActionService.getSyncInfo();
   * console.log(syncInfo().status); // 'idle' | 'syncing' | 'success' | 'error'
   * ```
   */
  getSyncInfo() {
    return this.syncStateService.syncInfo;
  }
}