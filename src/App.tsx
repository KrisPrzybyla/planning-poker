import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoomProvider, useRoom } from './context/RoomContext';
import { useBeforeUnload } from './hooks/useBeforeUnload';

// Components
import Header from './components/Header';
import HealthIndicator from './components/HealthIndicator';

// Pages
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import JoinPage from './pages/JoinPage';
import NotFoundPage from './pages/NotFoundPage';

// Theme customization
const theme = extendTheme({
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff',
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
  },
});

// Component that has access to room context
function AppContent() {
  // Only Scrum Master should see health indicator

  const { room, currentUser, isConnected } = useRoom();
  
  // Enable beforeunload protection when user is in an active room
  const shouldProtect = Boolean(
    room && 
    currentUser && 
    isConnected && 
    (room.isVotingActive || room.currentStory)
  );

  useBeforeUnload({
    enabled: shouldProtect,
    message: 'Czy na pewno chcesz opuścić stronę? Utracisz połączenie z sesją Planning Poker i możesz przegapić głosowanie.'
  });

  return (
    <Router>
      <Box minH="100vh" bg="gray.50">
        <Header />
        {(currentUser?.role === 'Scrum Master' || currentUser?.role === 'Temporary Scrum Master') && (
          <HealthIndicator showDetails={true} />
        )}
        <Box>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </ChakraProvider>
  )
}

export default App
