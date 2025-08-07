import { renderHook, waitFor, act } from '@testing-library/react';
import { useHealthCheck } from '../../../src/hooks/useHealthCheck';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
const originalEnv = process.env;

describe('useHealthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    process.env = originalEnv;
  });

  describe('Initial State', () => {
    test('should start with checking status', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'healthy',
          timestamp: '2024-01-01T00:00:00.000Z',
          uptime: 3600,
          stats: { activeRooms: 5, totalConnections: 10 }
        })
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      expect(result.current.healthStatus.status).toBe('checking');
      expect(result.current.isChecking).toBe(true);
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.isUnhealthy).toBe(false);
    });
  });

  describe('Successful Health Check', () => {
    test('should update status to healthy on successful response', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 3600,
        stats: { activeRooms: 5, totalConnections: 10 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useHealthCheck({ interval: 1000 }));

      await waitFor(() => {
        expect(result.current.isHealthy).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.healthStatus.status).toBe('healthy');
      expect(result.current.healthStatus.timestamp).toBe(mockResponse.timestamp);
      expect(result.current.healthStatus.uptime).toBe(mockResponse.uptime);
      expect(result.current.healthStatus.stats).toEqual(mockResponse.stats);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isUnhealthy).toBe(false);
    });

    test('should call fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      renderHook(() => useHealthCheck());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost/api/health',
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    test('should use custom backend URL from environment', async () => {
      process.env.VITE_BACKEND_URL = 'http://custom-backend:8080';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      renderHook(() => useHealthCheck());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://custom-backend:8080/api/health',
          expect.any(Object)
        );
      });
    });
  });

  describe('Failed Health Check', () => {
    test('should update status to unhealthy on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      await act(async () => {
        await result.current.manualCheck();
      });

      expect(result.current.healthStatus.status).toBe('unhealthy');
      expect(result.current.healthStatus.error).toBe('Network error');
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.isChecking).toBe(false);
    });

    test('should update status to unhealthy on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      await act(async () => {
        await result.current.manualCheck();
      });

      expect(result.current.healthStatus.status).toBe('unhealthy');
      expect(result.current.healthStatus.error).toBe('Health check failed: 500 Internal Server Error');
    });

    test('should handle timeout', async () => {
      // Mock a fetch that rejects with AbortError when aborted
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 5000);
        });
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      // Trigger manual check and advance timers
      await act(async () => {
        const checkPromise = result.current.manualCheck();
        jest.advanceTimersByTime(6000);
        await checkPromise;
      });

      expect(result.current.healthStatus.status).toBe('unhealthy');
      expect(result.current.healthStatus.error).toContain('aborted');
    });
  });

  describe('Periodic Checks', () => {
    test('should perform periodic health checks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      renderHook(() => useHealthCheck({ interval: 1000 }));

      // Initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Advance time and check for second call
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Advance time and check for third call
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    test('should not perform checks when disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      renderHook(() => useHealthCheck({ enabled: false, interval: 1000 }));

      // Advance time
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Manual Check', () => {
    test('should allow manual health check', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.isChecking).toBe(true);
      });

      // Perform manual check
      await act(async () => {
        result.current.manualCheck();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      expect(result.current.isHealthy).toBe(true);
    });
  });

  describe('Status Change Callback', () => {
    test('should call onStatusChange callback', async () => {
      const onStatusChange = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false, onStatusChange }));

      await act(async () => {
        await result.current.manualCheck();
      });

      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy'
        })
      );
    });

    test('should call onStatusChange on error', async () => {
      const onStatusChange = jest.fn();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHealthCheck({ enabled: false, onStatusChange }));

      await act(async () => {
        await result.current.manualCheck();
      });

      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Network error'
        })
      );
    });
  });

  describe('Last Checked Timestamp', () => {
    test('should update lastChecked timestamp', async () => {
      const fixedDate = new Date('2024-01-01T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });

      const { result } = renderHook(() => useHealthCheck({ enabled: false }));

      await act(async () => {
        await result.current.manualCheck();
      });

      expect(result.current.lastChecked).toBe('2024-01-01T12:00:00.000Z');

      jest.restoreAllMocks();
    });
  });
});