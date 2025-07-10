import { Injectable, signal, computed } from '@angular/core';
import { AuditRecord } from '../models';

/**
 * Service responsible for managing audit application state using Angular signals.
 * This service provides reactive state management for audit records and related UI state.
 * 
 * Key responsibilities:
 * - Manage audit records collection state
 * - Handle selected audit state
 * - Manage loading and error states
 * - Provide computed derived state
 * 
 * @example
 * ```typescript
 * // Read state
 * const audits = this.auditStateService.audits();
 * const loading = this.auditStateService.loading();
 * 
 * // Update state
 * this.auditStateService.setAudits(newAudits);
 * this.auditStateService.setLoading(true);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuditStateService {
  // ==========================================================================
  // PRIVATE STATE SIGNALS
  // ==========================================================================

  /** Private signal for audit records collection */
  private readonly _audits = signal<AuditRecord[]>([]);
  
  /** Private signal for currently selected audit */
  private readonly _selectedAudit = signal<AuditRecord | null>(null);
  
  /** Private signal for loading state */
  private readonly _loading = signal<boolean>(false);
  
  /** Private signal for error state */
  private readonly _error = signal<string | null>(null);

  // ==========================================================================
  // PUBLIC READONLY SIGNALS - Exposed for component consumption
  // ==========================================================================

  /** Observable audit records collection */
  readonly audits = this._audits.asReadonly();
  
  /** Observable selected audit record */
  readonly selectedAudit = this._selectedAudit.asReadonly();
  
  /** Observable loading state */
  readonly loading = this._loading.asReadonly();
  
  /** Observable error state */
  readonly error = this._error.asReadonly();

  // ==========================================================================
  // COMPUTED DERIVED STATE
  // ==========================================================================

  /** Total number of audit records */
  readonly auditCount = computed(() => this._audits().length);
  
  /** Whether any audits are loaded */
  readonly hasAudits = computed(() => this._audits().length > 0);
  
  /** Whether an error is present */
  readonly hasError = computed(() => this._error() !== null);
  
  /** Whether an audit is currently selected */
  readonly isAuditSelected = computed(() => this._selectedAudit() !== null);

  // Computed filtered/sorted data
  readonly auditsByLocation = computed(() => {
    const audits = this._audits();
    const locations = [...new Set(audits.map((audit) => audit.warehouseLocation))];
    return locations.map((location) => ({
      location,
      audits: audits.filter((audit) => audit.warehouseLocation === location),
    }));
  });

  // ==========================================================================
  // STATE MUTATION METHODS
  // ==========================================================================

  /**
   * Set the complete audit records collection.
   * 
   * @param audits - Array of audit records to set
   * 
   * @example
   * ```typescript
   * this.auditStateService.setAudits(newAudits);
   * ```
   */
  setAudits(audits: AuditRecord[]): void {
    this._audits.set([...audits]); // Create defensive copy
  }

  /**
   * Add a new audit record to the collection.
   * 
   * @param audit - The audit record to add
   * 
   * @example
   * ```typescript
   * this.auditStateService.addAudit(newAudit);
   * ```
   */
  addAudit(audit: AuditRecord): void {
    this._audits.update((current) => [...current, audit]);
  }

  /**
   * Update an existing audit record in the collection.
   * Also updates the selected audit if it matches the updated record.
   * 
   * @param updatedAudit - The updated audit record
   * 
   * @example
   * ```typescript
   * this.auditStateService.updateAudit(modifiedAudit);
   * ```
   */
  updateAudit(updatedAudit: AuditRecord): void {
    this._audits.update((current) =>
      current.map((audit) => (audit.externalId === updatedAudit.externalId ? updatedAudit : audit))
    );
    // Update selected audit if it's the one being updated
    if (this._selectedAudit()?.externalId === updatedAudit.externalId) {
      this._selectedAudit.set(updatedAudit);
    }
  }

  /**
   * Remove an audit record from the collection.
   * Also clears the selection if the removed audit was selected.
   * 
   * @param auditId - The external ID of the audit to remove
   * 
   * @example
   * ```typescript
   * this.auditStateService.removeAudit('audit-123');
   * ```
   */
  removeAudit(auditId: string): void {
    this._audits.update((current) => current.filter((audit) => audit.externalId !== auditId));
    // Clear selection if the selected audit is being removed
    if (this._selectedAudit()?.externalId === auditId) {
      this._selectedAudit.set(null);
    }
  }

  /**
   * Set the currently selected audit record.
   * 
   * @param audit - The audit to select, or null to clear selection
   * 
   * @example
   * ```typescript
   * this.auditStateService.selectAudit(auditToSelect);
   * this.auditStateService.selectAudit(null); // Clear selection
   * ```
   */
  selectAudit(audit: AuditRecord | null): void {
    this._selectedAudit.set(audit);
  }

  /**
   * Set the loading state.
   * 
   * @param loading - Whether the application is in a loading state
   * 
   * @example
   * ```typescript
   * this.auditStateService.setLoading(true);
   * ```
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Set an error message.
   * 
   * @param error - Error message or null to clear error
   * 
   * @example
   * ```typescript
   * this.auditStateService.setError('Failed to load audits');
   * this.auditStateService.setError(null); // Clear error
   * ```
   */
  setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Clear any existing error message.
   * 
   * @example
   * ```typescript
   * this.auditStateService.clearError();
   * ```
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all state to initial values.
   * 
   * @example
   * ```typescript
   * this.auditStateService.reset();
   * ```
   */
  reset(): void {
    this._audits.set([]);
    this._selectedAudit.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}