import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRfqs } from '../api';
import socket from '../socket';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import { formatDateTime, formatMoney } from '../utils/format';

const FILTERS = ['All', 'Active', 'Upcoming', 'Closed', 'Force Closed'];

function AuctionList() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const loadRfqs = async () => {
    try {
      const res = await getRfqs();
      setRfqs(res.data);
      setError('');
    } catch (err) {
      console.log(err);
      setError('Could not load auctions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();

    // backend sends this whenever an rfq is created or a bid is placed
    socket.on('rfq-list-updated', loadRfqs);
    return () => socket.off('rfq-list-updated', loadRfqs);
  }, []);

  const filteredRfqs = filter === 'All' ? rfqs : rfqs.filter((r) => r.status === filter);
  const countOf = (status) => rfqs.filter((r) => r.status === status).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>British Auctions</h1>
          <p className="muted">All RFQs with live lowest bid and close times</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          + Create RFQ
        </Link>
      </div>

      <div className="stats">
        <div className="stat"><span>{rfqs.length}</span>Total RFQs</div>
        <div className="stat stat-active"><span>{countOf('Active')}</span>Active</div>
        <div className="stat stat-upcoming"><span>{countOf('Upcoming')}</span>Upcoming</div>
        <div className="stat"><span>{countOf('Closed') + countOf('Force Closed')}</span>Closed</div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'filter active' : 'filter'} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading auctions...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && filteredRfqs.length === 0 && (
        <div className="card center">
          <p className="muted">No auctions here yet.</p>
        </div>
      )}

      {filteredRfqs.length > 0 && (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>Name</th>
                <th>Lowest Bid</th>
                <th>Bids</th>
                <th>Current Close Time</th>
                <th>Forced Close Time</th>
                <th>Time Left</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRfqs.map((rfq) => (
                <tr key={rfq._id}>
                  <td className="bold">{rfq.referenceId}</td>
                  <td>{rfq.name}</td>
                  <td className="bold">{formatMoney(rfq.lowestBid)}</td>
                  <td>{rfq.totalBids}</td>
                  <td>
                    {formatDateTime(rfq.currentCloseTime)}
                    {rfq.extensionCount > 0 && (
                      <span className="tag-extended">+{rfq.extensionCount} ext</span>
                    )}
                  </td>
                  <td>{formatDateTime(rfq.forcedCloseTime)}</td>
                  <td>
                    {rfq.status === 'Active' && <Countdown targetTime={rfq.currentCloseTime} onEnd={loadRfqs} />}
                    {rfq.status === 'Upcoming' && (
                      <span className="muted">
                        starts in <Countdown targetTime={rfq.bidStartTime} onEnd={loadRfqs} />
                      </span>
                    )}
                    {(rfq.status === 'Closed' || rfq.status === 'Force Closed') && '-'}
                  </td>
                  <td>
                    <StatusBadge status={rfq.status} />
                  </td>
                  <td>
                    <Link to={`/rfq/${rfq._id}`} className="btn btn-small">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuctionList;
