/**
 * Domain models for barcode audit records
 * 
 * This file contains the core data models for handling barcode audit operations
 * in the warehouse management system. It includes both domain models (used internally
 * by the application) and API models (matching the database structure).
 * 
 * The audit system tracks inventory items through various warehouse processes,
 * maintaining detailed records of barcodes, locations, and audit trail information.
 */

/**
 * Core domain model representing a barcode audit record
 * 
 * This interface represents the internal application model for audit records.
 * It uses camelCase naming convention and includes TypeScript-friendly types
 * like Date objects. This model is used throughout the application logic.
 * 
 * @example
 * ```typescript
 * const auditRecord: AuditRecord = {
 *   externalId: "EXT-12345",
 *   slotNumber: "A1-B2-C3",
 *   primaryBarcode: "123456789012",
 *   warehouseLogistics: "INBOUND",
 *   comments: "Item in good condition",
 *   dateReceived: new Date("2023-10-15"),
 *   timeReceived: "14:30:00",
 *   auditors: "John Doe, Jane Smith",
 *   warehouseLocation: "Section A, Row 1",
 *   synced: true
 * };
 * ```
 */
export interface AuditRecord {
  /** 
   * Unique external identifier for the audit record
   * Format: Usually alphanumeric, assigned by external systems
   */
  externalId: string;
  
  /** 
   * Warehouse slot number where the item is located
   * Format: Typically hierarchical (e.g., "A1-B2-C3" for Aisle A1, Bay B2, Shelf C3)
   */
  slotNumber: string;
  
  /** 
   * Primary barcode identifier for the item
   * Constraints: Must be a valid barcode format (UPC, EAN, Code128, etc.)
   */
  primaryBarcode: string;
  
  /** 
   * Warehouse logistics operation type
   * Common values: "INBOUND", "OUTBOUND", "TRANSFER", "CYCLE_COUNT"
   */
  warehouseLogistics: string;
  
  /** 
   * Additional comments or notes about the audit
   * Optional field for capturing special conditions, damages, or other observations
   */
  comments: string;
  
  /** 
   * Date when the item was received in the warehouse
   * Used for tracking inventory age and audit trail
   */
  dateReceived: Date;
  
  /** 
   * Time when the item was received (HH:MM:SS format)
   * Provides more precise timing information than dateReceived
   */
  timeReceived: string;
  
  /** 
   * Names of auditors who performed the audit
   * Format: Comma-separated list of auditor names
   */
  auditors: string;
  
  /** 
   * Physical location within the warehouse
   * Human-readable description of where the item is stored
   */
  warehouseLocation: string;
  
  /** 
   * Indicates whether this record has been synchronized with the server
   * Optional field used for offline/online sync management
   */
  synced?: boolean;
}

/**
 * API model matching the database structure
 * 
 * This interface represents the exact structure of audit records as they exist
 * in the database and are transmitted over the API. It uses PascalCase naming
 * convention to match the database schema and includes string-based dates for
 * JSON serialization compatibility.
 * 
 * @example
 * ```typescript
 * const apiRecord: ApiAuditRecord = {
 *   ExternalId: "EXT-12345",
 *   SlotNumber: "A1-B2-C3",
 *   PrimaryBarcode: "123456789012",
 *   WarehouseLogistics: "INBOUND",
 *   Comments: "Item in good condition",
 *   DateReceived: "2023-10-15",
 *   TimeReceived: "14:30:00",
 *   Auditors: "John Doe, Jane Smith",
 *   WarehouseLocation: "Section A, Row 1",
 *   Synced: 1
 * };
 * ```
 * 
 * @see AuditRecord - The domain model equivalent of this interface
 */
export interface ApiAuditRecord {
  /** External identifier (PascalCase for database compatibility) */
  ExternalId: string;
  
  /** Warehouse slot number (PascalCase for database compatibility) */
  SlotNumber: string;
  
  /** Primary barcode identifier (PascalCase for database compatibility) */
  PrimaryBarcode: string;
  
  /** Warehouse logistics operation type (PascalCase for database compatibility) */
  WarehouseLogistics: string;
  
  /** Additional comments or notes (PascalCase for database compatibility) */
  Comments: string;
  
  /** 
   * Date received as ISO string (YYYY-MM-DD format)
   * PascalCase for database compatibility
   */
  DateReceived: string;
  
  /** 
   * Time received as string (HH:MM:SS format)
   * PascalCase for database compatibility
   */
  TimeReceived: string;
  
  /** 
   * Comma-separated list of auditor names
   * PascalCase for database compatibility
   */
  Auditors: string;
  
  /** 
   * Physical warehouse location description
   * PascalCase for database compatibility
   */
  WarehouseLocation: string;
  
  /** 
   * Sync status as numeric value (0 = false, 1 = true)
   * Optional field, PascalCase for database compatibility
   */
  Synced?: number;
}

