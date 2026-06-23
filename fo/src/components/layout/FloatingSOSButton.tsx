import React from 'react';
import { AlertTriangle } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function FloatingSOSButton() {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 flex flex-col items-start px-5">
      <button 
        onClick={() => {
          const fetchRestrooms = async (latitude?: number, longitude?: number) => {
            try {
              let url = `${API_HOST}/api/external/restrooms`;
              if (latitude !== undefined && longitude !== undefined) {
                url += `?lat=${latitude}&lon=${longitude}`;
              }
              const res = await fetch(url);
              const data = await res.json();
              if (data && data.length > 0) {
                const formattedDistance = data[0].distanceMeter >= 1000 
                  ? `${(data[0].distanceMeter / 1000).toFixed(1)}km` 
                  : `${data[0].distanceMeter}m`;
                alert(`🚨 긴급 화장실 탐색 완료!\n\n가장 가까운 화장실: ${data[0].name}\n거리: ${formattedDistance}\n주소: ${data[0].address}\n(주정차 단속 유예 구역)`);
              } else {
                alert("주변에 이용 가능한 개방 화장실이 없습니다.");
              }
            } catch(e) {
              alert("현재 위치 주변 개방 화장실 정보를 가져올 수 없습니다.");
            }
          };

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                fetchRestrooms(position.coords.latitude, position.coords.longitude);
              },
              (err) => {
                console.warn('[Geolocation] Failed to get location, falling back to default:', err.message);
                fetchRestrooms();
              },
              { timeout: 5000 }
            );
          } else {
            fetchRestrooms();
          }
        }}
        className="pointer-events-auto tap bg-destructive/95 text-destructive-foreground p-3.5 rounded-full shadow-2xl border-2 border-destructive flex items-center justify-center animate-bounce hover:bg-destructive cursor-pointer shrink-0"
        style={{ boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)' }}
      >
        <AlertTriangle size={22} className="text-white animate-pulse" />
        <span className="sr-only">긴급 화장실 찾기</span>
      </button>
    </div>
  );
}
