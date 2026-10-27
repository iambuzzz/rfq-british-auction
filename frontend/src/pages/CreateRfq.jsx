import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRfq, getErrorMessage } from '../api';
import { TRIGGER_OPTIONS, formatTime } from '../utils/format';

// datetime-local input needs "YYYY-MM-DDTHH:mm" in local time
const toInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const minutesFromNow = (m) => new Date(Date.now() + m * 60000);

function CreateRfq() {
  const navigate = useNavigate();

  // some default values so it is quick to test
  const [form, setForm] = useState({
    name: '',
    pickupDate: toInputValue(minutesFromNow(3 * 24 * 60)).slice(0, 10),
    bidStartTime: toInputValue(new Date()),
    bidCloseTime: toInputValue(minutesFromNow(30)),
    forcedCloseTime: toInputValue(minutesFromNow(60)),
    triggerWindowMinutes: 10,
    extensionMinutes: 5,
    extensionTrigger: 'BID_RECEIVED',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // same checks as backend, so user gets the error before calling the api
  const validate = () => {
    if (!form.name.trim()) return 'RFQ name is required';
    if (!form.pickupDate) return 'Pickup / service date is required';

    const start = new Date(form.bidStartTime);
    const close = new Date(form.bidCloseTime);
    const forced = new Date(form.forcedCloseTime);

    if (close <= start) return 'Bid close time must be after bid start time';
    if (close <= new Date()) return 'Bid close time must be in the future';
    if (forced <= close) return 'Forced bid close time must be later than bid close time';
    if (Number(form.triggerWindowMinutes) < 1) return 'Trigger window (X) must be at least 1 minute';
    if (Number(form.extensionMinutes) < 1) return 'Extension duration (Y) must be at least 1 minute';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // convert local time from input to proper ISO time before sending
      const res = await createRfq({
        ...form,
        bidStartTime: new Date(form.bidStartTime).toISOString(),
        bidCloseTime: new Date(form.bidCloseTime).toISOString(),
        forcedCloseTime: new Date(form.forcedCloseTime).toISOString(),
        triggerWindowMinutes: Number(form.triggerWindowMinutes),
        extensionMinutes: Number(form.extensionMinutes),
      });
      navigate(`/rfq/${res.data._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  // small preview text so the buyer understands X and Y
  const close = new Date(form.bidCloseTime);
  const windowStart = new Date(close.getTime() - form.triggerWindowMinutes * 60000);
  const showPreview = !isNaN(close.getTime()) && form.triggerWindowMinutes > 0;

  return (
    <div className="narrow">
      <h1>Create RFQ</h1>
      <p className="muted">British Auction is enabled for this RFQ</p>

      <form className="card form" onSubmit={handleSubmit}>
        <h3>RFQ Details</h3>
        <label>
          RFQ Name
          <input name="name" value={form.name} onChange={handleChange} placeholder="eg. Mumbai to Delhi - 20ft Container" />
        </label>
        <label>
          Pickup / Service Date
          <input type="date" name="pickupDate" value={form.pickupDate} onChange={handleChange} />
        </label>

        <h3>Bidding Time</h3>
        <div className="form-row">
          <label>
            Bid Start Date & Time
            <input type="datetime-local" name="bidStartTime" value={form.bidStartTime} onChange={handleChange} />
          </label>
          <label>
            Bid Close Date & Time
            <input type="datetime-local" name="bidCloseTime" value={form.bidCloseTime} onChange={handleChange} />
          </label>
        </div>
        <label>
          Forced Bid Close Date & Time
          <input type="datetime-local" name="forcedCloseTime" value={form.forcedCloseTime} onChange={handleChange} />
          <small>Auction can never be extended after this time. Must be later than bid close time.</small>
        </label>

        <h3>British Auction Config</h3>
        <div className="form-row">
          <label>
            Trigger Window (X minutes)
            <input type="number" min="1" name="triggerWindowMinutes" value={form.triggerWindowMinutes} onChange={handleChange} />
          </label>
          <label>
            Extension Duration (Y minutes)
            <input type="number" min="1" name="extensionMinutes" value={form.extensionMinutes} onChange={handleChange} />
          </label>
        </div>

        <p className="label-text">Extension Trigger</p>
        <div className="trigger-options">
          {TRIGGER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={form.extensionTrigger === option.value ? 'trigger-option selected' : 'trigger-option'}
            >
              <input
                type="radio"
                name="extensionTrigger"
                value={option.value}
                checked={form.extensionTrigger === option.value}
                onChange={handleChange}
              />
              <div>
                <strong>{option.label}</strong>
                <small>{option.help}</small>
              </div>
            </label>
          ))}
        </div>

        {showPreview && (
          <div className="preview">
            System will watch bids between <b>{formatTime(windowStart)}</b> and <b>{formatTime(close)}</b>. If
            triggered, close time moves by <b>{form.extensionMinutes} min</b>, but never after{' '}
            <b>{formatTime(form.forcedCloseTime)}</b>.
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create RFQ'}
        </button>
      </form>
    </div>
  );
}

export default CreateRfq;
