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
}

// Use environment variable or default URL
const getBackendUrl = () => {
  // Check for environment variable (works in both test and build environments)
  if (typeof process !== 'undefined' && process.env?.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
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
    onStatusChange
  } = options;

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'checking'
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkHealth = useCallback(async (): Promise<HealthStatus> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${getBackendUrl()}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
  }, []);

  const performHealthCheck = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    setHealthStatus(prev => ({ ...prev, status: 'checking' }));
    
    const newStatus = await checkHealth();
    
    if (isMountedRef.current) {
      setHealthStatus(newStatus);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    }
  }, [checkHealth, enabled, onStatusChange]);

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
    
    setHealthStatus(prev => ({ ...prev, status: 'checking' }));
    
    const newStatus = await checkHealth();
    
    if (isMountedRef.current) {
      setHealthStatus(newStatus);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    }
  }, [checkHealth, onStatusChange]);

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