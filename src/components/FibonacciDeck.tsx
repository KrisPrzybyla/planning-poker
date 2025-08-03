import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import FibonacciCard from './FibonacciCard';
import { FibonacciCard as FibonacciCardType } from '../types';

interface FibonacciDeckProps {
  selectedValue?: string;
  onSelectCard: (value: FibonacciCardType) => void;
  isVotingActive: boolean;
  isResultsVisible: boolean;
}

const FIBONACCI_VALUES: FibonacciCardType[] = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

const FibonacciDeck: React.FC<FibonacciDeckProps> = ({
  selectedValue,
  onSelectCard,
  isVotingActive,
  isResultsVisible,
}) => {
  return (
    <Box width="100%" p={4}>
      {isVotingActive && !isResultsVisible && (
        <Text 
          textAlign="center" 
          fontSize="sm" 
          color="gray.600" 
          mb={4}
        >
          {selectedValue ? 'You can change your vote anytime before results are revealed' : 'Select your estimate'}
        </Text>
      )}
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4} justifyItems="center">
        {FIBONACCI_VALUES.map((value) => (
          <FibonacciCard
            key={value}
            value={value}
            isSelected={selectedValue === value}
            isRevealed={isResultsVisible}
            onClick={() => onSelectCard(value)}
            isDisabled={!isVotingActive || isResultsVisible}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default FibonacciDeck;