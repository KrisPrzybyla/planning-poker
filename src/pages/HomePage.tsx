import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from '@chakra-ui/react';
import CreateRoomForm from '../components/CreateRoomForm';
import JoinRoomForm from '../components/JoinRoomForm';

const HomePage = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Box textAlign="center">
          <Text fontSize="lg" color="gray.600">
            Estimate user stories with your team in real-time
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed" index={tabIndex} onChange={setTabIndex} width="100%">
          <TabList mb="1em">
            <Tab>Create Room</Tab>
            <Tab>Join Room</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CreateRoomForm />
            </TabPanel>
            <TabPanel>
              <JoinRoomForm />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Box mt={10} p={6} borderRadius="lg" bg="gray.50" width="100%">
          <Heading as="h3" size="md" mb={4} textAlign="center">
            How It Works
          </Heading>
          <Flex direction={{ base: 'column', md: 'row' }} gap={6} justify="center">
            <Box textAlign="center">
              <Text fontWeight="bold" mb={2}>
                1. Create a Room
              </Text>
              <Text>Start as Scrum Master and invite your team members</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold" mb={2}>
                2. Add User Stories
              </Text>
              <Text>Enter stories that need estimation</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold" mb={2}>
                3. Vote Together
              </Text>
              <Text>Use Fibonacci cards to estimate complexity</Text>
            </Box>
          </Flex>
        </Box>
      </VStack>
    </Container>
  );
};

export default HomePage;