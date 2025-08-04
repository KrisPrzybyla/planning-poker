import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import FibonacciCard from '../../../src/components/FibonacciCard';

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('FibonacciCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders card with correct value', () => {
    renderWithChakra(
      <FibonacciCard 
        value="5" 
        onClick={mockOnClick} 
        isSelected={false} 
        isDisabled={false} 
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    renderWithChakra(
      <FibonacciCard 
        value="8" 
        onClick={mockOnClick} 
        isSelected={false} 
        isDisabled={false} 
      />
    );
    
    const card = screen.getByText('8');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('shows selected state correctly', () => {
    renderWithChakra(
      <FibonacciCard 
        value="13" 
        onClick={mockOnClick} 
        isSelected={true} 
        isDisabled={false} 
      />
    );
    
    const card = screen.getByText('13').closest('button');
    expect(card).toHaveStyle({ borderColor: 'blue.500' });
  });

  it('is disabled when isDisabled prop is true', () => {
    renderWithChakra(
      <FibonacciCard 
        value="21" 
        onClick={mockOnClick} 
        isSelected={false} 
        isDisabled={true} 
      />
    );
    
    const card = screen.getByText('21').closest('button');
    expect(card).toHaveStyle({ opacity: '0.6' });
    
    fireEvent.click(card!);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles special values like "?" correctly', () => {
    renderWithChakra(
      <FibonacciCard 
        value="?" 
        onClick={mockOnClick} 
        isSelected={false} 
        isDisabled={false} 
      />
    );
    
    expect(screen.getByText('?')).toBeInTheDocument();
    
    const card = screen.getByText('?');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('shows correct tooltip for different values', () => {
    const { rerender } = renderWithChakra(
      <FibonacciCard 
        value="?" 
        onClick={mockOnClick} 
        isSelected={false} 
        isDisabled={false} 
      />
    );
    
    // Test tooltip for "?"
    expect(screen.getByText('?')).toBeInTheDocument();
    
    // Test tooltip for coffee break
    rerender(
      <ChakraProvider>
        <FibonacciCard 
          value="☕" 
          onClick={mockOnClick} 
          isSelected={false} 
          isDisabled={false} 
        />
      </ChakraProvider>
    );
    
    expect(screen.getByText('☕')).toBeInTheDocument();
  });
});