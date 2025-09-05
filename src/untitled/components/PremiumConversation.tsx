import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  images?: { src: string; alt?: string }[];
}

interface PremiumConversationProps {
  messages: ChatMessage[];
  isVisible: boolean;
  fillContainer?: boolean; // when true, stretch to fill parent height
  compactHeader?: boolean; // when true, hide the header bar
  bottomPaddingPx?: number; // extra space at bottom to avoid overlap with input
}

export function PremiumConversation({ messages, isVisible, fillContainer = false, compactHeader = false, bottomPaddingPx }: PremiumConversationProps) {
  if (!isVisible || messages.length <= 1) return null;

  // Collapse-older: show only last K messages until expanded
  const K = 30; // number of most-recent messages to always show
  const tailStart = Math.max(1, messages.length - K);
  const older = messages.slice(1, tailStart);
  const tail = messages.slice(tailStart);
  const [showOlder, setShowOlder] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: { src: string; alt?: string }[]; index: number } | null>(null);
  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightbox(null); }
      if (e.key === 'ArrowLeft') {
        setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb);
      }
      if (e.key === 'ArrowRight') {
        setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const scrollWrapRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages (only if user is near bottom)
  useEffect(() => {
    try {
      const wrap = scrollWrapRef.current;
      if (!wrap) return;
      const vp = wrap.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
      if (!vp) return;
      const threshold = 64; // px from bottom to auto-stick
      const distanceFromBottom = (vp.scrollHeight - vp.clientHeight) - vp.scrollTop;
      if (distanceFromBottom <= threshold) {
        vp.scrollTop = vp.scrollHeight;
      }
    } catch {}
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full max-w-[1400px] mx-auto ${fillContainer ? 'mt-2 h-full flex flex-col min-h-0' : 'mt-6'}`}
    >
      <div className={`backdrop-blur-md bg-black/20 rounded-2xl border border-white/10 overflow-hidden ${fillContainer ? 'flex flex-col h-full min-h-0' : ''}`}>
        {!compactHeader && (
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white/90 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Conversation History
            </h2>
          </div>
        )}
        
        <div ref={scrollWrapRef} className="flex-1 h-full min-h-0">
          <ScrollArea className={(fillContainer ? 'flex-1 h-full ' : 'h-[70vh] ') + 'assistant-scroll'}>
            <div className="p-6 space-y-6" style={{ paddingBottom: (bottomPaddingPx ?? (fillContainer ? 112 : 96)) }}>
            {!showOlder && older.length > 0 && (
              <div className="flex justify-center">
                <button
                  className="px-3 py-1.5 text-sm rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white/80"
                  onClick={() => setShowOlder(true)}
                >
                  Show older ({older.length})
                </button>
              </div>
            )}
            <AnimatePresence>
              {(showOlder ? older.concat(tail) : tail).map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.isUser ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20">
                    <AvatarFallback 
                      className={`${
                        message.isUser 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-gradient-to-br from-purple-500 to-pink-600'
                      } text-white`}
                    >
                      {message.isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col max-w-[70%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <motion.div
                      className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${
                        message.isUser
                          ? 'bg-gradient-to-br from-blue-500/80 to-purple-600/80 text-white'
                          : 'bg-white/10 border border-white/20 text-white/90'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {!message.isUser && message.images && message.images.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: message.images.length > 1 ? '1fr 1fr' : '1fr',
                            gap: 8,
                            marginTop: 8,
                            maxWidth: '520px',
                          }}
                        >
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.src}
                              alt={img.alt || `assistant-image-${idx}`}
                              style={{
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => { e.stopPropagation(); if (message.images) setLightbox({ images: message.images, index: idx }); }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                    <span className="text-xs text-white/50 mt-1 px-2">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position:'relative', maxWidth: '92vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {(() => { const cur = lightbox.images[lightbox.index] || lightbox.images[0]; return (
              <>
                <img src={cur.src} alt={cur.alt || 'assistant-image'} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)' }} />
                {(cur.alt || cur.src) && (
                  <div style={{ color: '#fff', marginTop: 10, fontSize: 13, opacity: 0.9, textAlign: 'center' }}>
                    {cur.alt || cur.src}
                  </div>
                )}
              </>
            ); })()}
            {/* Controls */}
            {lightbox.images.length > 1 && (
              <>
                <button
                  onClick={() => setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb)}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer' }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={() => setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer' }}
                  aria-label="Next image"
                >
                  ›
                </button>
                <div style={{ position: 'absolute', bottom: 10, color: '#fff', fontSize: 12, opacity: 0.8 }}>
                  {lightbox.index + 1} / {lightbox.images.length}
                </div>
              </>
            )}
            <button
              onClick={() => setLightbox(null)}
              style={{ position:'absolute', top: 8, right: 8, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
