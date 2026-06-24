const https = require('https');

const CULTURE_API_KEY = "1701a2c5-b5f8-41d3-b987-f9fb003f22b1";
// Get today's date in YYYYMMDD format
const today = new Date().toISOString().slice(0,10).replace(/-/g, '');

const url = `https://www.culture.go.kr/openapi/rest/publicperformancedisplays/period?serviceKey=${CULTURE_API_KEY}&from=${today}&to=${today}&numOfRows=5&pageNo=1`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 1000));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
