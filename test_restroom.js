const RESTROOM_API_KEY = "c51138e2f81d212d012e795a73b7607d4796b3bdefa0348db8474ef8a1baae45";
const url = `https://apis.data.go.kr/1741000/public_restroom_info_v2/info_v2?serviceKey=${RESTROOM_API_KEY}&returnType=JSON&numOfRows=1&pageNo=1`;

fetch(url)
  .then(res => res.json())
  .then(json => {
    console.log("=== RESTROOM KEYS ===");
    const item = json.response.body.items.item[0];
    console.log(Object.keys(item));
  })
  .catch(err => console.error(err));
