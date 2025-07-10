/**
 * Synchronization models for offline-first data management
 * 
 * This file contains types and interfaces for handling data synchronization
 * between the local application state and remote servers. It supports offline-first
 * architecture where the app can function without network connectivity and sync
 * changes when connectivity is restored.
 * 
 * The sync system handles:
 * - Tracking sync states and operations
 * - Conflict resolution between local and remote changes
 * - Batch operations for efficient network usage
 * - Error handling and retry mechanisms
 */

/**
 * Possible states of a synchronization operation
 * 
 * @example
 * ```typescript
 * const currentStatus: SyncStatus = 'syncing';
 * 
 * // Usage in state management
 * if (currentStatus === 'idle') {
 *   // Ready to start new sync operation
 * } else if (currentStatus === 'syncing') {
 *   // Show loading indicator
 * }
 * ```
 */
export type SyncStatus = 
  /** No sync operation in progress, ready to sync */ 
  'idle' | 
  /** Sync operation currently in progress */ 
  'syncing' | 
  /** Last sync operation completed successfully */ 
  'success' | 
  /** Last sync operation failed with error */ 
  'error';

/**
 * Types of synchronization operations that can be performed
 * 
 * @example
 * ```typescript
 * const operation: SyncOperation = 'create';
 * 
 * // Usage in sync service
 * switch (operation) {
 *   case 'create':
 *     await syncService.createRemoteRecord(localRecord);
 *     break;
 *   case 'update':
 *     await syncService.updateRemoteRecord(localRecord);
 *     break;
 *   // ... other operations
 * }
 * ```
 */
export type SyncOperation = 
  /** Create a new record on the server */ 
  'create' | 
  /** Update an existing record on the server */ 
  'update' | 
  /** Delete a record from the server */ 
  'delete' | 
  /** Fetch the latest data from the server */ 
  'fetch';

/**
 * Information about the current or last synchronization operation
 * 
 * This interface provides detailed information about sync operations,
 * including their status, type, and any errors that occurred. It's used
 * for displaying sync status to users and for debugging sync issues.
 * 
 * @example
 * ```typescript
 * const syncInfo: SyncInfo = {
 *   status: 'success',
 *   operation: 'create',
 *   itemId: 'audit-123',
 *   error: null,
 *   timestamp: new Date()
 * };
 * 
 * // Usage in UI
 * if (syncInfo.status === 'error') {
 *   showErrorMessage(`Sync failed: ${syncInfo.error}`);
 * } else if (syncInfo.status === 'success') {
 *   showSuccessMessage(`${syncInfo.operation} completed successfully`);
 * }
 * ```
 */
export interface SyncInfo {
  /** Current status of the sync operation */
  status: SyncStatus;
  
  /** 
   * Type of operation being performed or last performed
   * null when no operation has been initiated
   */
  operation: SyncOperation | null;
  
  /** 
   * Identifier of the item being synced
   * null when syncing multiple items or no specific item
   */
  itemId: string | null;
  
  /** 
   * Error message if the sync operation failed
   * null when no error occurred
   */
  error: string | null;
  
  /** 
   * Timestamp of when the sync operation started or completed
   * null when no operation has been initiated
   */
  timestamp: Date | null;
}

/**
 * Information about a data conflict between local and remote versions
 * 
 * This interface tracks conflicts that occur when the same record is modified
 * both locally (while offline) and remotely (by other users or systems).
 * It helps determine which version is newer and whether the conflict has been
 * resolved.
 * 
 * @example
 * ```typescript
 * const conflict: ConflictInfo = {
 *   itemId: 'audit-123',
 *   localModified: 1697371800000,  // Local timestamp
 *   serverModified: 1697371900000, // Server timestamp (newer)
 *   resolved: false
 * };
 * 
 * // Usage in conflict resolution
 * if (conflict.serverModified > conflict.localModified) {
 *   // Server version is newer, consider using server data
 *   console.log('Server version is more recent');
 * } else {
 *   // Local version is newer, consider keeping local changes
 *   console.log('Local version is more recent');
 * }
 * ```
 */
