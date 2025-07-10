import { Injectable } from '@angular/core';
import {
  AuditRecord,
  CreateAuditRequest,
  UpdateAuditRequest,
  ApiAuditRecord,
  OfflineAuditRecord,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuditTransformationService {
  /**
   * Transform API audit record to domain audit record
   */
  transformApiAuditToAudit(apiAudit: ApiAuditRecord): AuditRecord {
    return {
      externalId: apiAudit.ExternalId,
      slotNumber: apiAudit.SlotNumber,
      primaryBarcode: apiAudit.PrimaryBarcode,
      warehouseLogistics: apiAudit.WarehouseLogistics,
      comments: apiAudit.Comments,
      dateReceived: new Date(apiAudit.DateReceived),
      timeReceived: apiAudit.TimeReceived,
      auditors: apiAudit.Auditors,
      warehouseLocation: apiAudit.WarehouseLocation,
      synced: apiAudit.Synced === 1,
    };
  }

  /**
   * Transform array of API audit records to domain audit records
   */
  transformApiAuditsToAudits(apiAudits: ApiAuditRecord[]): AuditRecord[] {
    return apiAudits.map((apiAudit) => this.transformApiAuditToAudit(apiAudit));
  }

  /**
   * Transform domain create request to API create request
   */
  transformCreateRequestToApiRequest(request: CreateAuditRequest | OfflineAuditRecord): CreateAuditRequest {
    // Handle both CreateAuditRequest and OfflineAuditRecord types
    if ('SlotNumber' in request) {
      // OfflineAuditRecord case
      return {
        slotNumber: request.SlotNumber,
        primaryBarcode: request.PrimaryBarcode,
        warehouseLogistics: request.WarehouseLogistics,
        comments: request.Comments,
        auditors: request.Auditors,
        warehouseLocation: request.WarehouseLocation,
      };
    } else {
      // CreateAuditRequest case
      return {
        slotNumber: request.slotNumber,
        primaryBarcode: request.primaryBarcode,
        warehouseLogistics: request.warehouseLogistics,
        comments: request.comments,
        auditors: request.auditors,
        warehouseLocation: request.warehouseLocation,
      };
    }
  }

  /**
   * Transform domain update request to API update request
   */
  transformUpdateRequestToApiRequest(request: UpdateAuditRequest): Partial<CreateAuditRequest> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { externalId, ...updateFields } = request;
    return updateFields;
  }

  /**
   * Get summary statistics from audit records
   */
  getAuditSummary(audits: AuditRecord[]): {
    totalAudits: number;
    syncedAudits: number;
    pendingAudits: number;
    todayAudits: number;
    locations: string[];
    auditors: string[];
  } {
    const today = new Date().toDateString();
    
    return {
      totalAudits: audits.length,
      syncedAudits: audits.filter(audit => audit.synced).length,
      pendingAudits: audits.filter(audit => !audit.synced).length,
      todayAudits: audits.filter(audit => audit.dateReceived.toDateString() === today).length,
      locations: [...new Set(audits.map(audit => audit.warehouseLocation))],
      auditors: [...new Set(audits.map(audit => audit.auditors))],
    };
  }

  /**
   * Group audits by warehouse location
   */
  groupAuditsByLocation(audits: AuditRecord[]): Record<string, AuditRecord[]> {
    return audits.reduce(
      (groups, audit) => {
        const location = audit.warehouseLocation;
        if (!groups[location]) {
          groups[location] = [];
        }
        groups[location].push(audit);
        return groups;
      },
      {} as Record<string, AuditRecord[]>
    );
  }

  /**
   * Sort audits by various criteria
   */
  sortAudits(
    audits: AuditRecord[],
    sortBy: 'dateReceived' | 'slotNumber' | 'auditors' | 'warehouseLocation',
    direction: 'asc' | 'desc' = 'desc'
  ): AuditRecord[] {
    const sorted = [...audits].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'dateReceived':
          comparison = a.dateReceived.getTime() - b.dateReceived.getTime();
          break;
        case 'slotNumber':
          comparison = a.slotNumber.localeCompare(b.slotNumber);
          break;
        case 'auditors':
          comparison = a.auditors.localeCompare(b.auditors);
          break;
        case 'warehouseLocation':
          comparison = a.warehouseLocation.localeCompare(b.warehouseLocation);
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Filter audits by search criteria
   */
  filterAudits(audits: AuditRecord[], searchTerm: string, location?: string, auditor?: string): AuditRecord[] {
    let filtered = audits;

    // Filter by search term (barcode, slot number, or comments)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (audit) =>
          audit.primaryBarcode.toLowerCase().includes(term) ||
          audit.slotNumber.toLowerCase().includes(term) ||
          audit.comments.toLowerCase().includes(term)
      );
    }

    // Filter by location
    if (location && location !== 'all') {
      filtered = filtered.filter((audit) => audit.warehouseLocation === location);
    }

    // Filter by auditor
    if (auditor && auditor !== 'all') {
      filtered = filtered.filter((audit) => audit.auditors === auditor);
    }

    return filtered;
  }

  /**
   * Validate audit data
   */
  validateAuditData(audit: CreateAuditRequest | UpdateAuditRequest): string[] {
    const errors: string[] = [];

    if (!audit.slotNumber?.trim()) {
      errors.push('Slot number is required');
    }

    if (!audit.primaryBarcode?.trim()) {
      errors.push('Primary barcode is required');
    }

    if (!audit.warehouseLogistics?.trim()) {
      errors.push('Warehouse logistics is required');
    }

    if (!audit.auditors?.trim()) {
      errors.push('Auditor name is required');
    }

    if (!audit.warehouseLocation?.trim()) {
      errors.push('Warehouse location is required');
    }

    // Validate barcode format (basic GTIN validation)
    if (audit.primaryBarcode && !this.isValidGTIN(audit.primaryBarcode)) {
      errors.push('Invalid barcode format');
    }

    return errors;
  }

  /**
   * Basic GTIN validation
   */
  private isValidGTIN(barcode: string): boolean {
    // Remove any non-digit characters
    const digits = barcode.replace(/\D/g, '');
    
    // GTIN can be 8, 12, 13, or 14 digits
    if (![8, 12, 13, 14].includes(digits.length)) {
      return false;
    }

    // Basic format check - should start with appropriate prefix
    return digits.length >= 8;
  }

  /**
   * Parse barcode type from barcode string
   */
  parseBarcodeType(barcode: string): string {
    if (!barcode) return 'Unknown';

    // GS1-128 typically starts with ]C1
    if (barcode.startsWith(']C1')) {
      return 'GS1-128';
    }

    // GS1 DataMatrix typically starts with ]d2
    if (barcode.startsWith(']d2')) {
      return 'GS1 DataMatrix';
    }

    // Basic GTIN detection
    const digits = barcode.replace(/\D/g, '');
    if ([8, 12, 13, 14].includes(digits.length)) {
      switch (digits.length) {
        case 8: return 'EAN-8';
        case 12: return 'UPC-A';
        case 13: return 'EAN-13';
        case 14: return 'GTIN-14';
        default: return 'GTIN';
      }
    }

    return 'Unknown';
  }
}