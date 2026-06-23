const fs = require('fs');
const path = require('path');

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

const KORAIL_API_KEY = envConfig.KORAIL_API_KEY || '';
const METRO_API_KEY = envConfig.METRO_API_KEY || '';
const AIRPORT_API_KEY = envConfig.AIRPORT_API_KEY || '';

console.log('KORAIL_API_KEY:', KORAIL_API_KEY);
console.log('METRO_API_KEY:', METRO_API_KEY);
console.log('AIRPORT_API_KEY:', AIRPORT_API_KEY);

async function testAirport() {
  console.log('\n--- Testing Airport API ---');
  const url = `http://apis.data.go.kr/B551177/StatusOfPassengerFlightsDPH/getPassengerArrivalsDPH?serviceKey=${AIRPORT_API_KEY}&_type=json&numOfRows=5`;
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response (first 500 chars):', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function testTrain() {
  console.log('\n--- Testing Train API ---');
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const url = `http://apis.data.go.kr/1613000/TrainInfoService/getSttRtRouteTrnItnstList?serviceKey=${KORAIL_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT014439&depPlandTime=${todayStr}&_type=json`;
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response (first 500 chars):', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function testMetro() {
  console.log('\n--- Testing Metro API ---');
  const url = `http://apis.data.go.kr/1613000/SubwayInfoService/getSubwaySttnAcptMsg?serviceKey=${METRO_API_KEY}&subwayStationId=SUB120&_type=json`;
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response (first 500 chars):', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  await testAirport();
  await testTrain();
  await testMetro();
}

run();
