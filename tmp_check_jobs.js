const https = require('https');
const url = 'https://api.studio.thegraph.com/query/poly-lance-studio/poly-lance/v0.0.1';
const query = JSON.stringify({
  query: `{
    jobs(first: 5, orderBy: timestamp, orderDirection: desc) {
      jobId
      client
      status
      amount
    }
  }`
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': query.length
  }
};

const req = https.request(url, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (e) => console.error(e));
req.write(query);
req.end();
