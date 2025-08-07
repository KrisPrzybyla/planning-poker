import {
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Button,
} from '@chakra-ui/react';
import { memo } from 'react';

interface ErrorAlertProps {
  error: string;
  onBackToHome?: () => void;
  showBackButton?: boolean;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onBackToHome, 
  showBackButton = true 
}) => {
  return (
    <Container maxW="container.lg" py={10}>
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      {showBackButton && onBackToHome && (
        <Center mt={6}>
          <Button colorScheme="blue" onClick={onBackToHome}>
            Back to Home
          </Button>
        </Center>
      )}
    </Container>
  );
};

export default memo(ErrorAlert);