import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRfqById, getErrorMessage } from '../api';
import socket from '../socket';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import AuctionTimeline from '../components/AuctionTimeline';
import RankingTable from '../components/RankingTable';
import BidForm from '../components/BidForm';
import ActivityLog from '../components/ActivityLog';
import { formatDate, formatDateTime, formatMoney, formatTime, getTriggerLabel } from '../utils/format';

function AuctionDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAuction = async () => {
    try {
      const res = await getRfqById(id);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadAuction();

    // join the room of this auction to get live updates
    socket.emit('join-auction', id);

    const onAuctionUpdated = (update) => {
      loadAuction();
      if (update.extension) {
        setNotice(`Auction extended till ${formatTime(update.extension.newCloseTime)} - ${update.extension.reason}`);
        setTimeout(() => setNotice(''), 8000);
      }
    };

    socket.on('auction-updated', onAuctionUpdated);

    // when socket reconnects (eg. server restart) join the room again
    const onReconnect = () => socket.emit('join-auction', id);
    socket.on('connect', onReconnect);

    return () => {
      socket.emit('leave-auction', id);
      socket.off('auction-updated', onAuctionUpdated);
      socket.off('connect', onReconnect);
    };
  }, [id]);

  if (error) {
    return (
      <div className="card center">
        <p className="error">{error}</p>
        <Link to="/">Back to auctions</Link>
      </div>
    );
  }

  if (!data) return <p className="muted">Loading auction...</p>;

  const { rfq, ranking, bids, logs } = data;
  const isActive = rfq.status === 'Active';

  return (
    <div>
      <Link to="/" className="back-link">← All auctions</Link>

      <div className="page-header">
        <div>
          <p className="muted">{rfq.referenceId}</p>
          <h1>{rfq.name}</h1>
          <p className="muted">Pickup on {formatDate(rfq.pickupDate)}</p>
        </div>
        <div className="header-right">
          <StatusBadge status={rfq.status} />
          {isActive && (
            <div className="big-timer">
              <small>Closes in</small>
              <Countdown targetTime={rfq.currentCloseTime} onEnd={loadAuction} />
            </div>
          )}
          {rfq.status === 'Upcoming' && (
            <div className="big-timer">
              <small>Starts in</small>
              <Countdown targetTime={rfq.bidStartTime} onEnd={loadAuction} />
            </div>
          )}
        </div>
      </div>

      {notice && <div className="notice">⏱️ {notice}</div>}

      <div className="card">
        <AuctionTimeline rfq={rfq} />
      </div>

      <div className="details-grid">
        <div className="left">
          <div className="card">
            <h3>Supplier Ranking</h3>
            <RankingTable ranking={ranking} />
          </div>

          <div className="card">
            <h3>All Bids ({bids.length}) - sorted by price</h3>
            {bids.length === 0 ? (
              <p className="muted">No bids yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Carrier</th>
                      <th>Freight</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Total</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => (
                      <tr key={bid._id}>
                        <td>{bid.carrierName}</td>
                        <td>{formatMoney(bid.freightCharges)}</td>
                        <td>{formatMoney(bid.originCharges)}</td>
                        <td>{formatMoney(bid.destinationCharges)}</td>
                        <td className="bold">{formatMoney(bid.totalAmount)}</td>
                        <td>{formatTime(bid.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="right">
          <div className="card">
            <h3>Submit a Quote</h3>
            {isActive ? (
              <BidForm rfqId={rfq._id} />
            ) : (
              <p className="muted">
                {rfq.status === 'Upcoming' ? 'Bidding has not started yet.' : 'Bidding is closed for this auction.'}
              </p>
            )}
          </div>

          <div className="card">
            <h3>Auction Config</h3>
            <dl className="config">
              <dt>Trigger Window (X)</dt>
              <dd>{rfq.triggerWindowMinutes} min</dd>
              <dt>Extension Duration (Y)</dt>
              <dd>{rfq.extensionMinutes} min</dd>
              <dt>Extension Trigger</dt>
              <dd>{getTriggerLabel(rfq.extensionTrigger)}</dd>
              <dt>Bid Start</dt>
              <dd>{formatDateTime(rfq.bidStartTime)}</dd>
              <dt>Original Close</dt>
              <dd>{formatDateTime(rfq.bidCloseTime)}</dd>
              <dt>Current Close</dt>
              <dd className="bold">{formatDateTime(rfq.currentCloseTime)}</dd>
              <dt>Forced Close</dt>
              <dd>{formatDateTime(rfq.forcedCloseTime)}</dd>
              <dt>Extensions</dt>
              <dd>{rfq.extensionCount}</dd>
            </dl>
          </div>

          <div className="card">
            <h3>Activity Log</h3>
            <ActivityLog logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionDetails;
