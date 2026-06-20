export function openNavigationApp(
  preference: 'TMAP' | 'KAKAONAVI' | string = 'TMAP',
  destName: string,
  lat: number | string,
  lon: number | string
) {
  const name = encodeURIComponent(destName || '목적지');
  
  if (preference === 'KAKAONAVI') {
    // KakaoNavi intent
    // WGS84 좌표계를 사용 (dest_x = 경도, dest_y = 위도)
    const url = `kakaonavi://navigate?destination=${name}&x=${lon}&y=${lat}`;
    window.location.href = url;
  } else {
    // TMap intent
    // WGS84 좌표계를 사용 (goalx = 경도, goaly = 위도)
    const url = `tmap://route?goalname=${name}&goalx=${lon}&goaly=${lat}`;
    window.location.href = url;
  }
}
