import { Center, Flex, Spinner, Text } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  fullHeight = true 
}) => {
  return (
    <Center height={fullHeight ? '100vh' : 'auto'}>
      <Flex direction="column" align="center">
        <Spinner size="xl" mb={4} />
        <Text>{message}</Text>
      </Flex>
    </Center>
  );
};

export default LoadingSpinner;