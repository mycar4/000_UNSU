const METRO_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const url = `http://apis.data.go.kr/1613000/SubwayInfoService/getSubwaySttnAcptMsg?serviceKey=${METRO_API_KEY}&subwayStationId=SUB120&_type=json`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== RAW RESPONSE ===");
    console.log(text.substring(0, 500));
  })
  .catch(err => console.error(err));
