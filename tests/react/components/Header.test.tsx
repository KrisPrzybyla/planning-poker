import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Header from '../../../src/components/Header';

// Mock useRoom hook
const mockUseRoom = jest.fn();
jest.mock('../../../src/context/RoomContext', () => ({
  useRoom: () => mockUseRoom(),
}));

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

const renderHeader = () => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoom.mockReturnValue({
      room: null,
      currentUser: null,
    });
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });

  it('should render Planning Poker heading', () => {
    renderHeader();
    expect(screen.getByText('Planning Poker')).toBeInTheDocument();
  });

  it('should navigate to home when clicked and not in room', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' });
    renderHeader();
    
    const heading = screen.getByText('Planning Poker');
    fireEvent.click(heading);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show confirmation modal when clicked and in room', () => {
    // Mock being in a room
    mockUseRoom.mockReturnValue({
      room: { id: 'test-room' },
      currentUser: { id: 'test-user', name: 'Test User' },
    });
    mockUseLocation.mockReturnValue({ pathname: '/room/test-room' });

    renderHeader();
    
    const heading = screen.getByText('Planning Poker');
    fireEvent.click(heading);
    
    // Should show confirmation modal
    expect(screen.getByText('Leave Room?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to leave the room and return to the home page?')).toBeInTheDocument();
  });

  it('should navigate to home when confirmation is accepted', () => {
    // Mock being in a room
    mockUseRoom.mockReturnValue({
      room: { id: 'test-room' },
      currentUser: { id: 'test-user', name: 'Test User' },
    });
    mockUseLocation.mockReturnValue({ pathname: '/room/test-room' });

    renderHeader();
    
    const heading = screen.getByText('Planning Poker');
    fireEvent.click(heading);
    
    // Click confirm button
    const confirmButton = screen.getByText('Yes, Leave Room');
    fireEvent.click(confirmButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should close modal when cancel is clicked', () => {
    // Mock being in a room
    mockUseRoom.mockReturnValue({
      room: { id: 'test-room' },
      currentUser: { id: 'test-user', name: 'Test User' },
    });
    mockUseLocation.mockReturnValue({ pathname: '/room/test-room' });

    renderHeader();
    
    const heading = screen.getByText('Planning Poker');
    fireEvent.click(heading);
    
    // Verify modal is shown
    expect(screen.getByText('Leave Room?')).toBeInTheDocument();
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
  });

  it('should render heading as clickable element', () => {
    renderHeader();
    
    const heading = screen.getByText('Planning Poker');
    expect(heading).toBeInTheDocument();
    
    // Verify it's clickable
    fireEvent.click(heading);
    expect(mockNavigate).toHaveBeenCalled();
  });
});