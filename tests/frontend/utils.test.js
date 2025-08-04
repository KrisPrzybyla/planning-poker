// Simple test runner for frontend utilities
import assert from 'assert';

// Mock the voting utils functions for testing
const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const formatRoomCode = (code) => {
  if (!code) return '';
  return code.replace(/(.{3})/g, '$1 ').trim();
};

const calculateVotingStats = (votes) => {
  const numericVotes = votes
    .map(vote => parseFloat(vote.value))
    .filter(value => !isNaN(value));
  
  const average = numericVotes.length > 0 
    ? numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length 
    : 0;
  
  const distribution = {};
  votes.forEach(vote => {
    distribution[vote.value] = (distribution[vote.value] || 0) + 1;
  });
  
  const mostFrequentVote = Object.keys(distribution).reduce((a, b) => 
    distribution[a] > distribution[b] ? a : b
  );
  
  const hasConsensus = votes.length > 0 && votes.every(vote => vote.value === votes[0].value);
  
  return {
    average,
    totalVotes: votes.length,
    numericVotes: numericVotes.length,
    distribution,
    mostFrequentVote,
    hasConsensus
  };
};

// Test functions
function runTests() {
  console.log('🧪 Running Frontend Utils Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  // Test generateRoomCode
  test('generateRoomCode should generate 6-character code', () => {
    const code = generateRoomCode();
    assert.strictEqual(code.length, 6);
    assert.match(code, /^[A-Z0-9]+$/);
  });
  
  test('generateRoomCode should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    assert.ok(codes.size > 95);
  });
  
  // Test formatRoomCode
  test('formatRoomCode should add spaces every 3 characters', () => {
    assert.strictEqual(formatRoomCode('ABC123'), 'ABC 123');
    assert.strictEqual(formatRoomCode('ABCDEF'), 'ABC DEF');
    assert.strictEqual(formatRoomCode(''), '');
    assert.strictEqual(formatRoomCode('A'), 'A');
    assert.strictEqual(formatRoomCode('AB'), 'AB');
    assert.strictEqual(formatRoomCode('ABC'), 'ABC');
  });
  
  // Test calculateVotingStats
  test('calculateVotingStats should calculate average correctly', () => {
    const votes = [
      { userId: '1', value: '1' },
      { userId: '2', value: '2' },
      { userId: '3', value: '3' },
      { userId: '4', value: '5' },
      { userId: '5', value: '8' }
    ];
    
    const stats = calculateVotingStats(votes);
    assert.strictEqual(stats.average, 3.8);
    assert.strictEqual(stats.totalVotes, 5);
  });
  
  test('calculateVotingStats should handle non-numeric votes', () => {
    const votes = [
      { userId: '1', value: '1' },
      { userId: '2', value: '?' },
      { userId: '3', value: '∞' },
      { userId: '4', value: '5' }
    ];
    
    const stats = calculateVotingStats(votes);
    assert.strictEqual(stats.average, 3);
    assert.strictEqual(stats.totalVotes, 4);
    assert.strictEqual(stats.numericVotes, 2);
  });
  
  test('calculateVotingStats should detect consensus', () => {
    const consensusVotes = [
      { userId: '1', value: '5' },
      { userId: '2', value: '5' },
      { userId: '3', value: '5' }
    ];
    
    const noConsensusVotes = [
      { userId: '1', value: '1' },
      { userId: '2', value: '3' },
      { userId: '3', value: '5' }
    ];
    
    const consensusStats = calculateVotingStats(consensusVotes);
    const noConsensusStats = calculateVotingStats(noConsensusVotes);
    
    assert.strictEqual(consensusStats.hasConsensus, true);
    assert.strictEqual(noConsensusStats.hasConsensus, false);
  });
  
  test('calculateVotingStats should calculate distribution', () => {
    const votes = [
      { userId: '1', value: '1' },
      { userId: '2', value: '1' },
      { userId: '3', value: '3' },
      { userId: '4', value: '5' }
    ];
    
    const stats = calculateVotingStats(votes);
    assert.deepStrictEqual(stats.distribution, {
      '1': 2,
      '3': 1,
      '5': 1
    });
    assert.strictEqual(stats.mostFrequentVote, '1');
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
  }
}

runTests();