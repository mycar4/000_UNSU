const API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const url = `https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo?serviceKey=${API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT014439&depPlandTime=${todayStr}&_type=json&numOfRows=5&pageNo=1`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== TAGO TRAIN RAW RESPONSE ===");
    console.log(text.substring(0, 1000));
  })
  .catch(err => console.error(err));
