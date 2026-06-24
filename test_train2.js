const KORAIL_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10).replace(/-/g, '');
const url = `https://apis.data.go.kr/B551457/run/v2/travelerTrainRunInfo2?serviceKey=${KORAIL_API_KEY}&returnType=JSON&numOfRows=2&cond[run_ymd::EQ]=${yesterdayStr}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("=== TRAIN RAW RESPONSE ===");
    console.log(text.substring(0, 1000));
  })
  .catch(err => console.error(err));
