import { Injectable } from '@angular/core';
import { ApiAuditRecord } from '../models';
import { ConflictData } from '../models';

// Audit-specific conflict data interface
export interface AuditConflictData {
  localAudit: ApiAuditRecord;
  serverAudit: ApiAuditRecord;
  localModified: number;
  serverModified: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditSyncService {
  /**
   * Detect conflicts between local and server audit records
   */
  detectConflict(localAudit: ApiAuditRecord, serverAudit: ApiAuditRecord, localModified: number): AuditConflictData | null {
    // For audit records, we'll use a simple timestamp comparison
    // In a real system, you might have a LastModified field on the server
    const serverModified = new Date().getTime(); // Placeholder - in real system this would come from server
    
    // Check if there's a conflict (both modified since last sync)
    const hasConflict = localModified > serverModified && 
                       (localAudit.SlotNumber !== serverAudit.SlotNumber ||
                        localAudit.PrimaryBarcode !== serverAudit.PrimaryBarcode ||
                        localAudit.WarehouseLogistics !== serverAudit.WarehouseLogistics ||
                        localAudit.Comments !== serverAudit.Comments ||
                        localAudit.Auditors !== serverAudit.Auditors ||
                        localAudit.WarehouseLocation !== serverAudit.WarehouseLocation);

    if (hasConflict) {
      return {
        localAudit,
        serverAudit,
        localModified,
        serverModified
      };
    }

    return null;
  }

  /**
   * Resolve conflict using last-write-wins strategy
   */
  resolveConflict(conflict: AuditConflictData): 'use-local' | 'use-server' {
    // Last write wins
    return conflict.localModified > conflict.serverModified ? 'use-local' : 'use-server';
  }

  /**
   * Determine if sync is needed based on timestamps
   */
  isSyncNeeded(localModified: number, serverModified: number): boolean {
    return Math.abs(localModified - serverModified) > 1000; // 1 second tolerance
  }

  /**
   * Check if audit records are identical
   */
  areAuditsIdentical(localAudit: ApiAuditRecord, serverAudit: ApiAuditRecord): boolean {
    return localAudit.SlotNumber === serverAudit.SlotNumber &&
           localAudit.PrimaryBarcode === serverAudit.PrimaryBarcode &&
           localAudit.WarehouseLogistics === serverAudit.WarehouseLogistics &&
           localAudit.Comments === serverAudit.Comments &&
           localAudit.DateReceived === serverAudit.DateReceived &&
           localAudit.TimeReceived === serverAudit.TimeReceived &&
           localAudit.Auditors === serverAudit.Auditors &&
           localAudit.WarehouseLocation === serverAudit.WarehouseLocation;
  }

  /**
   * Generate unique sync identifier for audit operations
   */
  generateSyncId(operation: string, auditId: string): string {
    return `audit_${operation}_${auditId}_${Date.now()}`;
  }

  /**
   * Calculate sync priority based on operation type
   */
  getSyncPriority(operation: string): number {
    switch (operation) {
      case 'delete': return 1; // Highest priority
      case 'update': return 2;
      case 'create': return 3;
      case 'fetch': return 4;   // Lowest priority
      default: return 5;
    }
  }

  /**
   * Validate audit record for sync operations
   */
  validateAuditForSync(audit: ApiAuditRecord): boolean {
    return !!(audit.ExternalId && 
              audit.SlotNumber && 
              audit.PrimaryBarcode &&
              audit.WarehouseLocation);
  }

  /**
   * Check if audit record has required fields for sync
   */
  isAuditSyncable(audit: ApiAuditRecord): boolean {
    return this.validateAuditForSync(audit);
  }

  /**
   * Generate conflict resolution strategy for audit records
   */
  getConflictResolutionStrategy(conflict: AuditConflictData): {
    action: 'merge' | 'use-local' | 'use-server';
    mergedAudit?: Partial<ApiAuditRecord>;
  } {
    // For audit records, we typically want to preserve the most recent audit data
    // But we can implement more sophisticated merging logic here
    
    if (conflict.localModified > conflict.serverModified) {
      return { action: 'use-local' };
    } else {
      return { action: 'use-server' };
    }
  }
}