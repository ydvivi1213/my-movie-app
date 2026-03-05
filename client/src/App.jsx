import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RoomRouter from './pages/RoomRouter';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<RoomRouter />} />
      </Routes>
    </BrowserRouter>
  );
}
