const KORAIL_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const url = `http://apis.data.go.kr/1613000/TrainInfoService/getSttRtRouteTrnItnstList?serviceKey=${KORAIL_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT014439&depPlandTime=${todayStr}&_type=json`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== RAW RESPONSE ===");
    console.log(text.substring(0, 500)); // Print first 500 chars to avoid flood
  })
  .catch(err => console.error(err));
