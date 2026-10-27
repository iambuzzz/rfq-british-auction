export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export const TRIGGER_OPTIONS = [
  {
    value: 'BID_RECEIVED',
    label: 'Bid received in last X minutes',
    help: 'Any new bid inside the trigger window extends the auction.',
  },
  {
    value: 'ANY_RANK_CHANGE',
    label: 'Any supplier rank change in last X minutes',
    help: 'Extends only if some supplier gets overtaken (L2 becomes L3 etc).',
  },
  {
    value: 'L1_RANK_CHANGE',
    label: 'Lowest bidder (L1) change in last X minutes',
    help: 'Extends only when a new supplier becomes the lowest bidder.',
  },
];

export const getTriggerLabel = (value) => {
  const option = TRIGGER_OPTIONS.find((o) => o.value === value);
  return option ? option.label : value;
};
