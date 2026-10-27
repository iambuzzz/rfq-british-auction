import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import socket from '../socket';

function Navbar() {
  const [isLive, setIsLive] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          RFQ<span>Auction</span>
        </Link>

        <nav>
          <NavLink to="/" end>
            Auctions
          </NavLink>
          <NavLink to="/create">Create RFQ</NavLink>
        </nav>

        <span className={isLive ? 'live-dot live' : 'live-dot'}>
          {isLive ? 'Live' : 'Offline'}
        </span>
      </div>
    </header>
  );
}

export default Navbar;
