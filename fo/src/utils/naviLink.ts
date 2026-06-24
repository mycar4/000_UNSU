export function openNavigationApp(
  preference: 'TMAP' | 'KAKAONAVI' | string = 'TMAP',
  destName: string,
  lat: number | string,
  lon: number | string
) {
  const name = encodeURIComponent(destName || '목적지');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (!isMobile) {
    // PC 환경에서는 앱 인텐트 대신 웹 브라우저 지도로 폴백 (카카오맵웹)
    alert('PC 환경에서는 웹 지도 길찾기로 연결됩니다.');
    const webUrl = `https://map.kakao.com/link/to/${name},${lat},${lon}`;
    window.open(webUrl, '_blank');
    return;
  }
  
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
