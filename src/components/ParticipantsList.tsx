import {
  Box,
  Text,
  List,
  ListItem,
  Flex,
  Badge,
  Avatar,
  Heading,
} from '@chakra-ui/react';
import { User, Vote } from '../types';

interface ParticipantsListProps {
  users: User[];
  votes: Vote[];
  isVotingActive: boolean;
  isResultsVisible: boolean;
}

const ParticipantsList = ({
  users,
  votes,
  isVotingActive,
  isResultsVisible,
}: ParticipantsListProps) => {
  // Get voting status for each user
  const getUserVoteStatus = (userId: string) => {
    const userVote = votes.find((vote) => vote.userId === userId);
    return {
      hasVoted: Boolean(userVote),
      voteValue: userVote?.value,
    };
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="sm" mb={3}>
        Participants ({users.length})
      </Heading>
      <List spacing={2}>
        {users.map((user) => {
          const { hasVoted, voteValue } = getUserVoteStatus(user.id);
          return (
            <ListItem key={user.id}>
              <Flex align="center" justify="space-between">
                <Flex align="center">
                  <Avatar size="xs" name={user.name} mr={2} />
                  <Text fontWeight={user.role === 'Scrum Master' ? 'bold' : 'normal'}>
                    {user.name}
                  </Text>
                  {user.role === 'Scrum Master' && (
                    <Badge ml={2} colorScheme="purple" fontSize="xs">
                      SM
                    </Badge>
                  )}
                </Flex>
                {isVotingActive && (
                  <Badge
                    colorScheme={hasVoted ? 'green' : 'gray'}
                    variant={hasVoted ? 'solid' : 'outline'}
                    fontSize="xs"
                  >
                    {hasVoted ? 'Voted' : 'Not Voted'}
                  </Badge>
                )}
                {isResultsVisible && hasVoted && (
                  <Badge colorScheme="blue" fontSize="sm">
                    {voteValue}
                  </Badge>
                )}
              </Flex>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default ParticipantsList;