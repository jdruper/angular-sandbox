import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AuditActionService, 
  AuditStateService, 
  SyncStateService,
  AuditStorageService,
  NetworkStatusService 
} from '../../../../sandbox/services';
import { AuditRecord } from '../../../../sandbox/models';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats.component';

// Smart component - connects to ActionService, handles business logic
@Component({
  selector: 'app-inventory-dashboard',
  imports: [CommonModule, DashboardStatsComponent],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss',
  providers: [
    AuditActionService, 
    AuditStateService, 
    SyncStateService,
    AuditStorageService
  ], // Component-scoped services
})
export class InventoryDashboardComponent implements OnInit {
  // Inject the component-scoped ActionService
  private actionService = inject(AuditActionService);

  // Expose ActionService state directly to template
  audits = this.actionService.audits;
  loading = this.actionService.loading;
  error = this.actionService.error;
  selectedAudit = this.actionService.selectedAudit;
  
  // Computed business logic from ActionService
  auditSummary = this.actionService.auditSummary;
  auditsByLocation = this.actionService.auditsByLocation;
  auditCount = this.actionService.auditCount;

  // PWA and sync state
  isOnline = this.actionService.isOnline;
  isOffline = this.actionService.isOffline;
  syncStatus = this.actionService.syncStatus;
  isSyncing = this.actionService.isSyncing;
  pendingAuditsCount = this.actionService.pendingAuditsCount;
  hasConflicts = this.actionService.hasConflicts;
  syncError = this.actionService.syncError;

  ngOnInit(): void {
    console.log('📋 InventoryDashboardComponent.ngOnInit() called');
    console.log('📋 ActionService instance:', this.actionService);
    // Load data on component initialization
    this.actionService.loadAudits();
  }

  onAuditSelected(audit: AuditRecord): void {
    this.actionService.selectAudit(audit.externalId);
  }

  onAuditDeleted(auditId: string): void {
    this.actionService.deleteAudit(auditId);
  }

  onAuditEdited(audit: AuditRecord): void {
    // In a real app, this would open an edit modal/form
    console.log('Edit audit:', audit);
  }

  clearError(): void {
    this.actionService.clearError();
  }

  // PWA and sync actions
  syncToServer(): void {
    this.actionService.syncToServer();
  }

  clearSyncError(): void {
    this.actionService.clearSyncError();
  }

  // Test method for sync functionality
  addTestAudit(): void {
    const testAudit = {
      slotNumber: `TEST-${Date.now()}`,
      primaryBarcode: `TEST${Math.random().toString().substr(2, 8)}`,
      warehouseLogistics: 'Test Entry',
      comments: 'Test audit record for sync testing',
      auditors: 'Test User',
      warehouseLocation: 'Test Location'
    };
    
    this.actionService.createAudit(testAudit);
  }
}
