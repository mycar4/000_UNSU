const AIRPORT_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const url = `https://apis.data.go.kr/B551178/flight-status/detail?serviceKey=${AIRPORT_API_KEY}&type=json&numOfRows=5`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== AIRPORT RAW RESPONSE ===");
    console.log(text.substring(0, 1000));
  })
  .catch(err => console.error(err));
