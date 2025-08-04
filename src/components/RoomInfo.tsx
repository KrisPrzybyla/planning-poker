import {
  Box,
  Text,
  useToast,
  useClipboard,
  IconButton,
  HStack,
} from '@chakra-ui/react';

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
    <Box 
      p={3} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg="gray.50"
      maxW="400px"
    >
      <HStack spacing={2} align="center">
        <Box flex="1" minW="0">
          <Text fontSize="xs" color="gray.600" mb={1}>
            Room Link
          </Text>
          <Text 
            fontSize="sm" 
            fontFamily="mono"
            color="gray.800"
            isTruncated
            title={roomUrl}
          >
            {roomUrl}
          </Text>
        </Box>
        <IconButton
          aria-label="Copy room link"
          icon={<Text fontSize="lg">📋</Text>}
          size="sm"
          onClick={handleCopyLink}
          colorScheme={hasUrlCopied ? "green" : "blue"}
          variant={hasUrlCopied ? "solid" : "outline"}
        />
      </HStack>
    </Box>
  );
};

export default RoomInfo;