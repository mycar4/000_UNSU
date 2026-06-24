const METRO_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const url = `https://apis.data.go.kr/1613000/SubwayInfo/GetSubwaySttnAcctoSchdulList?serviceKey=${METRO_API_KEY}&subwayStationId=SUB120&dailyTypeCode=01&upDownTypeCode=U&_type=json&numOfRows=5`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== METRO RAW RESPONSE ===");
    console.log(text.substring(0, 1000));
  })
  .catch(err => console.error(err));