export interface ConflictInfo {
  /** Unique identifier of the conflicted item */
  itemId: string;
  
  /** 
   * Timestamp when the local version was last modified
   * Format: Unix timestamp in milliseconds
   */
  localModified: number;
  
  /** 
   * Timestamp when the server version was last modified
   * Format: Unix timestamp in milliseconds
   */
  serverModified: number;
  
  /** 
   * Whether the conflict has been resolved
   * false indicates manual intervention may be needed
   */
  resolved: boolean;
}

/**
 * Result of a synchronization operation
 * 
 * This interface represents the outcome of a sync operation, providing
 * information about whether it succeeded, what operation was performed,
 * and any error details if it failed.
 * 
 * @example
 * ```typescript
 * const result: SyncResult = {
 *   success: true,
 *   operation: 'create',
 *   itemId: 'audit-123'
 * };
 * 
 * // Usage in sync service
 * const results = await syncService.syncPendingItems();
 * const failedSyncs = results.filter(r => !r.success);
 * const successfulSyncs = results.filter(r => r.success);
 * 
 * console.log(`${successfulSyncs.length} items synced successfully`);
 * console.log(`${failedSyncs.length} items failed to sync`);
 * ```
 * 
 * @example
 * ```typescript
 * // Error handling example
 * const errorResult: SyncResult = {
 *   success: false,
 *   operation: 'update',
 *   itemId: 'audit-456',
 *   error: 'Network timeout after 30 seconds'
 * };
 * 
 * if (!errorResult.success) {
 *   console.error(`Failed to ${errorResult.operation} item ${errorResult.itemId}: ${errorResult.error}`);
 * }
 * ```
 */
export interface SyncResult {
  /** Whether the sync operation completed successfully */
  success: boolean;
  
  /** The type of operation that was performed */
  operation: SyncOperation;
  
  /** Unique identifier of the item that was synced */
  itemId: string;
  
  /** 
   * Error message if the operation failed
   * Only present when success is false
   */
  error?: string;
}

/**
 * Detailed conflict data containing both local and remote versions
 * 
 * This generic interface holds the actual data for both versions of a
 * conflicted item, along with their modification timestamps. It enables
 * sophisticated conflict resolution strategies, including:
 * - Manual resolution by presenting both versions to the user
 * - Automatic resolution based on timestamps or business rules
 * - Merging of non-conflicting fields
 * 
 * @template T The type of the conflicted item (e.g., AuditRecord, ApiAuditRecord)
 * 
 * @example
 * ```typescript
 * // Usage with a specific audit record type
 * const conflictData: ConflictData<AuditRecord> = {
 *   localItem: {
 *     externalId: 'audit-123',
 *     comments: 'Local changes: item damaged',
 *     auditors: 'John Doe',
 *     // ... other fields
 *   },
 *   serverItem: {
 *     externalId: 'audit-123',
 *     comments: 'Server changes: item relocated',
 *     auditors: 'Jane Smith',
 *     // ... other fields
 *   },
 *   localModified: 1697371800000,
 *   serverModified: 1697371900000
 * };
 * 
 * // Conflict resolution strategies
 * if (conflictData.serverModified > conflictData.localModified) {
 *   // Use server version
 *   resolvedItem = conflictData.serverItem;
 * } else {
 *   // Use local version
 *   resolvedItem = conflictData.localItem;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Manual conflict resolution
 * function resolveConflict<T>(conflictData: ConflictData<T>): T {
 *   // Present both versions to user for manual resolution
 *   const userChoice = presentConflictDialog(conflictData);
 *   return userChoice === 'local' ? conflictData.localItem : conflictData.serverItem;
 * }
 * ```
 */
export interface ConflictData<T = unknown> {
  /** The local version of the conflicted item */
  localItem: T;
  
  /** The server version of the conflicted item */
  serverItem: T;
  
  /** 
   * Timestamp when the local version was last modified
   * Format: Unix timestamp in milliseconds
   */
  localModified: number;
  
  /** 
   * Timestamp when the server version was last modified
   * Format: Unix timestamp in milliseconds
   */
  serverModified: number;
}