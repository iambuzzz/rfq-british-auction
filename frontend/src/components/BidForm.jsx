import { useState } from 'react';
import { placeBid, getErrorMessage } from '../api';
import { formatMoney } from '../utils/format';

const emptyCharges = {
  freightCharges: '',
  originCharges: '',
  destinationCharges: '',
};

function BidForm({ rfqId }) {
  const [form, setForm] = useState({
    carrierName: '',
    ...emptyCharges,
    transitTimeDays: '',
    quoteValidity: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total =
    Number(form.freightCharges || 0) +
    Number(form.originCharges || 0) +
    Number(form.destinationCharges || 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.carrierName.trim()) {
      setError('Please enter carrier name');
      return;
    }
    if (total <= 0) {
      setError('Total amount must be more than 0');
      return;
    }

    try {
      setSubmitting(true);
      const res = await placeBid(rfqId, form);
      let msg = `Bid placed! You are ${res.data.rank} now.`;
      if (res.data.extension) msg += ' Auction got extended.';
      setSuccess(msg);
      // keep carrier name so the same supplier can bid again easily
      setForm({ ...form, ...emptyCharges });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="bid-form" onSubmit={handleSubmit}>
      <label>
        Carrier Name
        <input name="carrierName" value={form.carrierName} onChange={handleChange} placeholder="eg. BlueDart Logistics" />
      </label>

      <div className="form-row">
        <label>
          Freight (₹)
          <input type="number" min="0" name="freightCharges" value={form.freightCharges} onChange={handleChange} />
        </label>
        <label>
          Origin (₹)
          <input type="number" min="0" name="originCharges" value={form.originCharges} onChange={handleChange} />
        </label>
        <label>
          Destination (₹)
          <input type="number" min="0" name="destinationCharges" value={form.destinationCharges} onChange={handleChange} />
        </label>
      </div>

      <div className="form-row">
        <label>
          Transit Time (days)
          <input type="number" min="1" name="transitTimeDays" value={form.transitTimeDays} onChange={handleChange} />
        </label>
        <label>
          Quote Valid Till
          <input type="date" name="quoteValidity" value={form.quoteValidity} onChange={handleChange} />
        </label>
      </div>

      <div className="bid-total">
        Total Bid: <strong>{formatMoney(total)}</strong>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Placing bid...' : 'Place Bid'}
      </button>
    </form>
  );
}

export default BidForm;
