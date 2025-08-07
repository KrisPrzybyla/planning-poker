import { memo } from 'react';
import { Box, Text, Tooltip } from '@chakra-ui/react';
import { FibonacciCard as FibonacciCardType } from '../types';
import { CARD_TOOLTIPS, CARD_DIMENSIONS } from '../constants';

interface FibonacciCardProps {
  value: FibonacciCardType;
  isSelected?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  isDisabled?: boolean;
}

const getTooltip = (value: FibonacciCardType): string => {
  if (value in CARD_TOOLTIPS) {
    return CARD_TOOLTIPS[value as keyof typeof CARD_TOOLTIPS];
  }
  return `${value} story points`;
};

const FibonacciCard: React.FC<FibonacciCardProps> = ({
  value,
  isSelected = false,

  onClick,
  isDisabled = false,
}) => {
  return (
    <Tooltip label={getTooltip(value)} placement="top">
      <Box
        as="button"
        width={CARD_DIMENSIONS.WIDTH}
        height={CARD_DIMENSIONS.HEIGHT}
        borderRadius="md"
        border="2px solid"
        borderColor={isSelected ? 'blue.500' : 'gray.200'}
        bg={isSelected ? 'blue.50' : 'white'}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        onClick={isDisabled ? undefined : onClick}
        opacity={isDisabled ? 0.6 : 1}
        transition="all 0.2s"
        _hover={{
          transform: isDisabled ? 'none' : 'translateY(-5px)',
          boxShadow: isDisabled ? 'none' : 'md',
        }}
        position="relative"
        overflow="hidden"
      >
  
        <Text fontSize="2xl" fontWeight="bold">
          {value}
        </Text>
      </Box>
    </Tooltip>
  );
};

export default memo(FibonacciCard);