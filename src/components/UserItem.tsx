import { memo } from 'react';
import {
  Flex,
  Text,
  Badge,
  Avatar,
  IconButton,
  ListItem,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { User, Vote } from '../types';

interface UserItemProps {
  user: User;
  votes: Vote[];
  isVotingActive: boolean;
  isResultsVisible: boolean;
  currentUser: User | null;
  onRemoveUser: (user: User) => void;
}

const UserItem: React.FC<UserItemProps> = ({
  user,
  votes,
  isVotingActive,
  isResultsVisible,
  currentUser,
  onRemoveUser,
}) => {
  // Get voting status for user
  const getUserVoteStatus = () => {
    const userVote = votes.find((vote) => vote.userId === user.id);
    return {
      hasVoted: Boolean(userVote),
      voteValue: userVote?.value,
    };
  };

  const { hasVoted, voteValue } = getUserVoteStatus();
  const canRemoveUser = (currentUser?.role === 'Scrum Master' || currentUser?.role === 'Temporary Scrum Master') && 
    currentUser?.id !== user.id && 
    user.role !== 'Scrum Master' && 
    user.role !== 'Temporary Scrum Master';

  const handleRemoveUser = () => {
    const confirmed = window.confirm(`Are you sure you want to remove user "${user.name}" from the room?`);
    if (confirmed) {
      onRemoveUser(user);
    }
  };

  return (
    <ListItem>
      <Flex 
        align="center" 
        justify="space-between" 
        w="100%"
        className="user-item"
        position="relative"
        _hover={{
          '& .remove-button': {
            display: 'flex'
          }
        }}
      >
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
        {canRemoveUser && (
          <IconButton
            aria-label="Remove participant"
            icon={<CloseIcon />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={handleRemoveUser}
            title={`Remove ${user.name} from room`}
            className="remove-button"
            position="absolute"
            left="44px"
            top="50%"
            transform="translateY(-50%)"
            display="none"
            transition="all 0.2s ease-in-out"
            zIndex={1}
          />
        )}
      </Flex>
    </ListItem>
  );
};

export default memo(UserItem);