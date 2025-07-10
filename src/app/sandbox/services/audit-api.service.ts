import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { ApiAuditRecord, CreateAuditRequest } from '../models';

/**
 * Interface for API error responses
 */
export interface ApiError {
  error: string;
  status: number;
  timestamp?: number;
}

/**
 * Service for handling HTTP API operations for audit records.
 * This service provides a mock implementation for development and testing.
 * 
 * Key responsibilities:
 * - Provide HTTP CRUD operations for audit records
 * - Simulate realistic API delays and errors
 * - Maintain consistent error response format
 * - Handle API-specific data transformations
 * 
 * @example
 * ```typescript
 * // Get all audits
 * this.auditApiService.getAudits().subscribe(audits => {
 *   console.log('Received audits:', audits.length);
 * });
 * 
 * // Create new audit
 * this.auditApiService.createAudit(request).subscribe(audit => {
 *   console.log('Created audit:', audit.ExternalId);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class AuditApiService {
  // Mock data storage (simulating API database)
  private mockAudits: ApiAuditRecord[] = [
    {
      ExternalId: '1',
      SlotNumber: 'A-001',
      PrimaryBarcode: '01304567890123456789',
      WarehouseLogistics: 'Inbound',
      Comments: 'Initial audit scan',
      DateReceived: '2024-01-15',
      TimeReceived: '09:30:00',
      Auditors: 'John Doe',
      WarehouseLocation: 'Warehouse A - Sector 1',
      Synced: 1,
    },
    {
      ExternalId: '2',
      SlotNumber: 'B-045',
      PrimaryBarcode: '01305678901234567890',
      WarehouseLogistics: 'Storage',
      Comments: 'Weekly inventory check',
      DateReceived: '2024-01-16',
      TimeReceived: '14:15:00',
      Auditors: 'Jane Smith',
      WarehouseLocation: 'Warehouse B - Sector 3',
      Synced: 1,
    },
    {
      ExternalId: '3',
      SlotNumber: 'C-122',
      PrimaryBarcode: '01306789012345678901',
      WarehouseLogistics: 'Outbound',
      Comments: 'Pre-shipment verification',
      DateReceived: '2024-01-17',
      TimeReceived: '11:45:00',
      Auditors: 'Mike Johnson',
      WarehouseLocation: 'Warehouse C - Loading Dock',
      Synced: 1,
    },
    {
      ExternalId: '4',
      SlotNumber: 'A-234',
      PrimaryBarcode: '01307890123456789012',
      WarehouseLogistics: 'Quality Check',
      Comments: 'Damaged packaging inspection',
      DateReceived: '2024-01-18',
      TimeReceived: '16:20:00',
      Auditors: 'Sarah Wilson',
      WarehouseLocation: 'Warehouse A - QC Station',
      Synced: 1,
    },
  ];

  // ==========================================================================
  // PUBLIC API METHODS - HTTP operations only, no business logic
  // ==========================================================================

  /**
   * Retrieve all audit records from the API.
   * 
   * @returns Observable of audit record array
   * @throws ApiError when the operation fails
   * 
   * @example
   * ```typescript
   * this.auditApiService.getAudits().subscribe({
   *   next: (audits) => console.log('Loaded audits:', audits.length),
   *   error: (error) => console.error('Failed to load audits:', error)
   * });
   * ```
   */
  getAudits(): Observable<ApiAuditRecord[]> {
    console.log('🌐 AuditApiService.getAudits() called, returning', this.mockAudits.length, 'records');
    return of([...this.mockAudits]).pipe(delay(500));
  }

  /**
   * Retrieve a specific audit record by ID.
   * 
   * @param id - The external ID of the audit record
   * @returns Observable of single audit record
   * @throws ApiError with status 404 when audit not found
   * 
   * @example
   * ```typescript
   * this.auditApiService.getAudit('audit-123').subscribe({
   *   next: (audit) => console.log('Loaded audit:', audit.ExternalId),
   *   error: (error) => {
   *     if (error.status === 404) {
   *       console.log('Audit not found');
   *     }
   *   }
   * });
   * ```
   */
  getAudit(id: string): Observable<ApiAuditRecord> {
    if (!id?.trim()) {
      return throwError(() => this.createApiError('Audit ID is required', 400));
    }

    const audit = this.mockAudits.find((a) => a.ExternalId === id);
    if (!audit) {
      return throwError(() => this.createApiError('Audit record not found', 404));
    }
    return of({ ...audit }).pipe(delay(300));
  }

  /**
   * Create a new audit record.
   * 
   * @param request - The audit creation request data
   * @returns Observable of created audit record
   * @throws ApiError with status 400 when validation fails
   * 
   * @example
   * ```typescript
   * this.auditApiService.createAudit({
   *   slotNumber: 'A-001',
   *   primaryBarcode: '12345678901234',
   *   warehouseLogistics: 'Inbound',
   *   // ... other fields
   * }).subscribe({
   *   next: (audit) => console.log('Created audit:', audit.ExternalId),
   *   error: (error) => console.error('Creation failed:', error.error)
   * });
   * ```
   */
  createAudit(request: CreateAuditRequest): Observable<ApiAuditRecord> {
    // Validate required fields
    const validationError = this.validateCreateRequest(request);
    if (validationError) {
      return throwError(() => this.createApiError(validationError, 400));
    }

    try {
      const newAudit: ApiAuditRecord = {
        ExternalId: (this.mockAudits.length + 1).toString(),
        SlotNumber: request.slotNumber,
        PrimaryBarcode: request.primaryBarcode,
        WarehouseLogistics: request.warehouseLogistics,
        Comments: request.comments || '',
        DateReceived: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        TimeReceived: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
        Auditors: request.auditors,
        WarehouseLocation: request.warehouseLocation,
        Synced: 1,
      };
      
      this.mockAudits.push(newAudit);
      return of({ ...newAudit }).pipe(delay(400));
    } catch {
      return throwError(() => this.createApiError('Failed to create audit record', 500));
    }
  }

  /**
   * Update an existing audit record.
   * 
   * @param id - The external ID of the audit to update
   * @param request - Partial audit data to update
   * @returns Observable of updated audit record
   * @throws ApiError with status 404 when audit not found
   * @throws ApiError with status 400 when validation fails
   * 
   * @example
   * ```typescript
   * this.auditApiService.updateAudit('audit-123', {
   *   comments: 'Updated comment',
   *   auditors: 'Jane Doe'
   * }).subscribe({
   *   next: (audit) => console.log('Updated audit:', audit.ExternalId),
   *   error: (error) => console.error('Update failed:', error.error)
   * });
   * ```
   */
  updateAudit(id: string, request: Partial<CreateAuditRequest>): Observable<ApiAuditRecord> {
    if (!id?.trim()) {
      return throwError(() => this.createApiError('Audit ID is required', 400));
    }

    const index = this.mockAudits.findIndex((a) => a.ExternalId === id);
    if (index === -1) {
      return throwError(() => this.createApiError('Audit record not found', 404));
    }

    try {
      const updatedAudit: ApiAuditRecord = {
        ...this.mockAudits[index],
        SlotNumber: request.slotNumber ?? this.mockAudits[index].SlotNumber,
        PrimaryBarcode: request.primaryBarcode ?? this.mockAudits[index].PrimaryBarcode,
        WarehouseLogistics: request.warehouseLogistics ?? this.mockAudits[index].WarehouseLogistics,
        Comments: request.comments ?? this.mockAudits[index].Comments,
        Auditors: request.auditors ?? this.mockAudits[index].Auditors,
        WarehouseLocation: request.warehouseLocation ?? this.mockAudits[index].WarehouseLocation,
        // Keep original dates but mark as modified
        Synced: 1,
      };
      
      this.mockAudits[index] = updatedAudit;
      return of({ ...updatedAudit }).pipe(delay(400));
    } catch {
      return throwError(() => this.createApiError('Failed to update audit record', 500));
    }
  }

  /**
   * Delete an audit record.
   * 
   * @param id - The external ID of the audit to delete
   * @returns Observable that completes when deletion is successful
   * @throws ApiError with status 404 when audit not found
   * 
   * @example
   * ```typescript
   * this.auditApiService.deleteAudit('audit-123').subscribe({
   *   next: () => console.log('Audit deleted successfully'),
   *   error: (error) => console.error('Deletion failed:', error.error)
   * });
   * ```
   */
  deleteAudit(id: string): Observable<void> {
    if (!id?.trim()) {
      return throwError(() => this.createApiError('Audit ID is required', 400));
    }

    const index = this.mockAudits.findIndex((a) => a.ExternalId === id);
    if (index === -1) {
      return throwError(() => this.createApiError('Audit record not found', 404));
    }

    try {
      this.mockAudits.splice(index, 1);
      return of(void 0).pipe(delay(300));
    } catch {
      return throwError(() => this.createApiError('Failed to delete audit record', 500));
    }
  }

  /**
   * Get all unsynced audit records (for sync operations).
   * 
   * @returns Observable of unsynced audit records
   * 
   * @example
   * ```typescript
   * this.auditApiService.getUnsyncedAudits().subscribe(audits => {
   *   console.log('Unsynced audits:', audits.length);
   * });
   * ```
   */
  getUnsyncedAudits(): Observable<ApiAuditRecord[]> {
    try {
      const unsynced = this.mockAudits.filter(audit => audit.Synced === 0);
      return of([...unsynced]).pipe(delay(200));
    } catch {
      return throwError(() => this.createApiError('Failed to retrieve unsynced audits', 500));
    }
  }

  /**
   * Mark an audit record as synced.
   * 
   * @param id - The external ID of the audit to mark as synced
   * @returns Observable of the updated audit record
   * @throws ApiError with status 404 when audit not found
   * 
   * @example
   * ```typescript
   * this.auditApiService.markAsSynced('audit-123').subscribe(audit => {
   *   console.log('Marked as synced:', audit.ExternalId);
   * });
   * ```
   */
  markAsSynced(id: string): Observable<ApiAuditRecord> {
    if (!id?.trim()) {
      return throwError(() => this.createApiError('Audit ID is required', 400));
    }

    const audit = this.mockAudits.find(a => a.ExternalId === id);
    if (!audit) {
      return throwError(() => this.createApiError('Audit record not found', 404));
    }
    
    try {
      audit.Synced = 1;
      return of({ ...audit }).pipe(delay(200));
    } catch {
      return throwError(() => this.createApiError('Failed to mark audit as synced', 500));
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Create a standardized API error response.
   * 
   * @private
   */
  private createApiError(message: string, status: number): ApiError {
    return {
      error: message,
      status,
      timestamp: Date.now()
    };
  }

  /**
   * Validate audit creation request.
   * 
   * @private
   */
  private validateCreateRequest(request: CreateAuditRequest): string | null {
    if (!request) {
      return 'Request data is required';
    }

    if (!request.slotNumber?.trim()) {
      return 'Slot number is required';
    }

    if (!request.primaryBarcode?.trim()) {
      return 'Primary barcode is required';
    }

    if (!request.warehouseLogistics?.trim()) {
      return 'Warehouse logistics is required';
    }

    if (!request.auditors?.trim()) {
      return 'Auditor name is required';
    }

    if (!request.warehouseLocation?.trim()) {
      return 'Warehouse location is required';
    }

    return null;
  }
}

/**
 * Type guard to check if an error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'status' in error
  );
}