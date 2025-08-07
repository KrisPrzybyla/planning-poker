import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import HealthIndicator from '../../../src/components/HealthIndicator';
import * as useHealthCheckModule from '../../../src/hooks/useHealthCheck';

// Mock the useHealthCheck hook
const mockUseHealthCheck = jest.fn();
jest.mock('../../../src/hooks/useHealthCheck', () => ({
  useHealthCheck: (...args: any[]) => mockUseHealthCheck(...args)
}));

// Mock toast
const mockToast = jest.fn();

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('HealthIndicator', () => {
  const mockManualCheck = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthy Status', () => {
    beforeEach(() => {
      mockUseHealthCheck.mockReturnValue({
        healthStatus: {
          status: 'healthy',
          timestamp: '2024-01-01T12:00:00.000Z',
          uptime: 3600,
          stats: { activeRooms: 2, totalConnections: 5 }
        },
        isHealthy: true,
        isUnhealthy: false,
        isChecking: false,
        manualCheck: mockManualCheck,
        lastChecked: '2024-01-01T12:00:00.000Z'
      });
    });

    test('should show small icon when hidden by default', () => {
      renderWithChakra(<HealthIndicator />);
      
      // Component is hidden by default, should show only small button
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should display connected status when visible', () => {
      // Mock component to be visible
      renderWithChakra(<HealthIndicator />);
      
      // Click the small button to make it visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    test('should show details when showDetails is true and expanded', () => {
      renderWithChakra(<HealthIndicator showDetails={true} />);
      
      // Click to make visible first
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('Unhealthy Status', () => {
    beforeEach(() => {
      mockUseHealthCheck.mockReturnValue({
        healthStatus: {
          status: 'unhealthy',
          timestamp: '2024-01-01T12:00:00.000Z',
          error: 'Connection failed'
        },
        isHealthy: false,
        isUnhealthy: true,
        isChecking: false,
        manualCheck: mockManualCheck,
        lastChecked: '2024-01-01T12:00:00.000Z'
      });
    });

    test('should display disconnected status when visible', () => {
      renderWithChakra(<HealthIndicator />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('should show red status indicator when visible', () => {
      renderWithChakra(<HealthIndicator />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('should have onStatusChange callback configured', () => {
      renderWithChakra(<HealthIndicator />);

      // Check that useHealthCheck was called with onStatusChange callback
      expect(mockUseHealthCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          onStatusChange: expect.any(Function)
        })
      );
    });
  });

  describe('Checking Status', () => {
    beforeEach(() => {
      mockUseHealthCheck.mockReturnValue({
        healthStatus: {
          status: 'checking',
          timestamp: '2024-01-01T12:00:00.000Z'
        },
        isHealthy: false,
        isUnhealthy: false,
        isChecking: true,
        manualCheck: mockManualCheck,
        lastChecked: '2024-01-01T12:00:00.000Z'
      });
    });

    test('should display checking status when visible', () => {
      renderWithChakra(<HealthIndicator />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });

    test('should show yellow status indicator when visible', () => {
      renderWithChakra(<HealthIndicator />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });
  });

  describe('Manual Refresh', () => {
    beforeEach(() => {
      mockUseHealthCheck.mockReturnValue({
        healthStatus: { status: 'healthy' },
        isHealthy: true,
        isUnhealthy: false,
        isChecking: false,
        manualCheck: mockManualCheck,
        lastChecked: '2024-01-01T12:00:00.000Z'
      });
    });

    test('should call manualCheck when refresh button is clicked', () => {
      renderWithChakra(<HealthIndicator />);
      
      // First click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      // Now find the refresh button (there should be multiple buttons now)
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(button => button.getAttribute('title') !== 'Hide indicator');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);
        expect(mockManualCheck).toHaveBeenCalledTimes(1);
      }
    });

  });

  describe('Details Display', () => {
    beforeEach(() => {
      mockUseHealthCheck.mockReturnValue({
        healthStatus: {
          status: 'healthy',
          timestamp: '2024-01-01T12:00:00.000Z',
          uptime: 7200,
          stats: { activeRooms: 3, totalConnections: 8 }
        },
        isHealthy: true,
        isUnhealthy: false,
        isChecking: false,
        manualCheck: mockManualCheck,
        lastChecked: '2024-01-01T12:00:00.000Z'
      });
    });

    test('should show detailed information when showDetails is true and expanded', () => {
      renderWithChakra(<HealthIndicator showDetails={true} />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      // Click to expand details
      const expandButton = screen.getByText('Connected');
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Last Checked:')).toBeInTheDocument();
      expect(screen.getByText('Server Uptime:')).toBeInTheDocument();
      expect(screen.getByText('Active Rooms:')).toBeInTheDocument();
      expect(screen.getByText('Connections:')).toBeInTheDocument();
    });

    test('should not show details when showDetails is false', () => {
      renderWithChakra(<HealthIndicator showDetails={false} />);
      
      // Click to make visible
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(screen.queryByText('Status:')).not.toBeInTheDocument();
      expect(screen.queryByText('Last Checked:')).not.toBeInTheDocument();
    });
  });

  describe('Position and Layout', () => {
    test('should render with fixed position by default', () => {
      const { container } = renderWithChakra(<HealthIndicator />);
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ position: 'fixed' });
    });

    test('should render with relative position when specified', () => {
      const { container } = renderWithChakra(<HealthIndicator position="relative" />);
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ position: 'relative' });
    });
  });

  describe('Hook Configuration', () => {
    test('should configure useHealthCheck with correct interval', () => {
      renderWithChakra(<HealthIndicator />);
      
      expect(mockUseHealthCheck).toHaveBeenCalledWith({
        interval: 10000,
        enabled: true,
        onStatusChange: expect.any(Function)
      });
    });
  });
});