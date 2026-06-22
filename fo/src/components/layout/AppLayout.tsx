import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export function AppLayout() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Touch Swipe Gesture Variables
  const routes = ['/', '/gpan', '/board', '/autopilot'];
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  const minSwipeDistanceX = 60; 
  const maxSwipeDistanceY = 40; 

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEndX(touch.clientX);
    setTouchEndY(touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - touchEndY);
    
    // Ignore swipe gesture if vertical scroll is dominant
    if (diffY > maxSwipeDistanceY) {
      return; 
    }
    
    const isLeftSwipe = diffX > minSwipeDistanceX;
    const isRightSwipe = diffX < -minSwipeDistanceX;
    
    const currentPath = window.location.pathname;
    const currentIndex = routes.indexOf(currentPath);
    
    if (currentIndex !== -1) {
      if (isLeftSwipe && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    }
    
    // Reset touch variables
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  // Load initial welcome message
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            sender: 'ai',
            text: '반가워요 기사님! 싹싹한 운수 비서 대통이입니다. 🌟 오늘 기상 상태와 교통 상황을 사주 일진과 RAG로 분석해서 안내해 드릴게요. 무엇이든 물어보세요!'
          }
        ]);
        setIsTyping(false);
      }, 800);
    }
  }, [isChatOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const driverId = localStorage.getItem('driverId') || '';
      const response = await fetch(`${API_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId,
          message: userMsg
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '어이쿠, 네트워크 신호가 약해서 연결이 지연되고 있네요! 안전운전이 최선이니 잠시 후 정차하신 뒤 다시 말씀해 주세요.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-secondary/30 flex justify-center">
      {/* 모바일 뷰어 프레임 컨테이너 */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-md bg-background min-h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.08)] border-x border-border/40"
      >
        
        {/* 프리미엄 격자선 배경 */}
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] z-0" />
        
        <TopAppBar />
        
        {/* 
          상단 TopAppBar 높이(4rem) + 하단 BottomNavBar 높이(5rem) 고려하여 패딩 설정
          pb-safe는 아이폰 하단 홈 인디케이터 여백 고려
        */}
        <main className="pt-16 pb-24 min-h-[100dvh] w-full overflow-x-hidden relative z-10">
          <Outlet />
        </main>

        <BottomNavBar />

        {/* Floating AI Chatbot Button */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 flex justify-end px-5">
          <button
            onClick={() => setIsChatOpen(true)}
            className="tap pointer-events-auto flex items-center gap-2 rounded-full bg-primary p-3.5 text-primary-foreground shadow-2xl border border-primary/20 hover:scale-105 transition-transform cursor-pointer"
            style={{
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              background: 'linear-gradient(135deg, oklch(0.18 0.008 60) 0%, oklch(0.24 0.008 70) 100%)'
            }}
          >
            <div className="relative">
              <MessageSquare className="h-5.5 w-5.5 text-gold animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <span className="text-xs font-bold font-sans tracking-wide pr-1 text-slate-100">대통이 Talk</span>
          </button>
        </div>

        {/* Interactive Chatbot Modal */}
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs px-5 pb-6">
            <div 
              className="bg-card/95 backdrop-blur-xl border border-border w-full max-w-md rounded-3xl shadow-2xl flex flex-col h-[70vh] max-h-[550px] animate-slide-up"
              style={{ contentVisibility: 'auto' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-border/80 bg-secondary/40 rounded-t-3xl backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground leading-none flex items-center gap-1.5">
                      AI 운수 비서 대통이
                    </h4>
                    <span className="text-[10px] text-emerald-500 font-bold block mt-1">● 실시간 RAG 관제 가동 중</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Message Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5 font-sans">
                {messages.map((msg, index) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div
                      key={index}
                      className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed font-medium shadow-xs border ${
                          isAi
                            ? 'bg-card border-border text-foreground rounded-tl-xs'
                            : 'bg-primary border-primary/20 text-primary-foreground rounded-tr-xs'
                        }`}
                        style={{
                          fontSize: '13.5px',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-card border border-border text-muted-foreground max-w-[80%] rounded-2xl px-4 py-3 text-[13px] rounded-tl-xs">
                      대통이가 생각하는 중... ⚡
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border/80 flex gap-2.5 bg-card rounded-b-3xl">
                <input
                  type="text"
                  placeholder="오늘의 사주 일진, 핫존, 날씨 등 물어보세요..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-[13px] focus:outline-none focus:border-gold text-foreground font-medium"
                />
                <button
                  type="submit"
                  disabled={isTyping || !inputValue.trim()}
                  className="tap p-3 rounded-xl bg-primary text-primary-foreground shadow flex items-center justify-center hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
