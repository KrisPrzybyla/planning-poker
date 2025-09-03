import { useState, useEffect, useCallback, useRef } from 'react';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'checking';
  timestamp?: string;
  uptime?: number;
  stats?: {
    activeRooms: number;
    totalConnections: number;
  };
  error?: string;
  lastChecked?: string;
}

interface UseHealthCheckOptions {
  interval?: number; // Check interval in milliseconds
  enabled?: boolean; // Whether to enable health checks
  onStatusChange?: (status: HealthStatus) => void;
  // Optional tuning
  failureThreshold?: number; // consecutive failures required to mark unhealthy
  successThreshold?: number; // consecutive successes required to mark healthy
  timeoutMs?: number; // timeout for a single request
  retryOnce?: boolean; // whether to retry once on failure
}

// Use environment variable or default URL
const getBackendUrl = () => {
  // Check for environment variable (works in both test and build environments)
  if (typeof process !== 'undefined' && (process as any).env?.VITE_BACKEND_URL) {
    return (process as any).env.VITE_BACKEND_URL as string;
  }
  
  // In production/Docker, use the same host as the current page
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Default fallback URL for development
  return 'http://127.0.0.1:3000';
};

export const useHealthCheck = (options: UseHealthCheckOptions = {}) => {
  const {
    interval = 30000, // Default: check every 30 seconds
    enabled = true,
    onStatusChange,
    // Defaults chosen to match existing tests; can be overridden by caller
    failureThreshold = 1,
    successThreshold = 1,
    timeoutMs = 5000,
    retryOnce = false,
  } = options;

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'checking'
  });

  const isMountedRef = useRef(true);
  const consecutiveFailuresRef = useRef(0);
  const consecutiveSuccessesRef = useRef(0);
  const lastEmittedStatusRef = useRef<'healthy' | 'unhealthy' | 'checking'>('checking');

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchWithTimeout = async (url: string, ms: number, signal?: AbortSignal) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: signal ?? controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const rawHealthProbe = useCallback(async (): Promise<HealthStatus> => {
    try {
      let response: Response | null = null;
      try {
        response = await fetchWithTimeout(`${getBackendUrl()}/api/health`, timeoutMs);
      } catch (e) {
        if (retryOnce) {
          // brief wait before retry
          await new Promise((r) => setTimeout(r, 300));
          response = await fetchWithTimeout(`${getBackendUrl()}/api/health`, timeoutMs);
        } else {
          throw e;
        }
      }

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const status: HealthStatus = {
        status: 'healthy',
        timestamp: data.timestamp,
        uptime: data.uptime,
        stats: data.stats,
        lastChecked: new Date().toISOString()
      };

      return status;
    } catch (error) {
      const status: HealthStatus = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };

      return status;
    }
  }, [timeoutMs, retryOnce]);

  const emitIfChanged = useCallback((next: HealthStatus) => {
    const prev = lastEmittedStatusRef.current;
    if (next.status !== prev) {
      lastEmittedStatusRef.current = next.status;
      if (onStatusChange) onStatusChange(next);
    }
  }, [onStatusChange]);

  const performHealthCheck = useCallback(async (force = false) => {
    if ((!enabled && !force) || !isMountedRef.current) return;

    // Update UI to checking, but do not emit change notification here
    setHealthStatus((prev) => ({ ...prev, status: 'checking' }));

    const raw = await rawHealthProbe();
    if (!isMountedRef.current) return;

    let effective: HealthStatus = raw;

    if (raw.status === 'healthy') {
      consecutiveSuccessesRef.current += 1;
      consecutiveFailuresRef.current = 0;

      const shouldEmitHealthy = consecutiveSuccessesRef.current >= successThreshold || lastEmittedStatusRef.current === 'checking';
      if (shouldEmitHealthy) {
        effective = raw; // healthy
      } else {
        // keep current emitted status (likely unhealthy) until success threshold reached
        effective = { ...raw, status: lastEmittedStatusRef.current } as HealthStatus;
      }
    } else {
      // unhealthy raw
      consecutiveFailuresRef.current += 1;
      consecutiveSuccessesRef.current = 0;

      if (consecutiveFailuresRef.current >= failureThreshold) {
        effective = raw; // unhealthy
      } else {
        // keep current status (healthy/checking) until failures threshold reached
        effective = { ...raw, status: lastEmittedStatusRef.current } as HealthStatus;
      }
    }

    // Update state
    setHealthStatus(effective);
    emitIfChanged(effective);
  }, [enabled, rawHealthProbe, emitIfChanged, successThreshold, failureThreshold]);

  useEffect(() => {
    if (!enabled) return;

    // Perform initial health check
    performHealthCheck();

    // Set up interval for periodic checks
    const intervalId = setInterval(performHealthCheck, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [performHealthCheck, interval, enabled]);

  // Manual health check function
  const manualCheck = useCallback(async () => {
    if (!isMountedRef.current) return;
    await performHealthCheck(true);
  }, [performHealthCheck]);

  return {
    healthStatus,
    isHealthy: healthStatus.status === 'healthy',
    isUnhealthy: healthStatus.status === 'unhealthy',
    isChecking: healthStatus.status === 'checking',
    manualCheck,
    lastChecked: healthStatus.lastChecked
  };
};

export default useHealthCheck;
