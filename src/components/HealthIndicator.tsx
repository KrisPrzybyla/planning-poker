import {
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  Button,
  useToast,
  Collapse,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { useState, useRef, useCallback } from 'react';
import { CheckIcon, WarningIcon, RepeatIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useHealthCheck } from '../hooks/useHealthCheck';

interface HealthIndicatorProps {
  position?: 'fixed' | 'relative';
  showDetails?: boolean;
}

const HealthIndicator = ({ position = 'fixed', showDetails = false }: HealthIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const [isVisible, setIsVisible] = useState(false); // Completely hidden by default
  const toast = useToast();
  const previousStatusRef = useRef<string>('checking');
  const toastShownRef = useRef<boolean>(false);
  const stableConnectionTimer = useRef<NodeJS.Timeout | null>(null);

  const handleStatusChange = useCallback((status: any) => {
    const previousStatus = previousStatusRef.current;
    
    // Always show indicator when there are connection issues
    if (status.status === 'unhealthy' || status.status === 'checking') {
      setIsVisible(true);
      // Clear any existing timer
      if (stableConnectionTimer.current) {
        clearTimeout(stableConnectionTimer.current);
        stableConnectionTimer.current = null;
      }
    }
    
    // Show toast notification only when status actually changes
    if (status.status === 'unhealthy' && previousStatus !== 'unhealthy') {
      toast({
        title: 'Backend Connection Lost',
        description: 'Unable to connect to the server. Some features may not work properly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    } else if (status.status === 'healthy' && previousStatus === 'unhealthy' && !toastShownRef.current) {
        // Show success toast when connection is restored (only once)
        toastShownRef.current = true;
        toast({
          title: 'Connection Restored',
          description: 'Successfully reconnected to the server.',
          status: 'success',
          duration: 10000,
          isClosable: true,
          position: 'top-right'
        });
        
        // Reset the flag after toast duration
        setTimeout(() => {
          toastShownRef.current = false;
        }, 10000);
      }
    
    // Auto-hide indicator after 30 seconds of stable connection
    if (status.status === 'healthy') {
      // Clear any existing timer
      if (stableConnectionTimer.current) {
        clearTimeout(stableConnectionTimer.current);
      }
      
      // Set new timer to hide indicator after 30 seconds
      stableConnectionTimer.current = setTimeout(() => {
        setIsVisible(false);
      }, 30000);
    }
    
    // Update the previous status
    previousStatusRef.current = status.status;
  }, [toast]);

  const { healthStatus, isHealthy, isUnhealthy, isChecking, manualCheck, lastChecked } = useHealthCheck({
    interval: 10000, // Check every 10 seconds to quickly detect when backend comes online
    enabled: true,
    onStatusChange: handleStatusChange
  });

  const getStatusColor = () => {
    if (isHealthy) return 'green';
    if (isUnhealthy) return 'red';
    return 'yellow';
  };

  const getStatusIcon = () => {
    if (isHealthy) return CheckIcon;
    if (isUnhealthy) return WarningIcon;
    return RepeatIcon;
  };

  const getStatusText = () => {
    if (isHealthy) return 'Connected';
    if (isUnhealthy) return 'Disconnected';
    return 'Checking...';
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatLastChecked = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Show small toggle button when hidden
  if (!isVisible) {
    return (
      <Box
        position={position}
        top={position === 'fixed' ? 4 : undefined}
        right={position === 'fixed' ? 4 : undefined}
        zIndex={1000}
      >
        <Button
          size="xs"
          variant="ghost"
          bg="white"
          borderRadius="full"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
          onClick={() => setIsVisible(true)}
          _hover={{ bg: "gray.50" }}
          p={1}
          minW="auto"
          h="auto"
        >
          <Icon as={getStatusIcon()} color={`${getStatusColor()}.500`} boxSize={3} />
        </Button>
      </Box>
    );
  }

  return (
    <Box
      position={position}
      top={position === 'fixed' ? 4 : undefined}
      right={position === 'fixed' ? 4 : undefined}
      zIndex={1000}
      bg="white"
      borderRadius="md"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
      minW="120px"
    >
      <Flex
        align="center"
        justify="space-between"
        p={2}
        cursor={showDetails ? "pointer" : "default"}
        onClick={showDetails ? () => setIsExpanded(!isExpanded) : undefined}
        _hover={showDetails ? { bg: "gray.50" } : undefined}
      >
        <HStack spacing={2}>
          <Icon
            as={getStatusIcon()}
            color={`${getStatusColor()}.500`}
            boxSize={3}
            animation={isChecking ? "spin 1s linear infinite" : undefined}
          />
          <Text fontSize="xs" fontWeight="medium">
            {getStatusText()}
          </Text>
        </HStack>

        <HStack spacing={1}>
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              manualCheck();
            }}
            isLoading={isChecking}
            loadingText=""
          >
            <Icon as={RepeatIcon} boxSize={3} />
          </Button>
          
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              // Clear any existing timer
              if (stableConnectionTimer.current) {
                clearTimeout(stableConnectionTimer.current);
                stableConnectionTimer.current = null;
              }
            }}
            title="Hide indicator"
          >
            ✕
          </Button>
          
          {showDetails && (
            <Icon
              as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
              boxSize={4}
              color="gray.500"
            />
          )}
        </HStack>
      </Flex>

      {showDetails && (
        <Collapse in={isExpanded}>
          <Box p={3} pt={0}>
            <Divider mb={3} />
            <VStack align="stretch" spacing={2} fontSize="xs">
              <HStack justify="space-between">
                <Text color="gray.600">Status:</Text>
                <Badge colorScheme={getStatusColor()} size="sm">
                  {healthStatus.status}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text color="gray.600">Last Checked:</Text>
                <Text>{formatLastChecked(lastChecked)}</Text>
              </HStack>

              {healthStatus.uptime && (
                <HStack justify="space-between">
                  <Text color="gray.600">Server Uptime:</Text>
                  <Text>{formatUptime(healthStatus.uptime)}</Text>
                </HStack>
              )}

              {healthStatus.stats && (
                <>
                  <HStack justify="space-between">
                    <Text color="gray.600">Active Rooms:</Text>
                    <Text>{healthStatus.stats.activeRooms}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text color="gray.600">Connections:</Text>
                    <Text>{healthStatus.stats.totalConnections}</Text>
                  </HStack>
                </>
              )}

              {healthStatus.error && (
                <Box>
                  <Text color="gray.600" mb={1}>Error:</Text>
                  <Text color="red.500" fontSize="xs" wordBreak="break-word">
                    {healthStatus.error}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default HealthIndicator;