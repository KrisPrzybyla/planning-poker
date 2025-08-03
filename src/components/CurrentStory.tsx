import {
  Box,
  Text,
  Heading,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { Story } from '../types';

interface CurrentStoryProps {
  story: Story;
  isVotingActive: boolean;
}

const CurrentStory = ({ story, isVotingActive }: CurrentStoryProps) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="md">{story.title}</Heading>
        <Badge
          colorScheme={isVotingActive ? 'green' : 'gray'}
          variant="solid"
          fontSize="sm"
          px={2}
          py={1}
          borderRadius="full"
        >
          {isVotingActive ? 'Voting Active' : 'Voting Closed'}
        </Badge>
      </Flex>
      {story.description && (
        <Text mt={2} color="gray.700">
          {story.description}
        </Text>
      )}
    </Box>
  );
};

export default CurrentStory;