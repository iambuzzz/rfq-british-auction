import { formatDate, formatMoney, formatTime } from '../utils/format';

function RankingTable({ ranking }) {
  if (ranking.length === 0) {
    return <p className="muted">No bids yet. Be the first supplier to bid!</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Carrier</th>
            <th>Freight</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Total</th>
            <th>Transit</th>
            <th>Valid Till</th>
            <th>Bid Time</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((bid) => (
            <tr key={bid._id} className={bid.rank === 'L1' ? 'row-l1' : ''}>
              <td>
                <span className={bid.rank === 'L1' ? 'rank rank-l1' : 'rank'}>{bid.rank}</span>
              </td>
              <td className="bold">{bid.carrierName}</td>
              <td>{formatMoney(bid.freightCharges)}</td>
              <td>{formatMoney(bid.originCharges)}</td>
              <td>{formatMoney(bid.destinationCharges)}</td>
              <td className="bold">{formatMoney(bid.totalAmount)}</td>
              <td>{bid.transitTimeDays} days</td>
              <td>{formatDate(bid.quoteValidity)}</td>
              <td>{formatTime(bid.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RankingTable;
