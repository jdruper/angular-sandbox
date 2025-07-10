/**
 * Sandbox Pattern Application Models
 * 
 * This module exports all data models and interfaces used throughout the sandbox
 * pattern application. The models are organized by domain and responsibility:
 * 
 * - **API Models**: Raw HTTP request/response interfaces for server communication
 * - **Sync Models**: Offline-first synchronization and conflict resolution interfaces
 * - **Audit Models**: Domain models for barcode audit records and warehouse operations
 * 
 * @example
 * ```typescript
 * // Import specific interfaces
 * import { AuditRecord, CreateAuditRequest, SyncStatus } from './models';
 * 
 * // Or import all models
 * import * as Models from './models';
 * const auditRecord: Models.AuditRecord = { ... };
 * ```
 * 
 * @module Models
 */

// API layer interfaces for HTTP communication
export * from './api.model';

// Synchronization and conflict resolution models
export * from './sync.model';

// Barcode audit domain models
export * from './audit.model';