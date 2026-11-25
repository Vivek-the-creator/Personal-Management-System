/**
 * Connectivity Monitor
 *
 * Wraps browser online/offline events + an actual health ping to determine
 * true connectivity. navigator.onLine can be true even when the API is
 * unreachable (captive portals, VPN issues, etc.).
 */

import { API_BASE_URL } from "@/constants";

type ConnectivityListener = (online: boolean) => void;

class ConnectivityMonitor {
  private _isOnline: boolean = navigator.onLine;
  private _listeners: Set<ConnectivityListener> = new Set();
  private _pingInProgress = false;

  constructor() {
    window.addEventListener("online", () => this._handleBrowserEvent(true));
    window.addEventListener("offline", () => this._handleBrowserEvent(false));
  }

  /** Current connectivity status (last verified) */
  get isOnline(): boolean {
    return this._isOnline;
  }

  /** Subscribe to connectivity changes */
  subscribe(listener: ConnectivityListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Ping the backend health endpoint to verify actual API reachability.
   * Returns true if the backend responds successfully.
   */
  async ping(): Promise<boolean> {
    if (typeof window !== "undefined" && !navigator.onLine) {
      this._setOnline(false);
      return false;
    }
    if (this._pingInProgress) return this._isOnline;
    this._pingInProgress = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      const reachable = res.ok;
      this._setOnline(reachable);
      return reachable;
    } catch {
      this._setOnline(false);
      return false;
    } finally {
      this._pingInProgress = false;
    }
  }

  private _handleBrowserEvent(browserSaysOnline: boolean) {
    if (!browserSaysOnline) {
      // Browser says offline → trust it immediately
      this._setOnline(false);
    } else {
      // Browser says online → verify with a ping before notifying
      this.ping();
    }
  }

  private _setOnline(online: boolean) {
    if (this._isOnline === online) return; // No change
    this._isOnline = online;
    this._listeners.forEach((l) => l(online));
  }
}

/** Singleton instance used throughout the app */
export const connectivityMonitor = new ConnectivityMonitor();
