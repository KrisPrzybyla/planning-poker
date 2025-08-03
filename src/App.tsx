import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';

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

function App() {
  return (
    <ChakraProvider theme={theme}>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </RoomProvider>
    </ChakraProvider>
  )
}

export default App
