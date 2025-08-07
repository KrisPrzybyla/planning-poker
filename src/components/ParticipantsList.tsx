import {
  Box,
  Text,
  List,
  Heading,
} from '@chakra-ui/react';
import { memo, useCallback } from 'react';
import { User, Vote } from '../types';
import { useRoom } from '../context/RoomContext';
import UserItem from './UserItem';

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
  const { currentUser, removeUser } = useRoom();

  const handleRemoveUser = useCallback(async (userToRemove: User) => {
    try {
      await removeUser(userToRemove.id);
    } catch (error) {
      console.error('Failed to remove user:', error);
      alert('Failed to remove user. Please try again.');
    }
  }, [removeUser]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={3} fontSize="22px">
        Participants ({users.length})
      </Heading>
      <List spacing={2}>
        {users.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            votes={votes}
            isVotingActive={isVotingActive}
            isResultsVisible={isResultsVisible}
            currentUser={currentUser}
            onRemoveUser={handleRemoveUser}
          />
        ))}
      </List>
    </Box>
  );
};

export default memo(ParticipantsList);