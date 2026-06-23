import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const FloatingChatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    return sessionStorage.getItem('chatbot_welcomed') !== 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  // [Task 21 교정] Line 33: NodeJS.Timeout 충돌 버그를 window 스코프 지정을 통해 완벽 해결
  useEffect(() => {
    let timer: number | null = null;
    if (showWelcome) {
      timer = window.setTimeout(() => {
        setShowWelcome(false);
        sessionStorage.setItem('chatbot_welcomed', 'true');
      }, 8000);
    }
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [showWelcome]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setShowWelcome(false);
    sessionStorage.setItem('chatbot_welcomed', 'true');
  };

  // Load initial welcome message (메모리 누수 차단 타이머 가드 추가)
  useEffect(() => {
    let initTimer: number | null = null;
    if (isChatOpen && messages.length === 0) {
      setIsTyping(true);
      initTimer = window.setTimeout(() => {
        setMessages([
          {
            sender: 'ai',
            text: '반가워요 기사님! 싹싹한 운수 비서 대통이입니다. 🌟 오늘 기상 상태와 교통 상황을 사주 일진과 RAG로 분석해서 안내해 드릴게요. 무엇이든 물어보세요!'
          }
        ]);
        setIsTyping(false);
      }, 800);
    }
    return () => {
      if (initTimer !== null) {
        window.clearTimeout(initTimer);
      }
    };
  }, [isChatOpen, messages.length]);

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
        // [보안/확장 안전 수칙] 응답 객체 타입을 명확히 강제 선언
        const data = (await response.json()) as { reply: string };
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
    <>
      {/* Floating AI Chatbot Button & Welcome Bubble */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 flex flex-col items-end gap-3 px-5">
        {/* Welcome Bubble for first access */}
        {showWelcome && (
          <div 
            onClick={handleOpenChat}
            className="tap pointer-events-auto max-w-[260px] bg-card border-2 border-gold/60 rounded-2xl p-3.5 shadow-2xl animate-fade-in flex flex-col gap-1.5 cursor-pointer hover:border-gold/90 transition-all relative"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
          >
            {/* Small tail pointing to the chat button */}
            <div className="absolute bottom-[-8px] right-6 w-3.5 h-3.5 bg-card border-r-2 border-b-2 border-gold/60 rotate-45" />
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold border border-gold/20 flex items-center gap-1">
                <Sparkles size={10} className="animate-pulse" />
                대통이의 첫 인사
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWelcome(false);
                  sessionStorage.setItem('chatbot_welcomed', 'true');
                }}
                className="tap text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-[12px] leading-relaxed text-foreground font-semibold">
              반가워요 기사님! 싹싹한 비서 대통이입니다. 🌟 기상/교통 상황을 사주 일진과 융합해서 알려드릴게요!
            </p>
          </div>
        )}

        <button
          onClick={handleOpenChat}
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
            className="bg-card/90 backdrop-blur-xl border border-border w-full max-w-md rounded-3xl shadow-2xl flex flex-col h-[70vh] max-h-[550px] animate-slide-up"
            // [보안/컴파일 방어] contentVisibility 속성이 구형 개발환경 스키마에서 터지는 현상을 방어하기 위해 CSSProperties 확증 처리
            style={{ contentVisibility: 'auto' } as React.CSSProperties}
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
                className="tap text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed font-medium shadow-xs border whitespace-pre-wrap break-words ${
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
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-[13px] focus:outline-hidden focus:ring-2 focus:ring-gold/30 focus:border-gold text-foreground font-medium"
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
    </>
  );
};