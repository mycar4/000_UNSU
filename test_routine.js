const http = require('http');
http.get('http://localhost:3001/api/routine/test_driver_123', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
}).on('error', err => console.error(err));
