import React from 'react';
import type { FibonacciCard } from '../../../shared/types';

interface FibonacciCardsProps {
  selectedCard: FibonacciCard | null;
  onCardSelect: (card: FibonacciCard) => void;
  disabled?: boolean;
}

const FIBONACCI_CARDS: FibonacciCard[] = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

const FibonacciCards: React.FC<FibonacciCardsProps> = ({ 
  selectedCard, 
  onCardSelect, 
  disabled = false 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Wybierz swoją kartę
      </h3>
      
      <div className="grid grid-cols-5 gap-4 justify-items-center">
        {FIBONACCI_CARDS.map((card) => (
          <button
            key={card}
            onClick={() => !disabled && onCardSelect(card)}
            disabled={disabled}
            className={`
              poker-card
              ${selectedCard === card ? 'selected' : ''}
              ${card === '☕' ? 'coffee' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={
              card === '?' ? 'Nie wiem / Potrzebuję więcej informacji' :
              card === '☕' ? 'Potrzebuję przerwy' :
              `${card} story points`
            }
          >
            {card}
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          <strong>?</strong> = Nie wiem &nbsp;&nbsp;
          <strong>☕</strong> = Potrzebuję przerwy
        </p>
      </div>
    </div>
  );
};

export default FibonacciCards;