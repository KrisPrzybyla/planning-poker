import { Box, Text, Heading, Progress, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { VotingStats } from '../types';

interface VotingResultsProps {
  stats: VotingStats;
  totalVotes: number;
}

const VotingResults: React.FC<VotingResultsProps> = ({ stats, totalVotes }) => {
  const { average, distribution } = stats;

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="md" mb={4}>
        Voting Results
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={6}>
        <Stat>
          <StatLabel>Average</StatLabel>
          <StatNumber>{average !== null ? average.toFixed(1) : 'N/A'}</StatNumber>
          <StatHelpText>Story points</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>Total Votes</StatLabel>
          <StatNumber>{totalVotes}</StatNumber>
          <StatHelpText>Team members</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box mt={6}>
        <Text fontWeight="bold" mb={2}>
          Vote Distribution
        </Text>
        {Object.entries(distribution).map(([value, percentage]) => (
          <Box key={value} mb={3}>
            <Text mb={1}>
              {value} ({percentage}%)
            </Text>
            <Progress value={percentage} colorScheme="blue" size="sm" borderRadius="full" />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default VotingResults;