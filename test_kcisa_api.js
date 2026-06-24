const http = require('http');

const CULTURE_API_KEY = "1701a2c5-b5f8-41d3-b987-f9fb003f22b1";
const url = `http://api.kcisa.kr/openapi/CNV_060/request?serviceKey=${CULTURE_API_KEY}&numOfRows=5&pageNo=1&dtype=${encodeURIComponent('콘서트')}`;

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 1500));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
