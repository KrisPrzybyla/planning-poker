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
  const { hasCopied: hasUrlCopied, onCopy: onCopyUrl } = useClipboard(roomUrl);

  const handleCopyLink = () => {
    onCopyUrl();
    toast({
      title: 'Link copied',
      description: 'Room link copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
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
        <Flex mt={2} justify="center">
          <Tooltip label="Copy Room Link">
            <Button size="sm" onClick={handleCopyLink} colorScheme="blue">
              {hasUrlCopied ? 'Copied!' : 'Copy Link'}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );
};

export default RoomInfo;