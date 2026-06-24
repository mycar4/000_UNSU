const KORAIL_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const urlsToTest = [
  `http://apis.data.go.kr/B551457/run/v2?serviceKey=${KORAIL_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT014439&depPlandTime=${todayStr}&_type=json`,
  `http://apis.data.go.kr/B551457/run/v2/getSttRtRouteTrnItnstList?serviceKey=${KORAIL_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT014439&depPlandTime=${todayStr}&_type=json`,
];

async function test() {
  for (const url of urlsToTest) {
    try {
      console.log("Testing:", url.split('?')[0]);
      const res = await fetch(url);
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Response:", text.substring(0, 200));
    } catch (err) {
      console.error(err.message);
    }
    console.log("-------------------");
  }
}
test();
