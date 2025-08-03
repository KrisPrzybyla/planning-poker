import { useRef } from 'react';
import {
  Box,
  Text,
  Button,
  Flex,
  useToast,
  useClipboard,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { formatRoomCode } from '../utils/votingUtils';

interface RoomInfoProps {
  roomId: string;
}

const RoomInfo = ({ roomId }: RoomInfoProps) => {
  const toast = useToast();
  const roomUrl = `${window.location.origin}/room/${roomId}`;
  const { hasCopied: hasRoomIdCopied, onCopy: onCopyRoomId } = useClipboard(roomId);
  const { hasCopied: hasUrlCopied, onCopy: onCopyUrl } = useClipboard(roomUrl);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Planning Poker session',
          text: `Join my Planning Poker session with code: ${roomId}`,
          url: roomUrl,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: 'Error sharing',
            description: 'Could not share the room link',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } else {
      onCopyUrl();
      toast({
        title: 'Link copied',
        description: 'Room link copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
      <Flex direction="column" align="center" justify="center">
        <Text fontSize="sm" color="gray.600" mb={1}>
          Room Code
        </Text>
        <Text fontSize="2xl" fontWeight="bold" letterSpacing="wider" mb={2}>
          {formatRoomCode(roomId)}
        </Text>
        <Flex mt={2} gap={2}>
          <Tooltip label="Copy Room Code">
            <Button
              size="sm"
              onClick={onCopyRoomId}
              colorScheme={hasRoomIdCopied ? 'green' : 'gray'}
            >
              {hasRoomIdCopied ? 'Copied!' : 'Copy Code'}
            </Button>
          </Tooltip>
          <Tooltip label={navigator.share ? 'Share Room Link' : 'Copy Room Link'}>
            <Button size="sm" onClick={handleShare} colorScheme="blue">
              {navigator.share ? 'Share' : hasUrlCopied ? 'Copied!' : 'Copy Link'}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );
};

export default RoomInfo;