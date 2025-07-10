import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, lastValueFrom, of } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { ApiAuditRecord } from '../models';

export interface OfflineAuditItem extends ApiAuditRecord {
  _localId: string;
  _status: 'synced' | 'pending' | 'deleted';
  _lastModified: number;
  _conflictData?: ApiAuditRecord;
}

export interface AuditSyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: ApiAuditRecord | null;
  timestamp: number;
  retries: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditStorageService {
  private readonly DB_NAME = 'SandboxPatternAuditDB';
  private readonly DB_VERSION = 1;
  private readonly AUDITS_STORE = 'audits';
  private readonly SYNC_QUEUE_STORE = 'auditSyncQueue';

  private db: IDBDatabase | null = null;
  private dbReady$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Initialize database (don't clear on every startup for offline functionality)
    this.initDB().catch(error => {
      console.error('🗃️ Database initialization failed:', error);
    });
  }

  /**
   * Clear database - for development/testing only
   * Call manually when needed: auditStorageService.clearAllDatabases()
   */
  async clearAllDatabases(): Promise<void> {
    return this.clearOldDatabase();
  }

  private async clearOldDatabase(): Promise<void> {
    return new Promise((resolve) => {
      // Delete any old database versions
      const deleteOld = indexedDB.deleteDatabase('SandboxPatternDB');
      const deleteNew = indexedDB.deleteDatabase('SandboxPatternAuditDB');
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          console.log('🗃️ Cleared all old databases');
          resolve();
        }
      };

      deleteOld.onsuccess = () => {
        console.log('🗃️ Cleared old SandboxPatternDB');
        checkComplete();
      };
      deleteOld.onerror = () => {
        console.log('🗃️ No old SandboxPatternDB to clear');
        checkComplete();
      };

      deleteNew.onsuccess = () => {
        console.log('🗃️ Cleared old SandboxPatternAuditDB');
        checkComplete();
      };
      deleteNew.onerror = () => {
        console.log('🗃️ No old SandboxPatternAuditDB to clear');
        checkComplete();
      };
    });
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDB(): Promise<void> {
    console.log('🗃️ Initializing AuditStorageService database:', this.DB_NAME, 'version:', this.DB_VERSION);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('🗃️ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('🗃️ Database opened successfully');
        this.db = request.result;
        console.log('🗃️ Setting database ready to true');
        this.dbReady$.next(true);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('🗃️ Database upgrade needed, creating stores...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create audits store
        if (!db.objectStoreNames.contains(this.AUDITS_STORE)) {
          console.log('🗃️ Creating audits store:', this.AUDITS_STORE);
          const auditsStore = db.createObjectStore(this.AUDITS_STORE, { keyPath: 'ExternalId' });
          auditsStore.createIndex('_status', '_status', { unique: false });
          auditsStore.createIndex('_lastModified', '_lastModified', { unique: false });
          auditsStore.createIndex('WarehouseLocation', 'WarehouseLocation', { unique: false });
          auditsStore.createIndex('DateReceived', 'DateReceived', { unique: false });
          console.log('🗃️ Audits store created successfully');
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(this.SYNC_QUEUE_STORE)) {
          console.log('🗃️ Creating sync queue store:', this.SYNC_QUEUE_STORE);
          const syncStore = db.createObjectStore(this.SYNC_QUEUE_STORE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('action', 'action', { unique: false });
          console.log('🗃️ Sync queue store created successfully');
        }
      };
    });
  }

  /**
   * Wait for database to be ready
   */
  private waitForDB(): Observable<boolean> {
    return this.dbReady$.asObservable().pipe(
      filter(ready => ready === true),
      take(1)
    );
  }

  /**
   * Get all audits from local storage
   */
  getAllItems(): Observable<OfflineAuditItem[]> {
    console.log('💾 AuditStorageService.getAllItems() called');
    return from(lastValueFrom(this.waitForDB()).then(() => {
      console.log('💾 Database ready, querying audits store');
      return new Promise<OfflineAuditItem[]>((resolve, reject) => {
        if (!this.db) {
          console.error('💾 Database not initialized');
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          const audits = request.result.filter((audit: OfflineAuditItem) => audit._status !== 'deleted');
          console.log('💾 Retrieved', audits.length, 'audits from storage');
          resolve(audits);
        };

        request.onerror = () => {
          console.error('💾 Error retrieving audits:', request.error);
          reject(request.error);
        };
      });
    })).pipe(
      catchError((error) => {
        console.error('💾 getAllItems failed:', error);
        throw error;
      })
    );
  }

  /**
   * Get a specific audit by ID
   */
  getItem(id: string): Observable<OfflineAuditItem | null> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<OfflineAuditItem | null>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          const audit = request.result;
          resolve(audit && audit._status !== 'deleted' ? audit : null);
        };

        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Save audit to local storage
   */
  saveItem(audit: ApiAuditRecord, status: 'synced' | 'pending' = 'pending'): Observable<OfflineAuditItem> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<OfflineAuditItem>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const offlineAudit: OfflineAuditItem = {
          ...audit,
          _localId: audit.ExternalId || this.generateLocalId(),
          _status: status,
          _lastModified: Date.now()
        };

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readwrite');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const request = store.put(offlineAudit);

        request.onsuccess = () => resolve(offlineAudit);
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Update audit in local storage
   */
  updateItem(id: string, updates: Partial<ApiAuditRecord>, status: 'synced' | 'pending' = 'pending'): Observable<OfflineAuditItem> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<OfflineAuditItem>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readwrite');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const existingAudit = getRequest.result;
          if (!existingAudit) {
            reject(new Error(`Audit with id ${id} not found`));
            return;
          }

          const updatedAudit: OfflineAuditItem = {
            ...existingAudit,
            ...updates,
            _status: status,
            _lastModified: Date.now()
          };

          const putRequest = store.put(updatedAudit);
          putRequest.onsuccess = () => resolve(updatedAudit);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    }));
  }

  /**
   * Delete audit from local storage (mark as deleted)
   */
  deleteItem(id: string): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readwrite');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const audit = getRequest.result;
          if (!audit) {
            resolve(); // Audit already doesn't exist
            return;
          }

          const deletedAudit: OfflineAuditItem = {
            ...audit,
            _status: 'deleted',
            _lastModified: Date.now()
          };

          const putRequest = store.put(deletedAudit);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    }));
  }

  /**
   * Get audits that need to be synced
   */
  getPendingItems(): Observable<OfflineAuditItem[]> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<OfflineAuditItem[]>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const index = store.index('_status');
        const request = index.getAll('pending');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Get audits marked for deletion
   */
  getDeletedItems(): Observable<OfflineAuditItem[]> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<OfflineAuditItem[]>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const index = store.index('_status');
        const request = index.getAll('deleted');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Mark audit as synced
   */
  markAsSynced(id: string): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readwrite');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const audit = getRequest.result;
          if (!audit) {
            resolve(); // Audit doesn't exist
            return;
          }

          audit._status = 'synced';
          audit._lastModified = Date.now();

          const putRequest = store.put(audit);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    }));
  }

  /**
   * Remove audit completely (for synced deletions)
   */
  removeItem(id: string): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE], 'readwrite');
        const store = transaction.objectStore(this.AUDITS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Clear all data (for testing/reset)
   */
  clear(): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.AUDITS_STORE, this.SYNC_QUEUE_STORE], 'readwrite');
        const auditsStore = transaction.objectStore(this.AUDITS_STORE);
        const syncStore = transaction.objectStore(this.SYNC_QUEUE_STORE);

        const clearAudits = auditsStore.clear();
        const clearSync = syncStore.clear();

        let completed = 0;
        const checkComplete = () => {
          completed++;
          if (completed === 2) resolve();
        };

        clearAudits.onsuccess = checkComplete;
        clearSync.onsuccess = checkComplete;
        clearAudits.onerror = () => reject(clearAudits.error);
        clearSync.onerror = () => reject(clearSync.error);
      });
    }));
  }

  /**
   * Sync queue operations
   */
  addToSyncQueue(item: AuditSyncQueueItem): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.SYNC_QUEUE_STORE], 'readwrite');
        const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Get sync queue items
   */
  getSyncQueue(): Observable<AuditSyncQueueItem[]> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<AuditSyncQueueItem[]>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.SYNC_QUEUE_STORE], 'readonly');
        const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
        const index = store.index('timestamp');
        const request = index.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Remove from sync queue
   */
  removeFromSyncQueue(id: string): Observable<void> {
    return from(lastValueFrom(this.waitForDB()).then(() => {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.SYNC_QUEUE_STORE], 'readwrite');
        const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));
  }

  /**
   * Generate a local ID for new audits
   */
  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}