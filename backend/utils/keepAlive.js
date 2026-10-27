// render free plan puts the server to sleep after 15 min without any request,
// and the next request takes ~50 sec to wake it up.
// so the server calls its own url every 10 min to stay awake.
const TEN_MINUTES = 10 * 60 * 1000;

const keepAlive = () => {
  // render sets this env variable by itself, eg. https://rfq-auction-api.onrender.com
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return; // running locally, no need

  console.log('Keep alive is on, pinging', url, 'every 10 min');

  setInterval(() => {
    fetch(url)
      .then((res) => console.log('Keep alive ping:', res.status))
      .catch((error) => console.log('Keep alive ping failed:', error.message));
  }, TEN_MINUTES);
};

module.exports = keepAlive;
