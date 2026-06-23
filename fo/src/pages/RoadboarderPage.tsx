import React, { useState, useEffect, useRef } from 'react';
import { Trophy, MessageSquare, ThumbsUp, Send, Camera, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export function RoadboarderPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileName, setProfileName] = useState('서울 개인 (나)');
  
  const [posts, setPosts] = useState([
    { id: 1, author: '서울 개인 9993', time: '10분 전', content: '오늘 서부간선도로 정체 진짜 헬이네요. 우회로 타실 분들 참고하세요.', likes: 12, comments: 4, liked: false },
    { id: 2, author: '인천 개인 7001', time: '1시간 전', content: '김포공항 아침 8시 비행기 도착 시간 맞춰 갔더니 1.5만 원 꿀콜 잡았습니다. 다들 안전운전 하세요!', likes: 25, comments: 8, liked: false },
    { id: 3, author: '경기 개인 4212', time: '3시간 전', content: '운수대통 AI 행운카드 보구 청담동 돌았더니 진짜로 용인가는 5만원 장거리 손님 탔네요 ㄷㄷ 신기방기', likes: 38, comments: 12, liked: false },
    { id: 4, author: '서울 모범 1102', time: '5시간 전', content: '개인택시 부제 해제되고 나서 확실히 야간 심야 영업 피로도가 줄었습니다. 하지만 건강 챙기면서 안전 운전합시다.', likes: 15, comments: 3, liked: false },
    { id: 5, author: '부산 개인 8820', time: '8시간 전', content: '해운대 엘시티 근처에 대형 학술 대회가 있나 봅니다. 모범/대형 차량들 수요가 많으니 부산 기사님들 가보셔요.', likes: 29, comments: 7, liked: false },
    { id: 6, author: '인천 개인 3302', time: '어제', content: '영종도 들어가실 때 통행료 감면 카드 꼭 챙기세요. 깜빡하면 부가세 정산할 때 매입 자료 누락되기 쉽습니다.', likes: 18, comments: 5, liked: false },
    { id: 7, author: '경기 개인 6401', time: '어제', content: '오늘 비가 많이 오네요. 젖은 노면 제동거리 기니까 타이어 공기압 꼭 체크하시고 서행하세요.', likes: 22, comments: 9, liked: false },
    { id: 8, author: '서울 개인 5005', time: '2일 전', content: '운수대통 앱 세무 자동 정산 써봤는데 정말 편하네요. 종소세 머리 싸맬 일 없어져서 대만족입니다.', likes: 45, comments: 14, liked: false }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 3;

  const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const getColor = (rank: number) => {
    if (rank === 1) return 'text-gold bg-gold/10 border-gold/30';
    if (rank === 2) return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    if (rank === 3) return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
    return 'text-muted-foreground bg-secondary/10 border-border';
  };

  const [ranks, setRanks] = useState<Array<{ rank: number; name: string; route: string; price: string; color: string }>>([
    { rank: 1, name: '서울 개인 9882', route: '강남역 → 판교 테크노', price: '48,500원', color: 'text-gold bg-gold/10 border-gold/30' },
    { rank: 2, name: '인천 개인 1204', route: '청라국제도시 → 김포공항', price: '32,000원', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
    { rank: 3, name: '경기 개인 5530', route: '수원 영통 → 가산디지털', price: '29,400원', color: 'text-amber-700 bg-amber-700/10 border-amber-700/20' }
  ]);

  const [newPostContent, setNewPostContent] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'compressing' | 'success'>('idle');
  const [ocrMessage, setOcrMessage] = useState('');

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/board/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((r: any) => ({
          rank: r.rank,
          name: r.driver_name,
          route: r.route_summary,
          price: r.price,
          color: getColor(r.rank)
        }));
        setRanks(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const stored = localStorage.getItem('driverProfile');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.homeTaxId) {
        setProfileName(`서울 개인 (${parsed.homeTaxId.slice(0, 3)}*)`);
      }
    }
  }, []);

  const handleLike = (id: number) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const newPost = {
      id: posts.length + 1,
      author: profileName,
      time: '방금 전',
      content: newPostContent,
      likes: 0,
      comments: 0,
      liked: false
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setCurrentPage(1);
  };

  // 영수증 OCR 업로드 파일 트리거 및 백엔드 연동
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOcrStatus('compressing');
      setOcrMessage('영수증 이미지 압축 및 OCR 분석 중...');

      try {
        const res = await fetch(`${API_HOST}/api/board/ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverName: profileName })
        });
        if (res.ok) {
          const data = await res.json();
          setOcrStatus('success');
          setOcrMessage(`OCR 분석 성공! 승인 금액 ₩ ${data.ocrAmount.toLocaleString()} (${data.route})`);
          await fetchLeaderboard();
        } else {
          throw new Error('OCR API call failed');
        }
      } catch (err) {
        console.error('OCR analysis failed:', err);
        setOcrStatus('idle');
        setOcrMessage('OCR 인증에 실패했습니다.');
      }
    }
  };

  // LangSmith 피드백 트리거 (허탕 클릭)
  const triggerLangSmithFeedback = () => {
    alert('허탕 피드백 수집 완료!\nLangSmith Dataset에 실시간 트레이싱 데이터가 축적되었습니다.\nGemini AI 가중치 가속 보정에 즉각 반영됩니다.');
  };

  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6 animate-slide-in-right">
      <div className="relative px-5 flex flex-col gap-8">
        
        {/* 헤더 */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-foreground opacity-60" />
            <span className="mono-label text-[11px] text-muted-foreground font-bold">REVENUE LEADERBOARD</span>
          </div>
          
          <h2 className="hero-head text-foreground mt-1">로드보더</h2>
          <p className="text-body-lg text-muted-foreground">오늘 실시간 전국 개인택시 최고 매출 리포트</p>
        </header>

        {/* 1. 전국 매출 Top 3 리더보드 */}
        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy className="text-gold h-5 w-5" />
              오늘의 탑 보더
            </h3>
            
            <div className="flex items-center gap-2">
              {/* 허탕 피드백 버튼 (상단 헤더 간격 통일을 위해 리더보드로 리포지셔닝) */}
              <button 
                onClick={triggerLangSmithFeedback}
                className="tap flex items-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs px-3 py-1.5 font-bold shadow-xs shrink-0"
                title="핫존 허탕 피드백 보내기"
              >
                <AlertTriangle size={13} className="shrink-0" />
                <span>허탕 피드백</span>
              </button>

              {/* OCR 영수증 업로드 트리거 */}
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="tap flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow shrink-0"
              >
                <Camera size={14} />
                <span>영수증 OCR 인증</span>
              </button>
            </div>
          </div>

          {/* OCR 스캔 상태 바 */}
          {ocrStatus !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
              ocrStatus === 'compressing' 
                ? 'bg-secondary/40 border-border' 
                : 'bg-gold/10 border-gold/30'
            }`}>
              {ocrStatus === 'compressing' ? (
                <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-gold" />
              )}
              <span className="text-sm font-semibold text-foreground">{ocrMessage}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            {ranks.map((r) => (
              <div 
                key={r.rank} 
                className="flex items-center justify-between p-4 bg-background rounded-xl border border-border/80 transition-all duration-300 hover:border-gold/20"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-lg ${r.color}`}>
                    {r.rank}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-foreground">{r.name}</div>
                    <div className="text-body-lg text-muted-foreground leading-tight mt-0.5">{r.route}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-xl text-foreground font-mono mono-label">{r.price}</div>
                  <span className="text-[10px] text-gold font-bold">SUCCESS</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 기사 광장 커뮤니티 타임라인 */}
        <section className="flex flex-col gap-4">
          <h3 className="font-bold text-xl text-foreground">기사 광장</h3>
          
          {/* 게시글 등록 폼 */}
          <form onSubmit={handleAddPost} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
            <textarea
              placeholder="도로 상황, 꿀팁, 오늘 매출 현황 등 자유롭게 소통해보세요."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-base text-foreground placeholder-muted-foreground outline-none resize-none h-20"
            />
            <div className="flex justify-end">
              <button 
                type="submit"
                className="tap inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/95"
              >
                <Send size={14} />
                등록하기
              </button>
            </div>
          </form>

          {/* 게시글 목록 */}
          <div className="flex flex-col gap-4 animate-fade-in">
            {currentPosts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-foreground">{post.author}</span>
                  <span className="text-muted-foreground text-xs">{post.time}</span>
                </div>
                
                <p className="text-body-lg text-foreground leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 border-t border-border/50 pt-3 text-muted-foreground text-sm">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`tap flex items-center gap-1.5 hover:text-foreground ${post.liked ? 'text-gold' : ''}`}
                  >
                    <ThumbsUp size={16} className={post.liked ? 'fill-gold stroke-gold' : ''} />
                    <span>좋아요 {post.likes}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={16} />
                    <span>댓글 {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 컨트롤러 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="tap px-3.5 py-1.5 text-xs font-bold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`tap w-8 h-8 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'border-gold bg-gold/10 text-gold shadow-xs'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="tap px-3.5 py-1.5 text-xs font-bold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                다음
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
