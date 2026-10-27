import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuctionList from './pages/AuctionList';
import CreateRfq from './pages/CreateRfq';
import AuctionDetails from './pages/AuctionDetails';

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/create" element={<CreateRfq />} />
          <Route path="/rfq/:id" element={<AuctionDetails />} />
          <Route
            path="*"
            element={
              <div className="card center">
                <h2>Page not found</h2>
                <Link to="/">Go back to auctions</Link>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