/**
 * Request model for creating new audit records
 * 
 * This interface defines the required fields for creating a new audit record.
 * It excludes system-generated fields like externalId, dateReceived, and
 * sync status, which are handled automatically by the system.
 * 
 * @example
 * ```typescript
 * const createRequest: CreateAuditRequest = {
 *   slotNumber: "A1-B2-C3",
 *   primaryBarcode: "123456789012",
 *   warehouseLogistics: "INBOUND",
 *   comments: "New item received in good condition",
 *   auditors: "John Doe",
 *   warehouseLocation: "Section A, Row 1"
 * };
 * 
 * // Usage with API
 * const response = await auditService.createAudit(createRequest);
 * ```
 */
export interface CreateAuditRequest {
  /** 
   * Warehouse slot number for the new audit record
   * Required field, must follow warehouse slot naming conventions
   */
  slotNumber: string;
  
  /** 
   * Primary barcode for the item being audited
   * Required field, must be a valid barcode format
   */
  primaryBarcode: string;
  
  /** 
   * Type of warehouse logistics operation
   * Required field, should match predefined operation types
   */
  warehouseLogistics: string;
  
  /** 
   * Additional comments or observations
   * Required field, can be empty string if no comments
   */
  comments: string;
  
  /** 
   * Names of auditors performing the audit
   * Required field, comma-separated if multiple auditors
   */
  auditors: string;
  
  /** 
   * Physical location description within the warehouse
   * Required field, should be descriptive and accurate
   */
  warehouseLocation: string;
}

/**
 * Request model for updating existing audit records
 * 
 * This interface extends CreateAuditRequest to include the externalId field
 * required for identifying which record to update. All fields from the create
 * request are included and can be modified.
 * 
 * @example
 * ```typescript
 * const updateRequest: UpdateAuditRequest = {
 *   externalId: "EXT-12345",
 *   slotNumber: "A1-B2-C4", // Updated slot number
 *   primaryBarcode: "123456789012",
 *   warehouseLogistics: "OUTBOUND", // Changed operation type
 *   comments: "Item moved to outbound area",
 *   auditors: "Jane Smith",
 *   warehouseLocation: "Section B, Row 2"
 * };
 * 
 * // Usage with API
 * const response = await auditService.updateAudit(updateRequest);
 * ```
 * 
 * @see CreateAuditRequest - The base interface this extends
 */
export interface UpdateAuditRequest extends CreateAuditRequest {
  /** 
   * External identifier of the audit record to update
   * Required field for identifying the specific record to modify
   */
  externalId: string;
}

/**
 * Offline storage model with conflict resolution capabilities
 * 
 * This interface extends the API model to include additional fields needed
 * for offline-first functionality. It tracks local modifications, sync status,
 * and conflict resolution data when the application operates without network
 * connectivity.
 * 
 * The offline model enables the app to:
 * - Store records locally when offline
 * - Track which records need to be synced
 * - Handle conflicts when the same record is modified both locally and remotely
 * - Maintain data integrity across online/offline transitions
 * 
 * @example
 * ```typescript
 * const offlineRecord: OfflineAuditRecord = {
 *   // All ApiAuditRecord fields
 *   ExternalId: "EXT-12345",
 *   SlotNumber: "A1-B2-C3",
 *   PrimaryBarcode: "123456789012",
 *   WarehouseLogistics: "INBOUND",
 *   Comments: "Item in good condition",
 *   DateReceived: "2023-10-15",
 *   TimeReceived: "14:30:00",
 *   Auditors: "John Doe",
 *   WarehouseLocation: "Section A, Row 1",
 *   Synced: 1,
 *   
 *   // Offline-specific fields
 *   _localId: "local-uuid-123",
 *   _status: "pending",
 *   _lastModified: 1697371800000,
 *   _conflictData: { // server version for conflict resolution  }
 * };
 * ```
 * 
 * @see ApiAuditRecord - The base API model this extends
 */
export interface OfflineAuditRecord extends ApiAuditRecord {
  /** 
   * Local unique identifier for offline tracking
   * Generated locally (usually UUID) to track records before they get server IDs
   */
  _localId: string;
  
  /** 
   * Current synchronization status of the record
   * - 'synced': Record is up-to-date with server
   * - 'pending': Record has local changes that need to be synced
   * - 'deleted': Record was deleted locally and deletion needs to be synced
   */
  _status: 'synced' | 'pending' | 'deleted';
  
  /** 
   * Timestamp of last local modification
   * Used for conflict resolution and determining sync priority
   * Format: Unix timestamp in milliseconds
   */
  _lastModified: number;
  
  /** 
   * Server version of the record for conflict resolution
   * Present when there's a conflict between local and server versions
   * Contains the server's version of the data for manual or automatic resolution
   */
  _conflictData?: ApiAuditRecord;
}