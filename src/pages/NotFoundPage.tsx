import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="center" textAlign="center">
        <Heading as="h1" size="4xl">
          404
        </Heading>
        <Heading as="h2" size="xl">
          Page Not Found
        </Heading>
        <Text fontSize="lg" color="gray.600">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button colorScheme="blue" size="lg" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </VStack>
    </Container>
  );
};

export default NotFoundPage;