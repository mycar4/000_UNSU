import React, { useState } from 'react';
import { Trophy, MessageSquare, ThumbsUp, Send } from 'lucide-react';

export function RoadboarderPage() {
  const [posts, setPosts] = useState([
    { id: 1, author: '서울 개인 9993', time: '10분 전', content: '오늘 서부간선도로 정체 진짜 헬이네요. 우회로 타실 분들 참고하세요.', likes: 12, comments: 4, liked: false },
    { id: 2, author: '인천 개인 7001', time: '1시간 전', content: '김포공항 아침 8시 비행기 도착 시간 맞춰 갔더니 1.5만 원 꿀콜 잡았습니다. 다들 안전운전 하세요!', likes: 25, comments: 8, liked: false },
    { id: 3, author: '경기 개인 4212', time: '3시간 전', content: '운수대통 AI 행운카드 보구 청담동 돌았더니 진짜로 용인가는 5만원 장거리 손님 탔네요 ㄷㄷ 신기방기', likes: 38, comments: 12, liked: false }
  ]);

  const [newPostContent, setNewPostContent] = useState('');

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
      author: '서울 개인 (나)',
      time: '방금 전',
      content: newPostContent,
      likes: 0,
      comments: 0,
      liked: false
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const ranks = [
    { rank: 1, name: '서울 개인 9882', route: '강남역 → 판교 테크노', price: '48,500원', color: 'text-gold bg-gold/10 border-gold/30' },
    { rank: 2, name: '인천 개인 1204', route: '청라국제도시 → 김포공항', price: '32,000원', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
    { rank: 3, name: '경기 개인 5530', route: '수원 영통 → 가산디지털', price: '29,400원', color: 'text-amber-700 bg-amber-700/10 border-amber-700/20' }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      {/* 배경 라인 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />

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
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy className="text-gold h-5 w-5 animate-pulse" />
              오늘의 탑 보더
            </h3>
            <span className="mono-label text-[10px] text-muted-foreground">AM 09:00 기준</span>
          </div>
          
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
                    <div className="font-bold text-foreground">{r.name}</div>
                    <div className="text-sm text-muted-foreground leading-tight mt-0.5">{r.route}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-foreground font-mono mono-label">{r.price}</div>
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
          <form onSubmit={handleAddPost} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
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
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
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
        </section>

      </div>
    </div>
  );
}
