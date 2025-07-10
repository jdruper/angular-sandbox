import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  // Network status signals
  private _isOnline = signal<boolean>(navigator.onLine);
  private _networkInfo = signal<NetworkInfo>({
    status: navigator.onLine ? 'online' : 'offline'
  });

  // Public readonly signals
  readonly isOnline = this._isOnline.asReadonly();
  readonly isOffline = computed(() => !this._isOnline());
  readonly networkInfo = this._networkInfo.asReadonly();
  readonly networkStatus = computed(() => this._networkInfo().status);

  // Connection quality indicators
  readonly isSlowConnection = computed(() => this._networkInfo().status === 'slow');
  readonly isFastConnection = computed(() => 
    this._networkInfo().status === 'online' && 
    (this._networkInfo().downlink ?? 0) > 1.5
  );

  constructor() {
    this.initNetworkMonitoring();
  }

  /**
   * Initialize network status monitoring
   */
  private initNetworkMonitoring(): void {
    // Monitor online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        distinctUntilChanged(),
        debounceTime(100) // Debounce to prevent rapid toggles
      )
      .subscribe(isOnline => {
        this._isOnline.set(isOnline);
        this.updateNetworkInfo();
      });

    // Monitor network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Listen for connection changes
        connection.addEventListener('change', () => {
          this.updateNetworkInfo();
        });
      }
    }

    // Initial network info update
    this.updateNetworkInfo();
  }

  /**
   * Update network information based on current status
   */
  private updateNetworkInfo(): void {
    const isOnline = this._isOnline();
    let networkInfo: NetworkInfo = {
      status: isOnline ? 'online' : 'offline'
    };

    if (isOnline && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        networkInfo = {
          status: this.determineConnectionQuality(connection),
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
    }

    this._networkInfo.set(networkInfo);
  }

  /**
   * Determine connection quality based on network information
   */
  private determineConnectionQuality(connection: any): NetworkStatus {
    if (!connection) return 'online';

    // Check for slow connection indicators
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;
    const rtt = connection.rtt;

    // Define slow connection thresholds
    const isSlowEffectiveType = effectiveType && ['slow-2g', '2g'].includes(effectiveType);
    const isSlowDownlink = downlink && downlink < 0.5; // Less than 0.5 Mbps
    const isHighRtt = rtt && rtt > 2000; // More than 2 seconds round trip

    if (isSlowEffectiveType || isSlowDownlink || isHighRtt) {
      return 'slow';
    }

    return 'online';
  }

  /**
   * Test network connectivity by making a lightweight request
   */
  testConnectivity(): Observable<boolean> {
    return new Observable(observer => {
      // Create a small image request to test connectivity
      const img = new Image();
      const timeout = setTimeout(() => {
        observer.next(false);
        observer.complete();
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        observer.next(true);
        observer.complete();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        observer.next(false);
        observer.complete();
      };

      // Use a cache-busting URL to ensure fresh request
      img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`; // Minimal SVG
    });
  }

  /**
   * Get network status as observable for reactive programming
   */
  getNetworkStatus(): Observable<NetworkStatus> {
    return new Observable(observer => {
      // Emit current status
      observer.next(this.networkStatus());

      // Create effect to watch for changes
      const unsubscribe = () => {
        // Effect cleanup would go here if needed
      };

      return unsubscribe;
    });
  }

  /**
   * Check if current connection is suitable for sync operations
   */
  isSyncRecommended(): boolean {
    const info = this._networkInfo();
    
    // Don't sync if offline
    if (info.status === 'offline') return false;
    
    // Don't sync if user has data saving enabled
    if (info.saveData) return false;
    
    // Don't sync on very slow connections
    if (info.status === 'slow') return false;
    
    return true;
  }

  /**
   * Get recommended sync strategy based on network conditions
   */
  getSyncStrategy(): 'immediate' | 'delayed' | 'skip' {
    const info = this._networkInfo();
    
    if (info.status === 'offline') return 'skip';
    if (info.status === 'slow' || info.saveData) return 'delayed';
    if (this.isFastConnection()) return 'immediate';
    
    return 'delayed';
  }

  /**
   * Force refresh network status
   */
  refreshNetworkStatus(): void {
    this._isOnline.set(navigator.onLine);
    this.updateNetworkInfo();
  }

  /**
   * Simulate offline mode for testing
   */
  simulateOffline(): void {
    this._isOnline.set(false);
    this._networkInfo.set({ status: 'offline' });
  }

  /**
   * Simulate slow connection for testing
   */
  simulateSlowConnection(): void {
    this._isOnline.set(true);
    this._networkInfo.set({
      status: 'slow',
      effectiveType: '2g',
      downlink: 0.25,
      rtt: 3000
    });
  }

  /**
   * Reset to actual network status
   */
  resetToActualStatus(): void {
    this.refreshNetworkStatus();
  }
}