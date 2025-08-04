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
      <Heading size="md" mb={3} fontSize="22px">
        Participants ({users.length})
      </Heading>
      <List spacing={2}>
        {users.map((user) => {
          const { hasVoted, voteValue } = getUserVoteStatus(user.id);
          return (
            <ListItem key={user.id}>
              <Flex align="center" justify="space-between" w="100%">
                <Flex align="center" flex="1" minW="0">
                  <Avatar size="sm" name={user.name} mr={3} />
                  <Text 
                    fontWeight="medium" 
                    fontSize="18px"
                    isTruncated
                    mr={2}
                  >
                    {user.name}
                  </Text>
                  {(user.role === 'Scrum Master' || user.role === 'Temporary Scrum Master') && (
                    <Badge 
                      colorScheme={user.role === 'Scrum Master' ? 'purple' : 'orange'} 
                      variant="solid" 
                      fontSize="xs"
                      px={2}
                      py={1}
                    >
                      {user.role === 'Scrum Master' ? 'SM' : 'TEMP SM'}
                    </Badge>
                  )}
                  {!user.isConnected && (
                    <Badge 
                      colorScheme="red" 
                      variant="outline" 
                      fontSize="xs"
                      px={2}
                      py={1}
                    >
                      OFFLINE
                    </Badge>
                  )}
                </Flex>
                <Flex align="center" gap={2} flexShrink={0}>
                  {isVotingActive && (
                    <Badge
                      colorScheme={hasVoted ? 'green' : 'gray'}
                      variant={hasVoted ? 'solid' : 'outline'}
                      fontSize="xs"
                      minW="70px"
                      textAlign="center"
                      px={2}
                      py={1}
                    >
                      {hasVoted ? 'VOTED' : 'PENDING'}
                    </Badge>
                  )}
                  {isResultsVisible && hasVoted && (
                    <Badge 
                      colorScheme="blue" 
                      fontSize="md"
                      minW="36px"
                      textAlign="center"
                      px={2}
                      py={1}
                    >
                      {voteValue}
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default ParticipantsList;