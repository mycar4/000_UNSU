const fs = require('fs');
const path = require('path');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Parse .env manually
const envPath = path.join(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      envConfig[match[1]] = value;
    }
  });
}

const DATA_GO_KR_API_KEY = envConfig.DATA_GO_KR_API_KEY || '';

console.log('Using DATA_GO_KR_API_KEY:', DATA_GO_KR_API_KEY);

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function testAirport() {
  console.log('\n--- Testing Airport API ---');
  // URL from externalApi.ts
  const url = `https://apis.data.go.kr/B551178/flight-status/detail?serviceKey=${DATA_GO_KR_API_KEY}&type=json&numOfRows=5`;
  try {
    const res = await fetchWithTimeout(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

async function testTrain() {
  console.log('\n--- Testing Train API ---');
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // URL from externalApi.ts
  const url = `https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo?serviceKey=${DATA_GO_KR_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT011668&depPlandTime=${todayStr}&_type=json&numOfRows=5&pageNo=1`;
  try {
    const res = await fetchWithTimeout(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

async function testMetro() {
  console.log('\n--- Testing Metro API ---');
  // I don't see Metro API implementation in externalApi.ts except it's commented or elsewhere? Let's check.
  const url = `https://apis.data.go.kr/1613000/SubwayInfoService/getSubwaySttnAcptMsg?serviceKey=${DATA_GO_KR_API_KEY}&subwayStationId=SUB120&_type=json`;
  try {
    const res = await fetchWithTimeout(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

async function run() {
  await testAirport();
  await testTrain();
  await testMetro();
}

run();
