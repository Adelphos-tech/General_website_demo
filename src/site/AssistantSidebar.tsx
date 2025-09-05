import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Switch } from '../untitled/components/ui/switch';
import { Button } from '../untitled/components/ui/button';
import { MessageSquare, Send, Loader2, Bell, BellOff } from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { InteractiveGlobe } from '../untitled/components/InteractiveGlobe';
import { PremiumConversation } from '../untitled/components/PremiumConversation';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  images?: { src: string; alt?: string }[];
}

export default function AssistantSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'w', content: "Welcome! I'm your AI assistant. Ask me about any property.", isUser: false, timestamp: new Date() },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const [volume, setVolume] = useState(0);
  const [chatMode, setChatMode] = useState(false);
  const chatModeRef = useRef(chatMode);
  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);
  const [chatInput, setChatInput] = useState("");
  const [chimeEnabled, setChimeEnabled] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  // Persist chime preference across sessions
  useEffect(() => {
    try {
      const v = localStorage.getItem('assistant_chime_enabled');
      if (v !== null) setChimeEnabled(v === '1' || v === 'true');
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('assistant_chime_enabled', chimeEnabled ? '1' : '0'); } catch {}
  }, [chimeEnabled]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [bottomReserve, setBottomReserve] = useState(120);
  const VAPI_PUBLIC_KEY = (import.meta as any).env.VITE_VAPI_PUBLIC_KEY as string | undefined;
  const VAPI_ASSISTANT_ID = (import.meta as any).env.VITE_VAPI_ASSISTANT_ID as string | undefined;

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      // Add a message when no valid API key is provided
      setMessages(prev => [
        ...prev,
        { 
          id: 'api-key-missing', 
          content: "⚠️ This demo requires a Vapi API key. Please add your API key in the .env.local file.", 
          isUser: false, 
          timestamp: new Date() 
        }
      ]);
      return;
    }
    
    const v = new Vapi(
      VAPI_PUBLIC_KEY,
      undefined,
      { avoidEval: true, alwaysIncludeMicInPermissionPrompt: true },
    );
    v.on('call-start', () => { setIsListening(true); setIsProcessing(false); setLastError(null); });
    v.on('call-end', () => { setIsListening(false); setIsProcessing(false); });
    v.on('speech-start', () => setIsProcessing(true));
    v.on('speech-end', () => setIsProcessing(false));
    v.on('volume-level', (lvl: number) => setVolume(Math.max(0, Math.min(1, lvl))));
    v.on('call-start-failed', (e: any) => {
      const details = safeStringify(e);
      const msg = `Voice call failed to start. ${details ? `Details: ${details}` : ''}`.trim();
      setMessages(prev => [...prev, { id: 'err-'+Date.now(), content: msg, isUser: false, timestamp: new Date() }]);
      setIsProcessing(false);
      setLastError('Could not start voice chat. Please check mic permissions and try again.');
    });
    v.on('error', (e: any) => {
      const norm = normalizeError(e);
      setMessages(prev => [...prev, { id: 'err-'+Date.now(), content: `Error: ${norm}`, isUser: false, timestamp: new Date() }]);
      setLastError(norm);
    });
    v.on('message', async (m: any) => {
      // In chat mode, we do not consume or forward Vapi events
      if (chatModeRef.current) return;
      if (m?.type === 'transcript' && m.transcriptType === 'final') {
        const id = String(Date.now());
        if (m.role === 'user') {
          setMessages(prev => [...prev, { id, content: m.transcript, isUser: true, timestamp: new Date() }]);
        }
        if (m.role === 'assistant') {
          setMessages(prev => [...prev, { id: id+'a', content: m.transcript, isUser: false, timestamp: new Date() }]);
        }
      }
    });
    vapiRef.current = v;
    return () => { v.stop(); vapiRef.current = null; };
  }, []);

  // Subtle connect chime (muted by default)
  const playChime = async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime); // A5
      o.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.12); // quick glide up
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.25);
      // Close context slightly later to allow sound to finish
      setTimeout(() => { try { ctx.close(); } catch {} }, 300);
    } catch {}
  };

  useEffect(() => {
    if (!vapiRef.current) return;
    const onStart = () => { if (chimeEnabled) playChime(); };
    vapiRef.current.on('call-start', onStart);
    return () => { try { vapiRef.current?.off?.('call-start', onStart); } catch {} };
  }, [chimeEnabled]);

  const isSecure = (): boolean => {
    try { return (window as any).isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'; } catch { return true; }
  };
  const hasMediaDevices = (): boolean => {
    try { return !!(navigator.mediaDevices && (navigator.mediaDevices as any).enumerateDevices); } catch { return false; }
  };

  const start = async () => {
    if (!vapiRef.current) {
      // If no valid API key, add a message when user tries to interact
      if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        setMessages(prev => [
          ...prev,
          { 
            id: String(Date.now()), 
            content: "Please provide a valid Vapi API key in the .env.local file to enable voice interaction.", 
            isUser: false, 
            timestamp: new Date() 
          }
        ]);
      }
      return;
    }
    
    // Preflight checks for better UX
    if (!isSecure()) {
      const msg = 'Microphone requires a secure context. Please use HTTPS or localhost.';
      setMessages(prev => [...prev, { id: 'sec-'+Date.now(), content: msg, isUser: false, timestamp: new Date() }]);
      setLastError(msg);
      return;
    }
    if (!hasMediaDevices()) {
      const msg = 'Microphone is unavailable. Ensure your browser allows mic access.';
      setMessages(prev => [...prev, { id: 'mic-'+Date.now(), content: msg, isUser: false, timestamp: new Date() }]);
      setLastError(msg);
      return;
    }

    try {
      // Indicate starting state for the globe/UI until call-start
      setIsProcessing(true);
      if (VAPI_ASSISTANT_ID && VAPI_ASSISTANT_ID !== 'YOUR_ASSISTANT_ID') await vapiRef.current.start(VAPI_ASSISTANT_ID);
      else await vapiRef.current.start({
        model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: 'You are a property advisor for a real estate company.' }] },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
        firstMessage: 'Hi! Looking to buy, rent, or sell?'
      });
    } catch (error) {
      console.error('Error starting voice assistant:', error);
      const norm = normalizeError(error);
      setMessages(prev => [
        ...prev,
        { 
          id: String(Date.now()), 
          content: `There was an error starting the voice assistant. ${norm}`, 
          isUser: false, 
          timestamp: new Date() 
        }
      ]);
      // Friendly hints for common errors
      if (/NotAllowedError|Permission/i.test(norm)) setLastError('Mic permission denied. Allow microphone and try again.');
      else if (/NotFoundError/i.test(norm)) setLastError('No microphone found. Please connect a mic and retry.');
      else setLastError('Could not start voice chat. Please try again.');
      setIsProcessing(false);
    }
  };
  const stop = () => vapiRef.current?.stop();

  // Mute mic when entering text chat mode to avoid interference
  useEffect(() => {
    try { vapiRef.current?.setMuted?.(chatMode); } catch {}
  }, [chatMode]);

  // If chat mode is enabled while a call is active, stop the call
  useEffect(() => {
    if (chatMode && isListening) {
      try { stop(); } catch {}
    }
  }, [chatMode, isListening]);

  // Measure bottom controls height (input + typing) to avoid overlap
  useEffect(() => {
    const measure = () => {
      const h = bottomRef.current?.offsetHeight ?? 0;
      setBottomReserve(Math.max(72, h + 12));
    };
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window && bottomRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(bottomRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      try { ro?.disconnect(); } catch {}
    };
  }, [chatMode, isProcessing]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    try {
      const id = 'user-'+Date.now();
      setMessages(prev => [...prev, { id, content: text, isUser: true, timestamp: new Date() }]);
      setChatInput("");
      // Chat mode: webhook only; do not start or send via Vapi
      if (chatModeRef.current) {
        setIsProcessing(true);
        try {
          const resp = await postWebhook({ type: 'user', content: text, timestamp: new Date().toISOString() });
          // Collect image URLs from response
          const collectImages = (): { src: string; alt?: string }[] => {
            const out = new Map<string, string | undefined>();
            const addFrom = (s?: string) => {
              if (!s) return;
              // Markdown image syntax ![alt](url)
              for (const m of s.matchAll(/!\[([^\]]*)\]\((https?:[^)]+)\)/gi)) {
                const alt = m[1]?.trim() || undefined;
                const url = m[2];
                if (!out.has(url)) out.set(url, alt);
              }
              // Direct image URLs
              for (const m of s.matchAll(/https?:\/\/[^\s)"'<>]+?\.(?:png|jpe?g|gif|webp|svg)/gi)) {
                const url = m[0];
                if (!out.has(url)) out.set(url, undefined);
              }
            };
            try { if ((resp as any).text) addFrom((resp as any).text as string); } catch {}
            try { if ((resp as any).json) addFrom(JSON.stringify((resp as any).json)); } catch {}
            return Array.from(out, ([src, alt]) => ({ src, alt }));
          };
          const images = collectImages();

          const replyText = (() => {
            if (!resp) return 'Received.';
            if ((resp as any).json) {
              try { return JSON.stringify((resp as any).json, null, 2); } catch {}
            }
            if (typeof resp === 'string') return resp as any;
            if ((resp as any).text && (resp as any).text.trim().length > 0) return (resp as any).text;
            const status = (resp as any).status;
            const headers = (resp as any).headers || {};
            const hdrs = Object.entries(headers).map(([k,v])=>`${k}: ${v}`).join('\n');
            return `No content (status ${status}).${hdrs ? `\n\nHeaders:\n${hdrs}` : ''}`;
          })();
          // Remove inline markdown image tokens from text to avoid duplication
          const cleaned = replyText.replace(/!\[[^\]]*\]\((https?:[^)]+)\)/gi, '').trim();
          setMessages(prev => [...prev, { id: 'assist-'+Date.now(), content: formatReadable(cleaned), isUser: false, timestamp: new Date(), images }]);
        } catch (err) {
          setMessages(prev => [...prev, { id: 'err-'+Date.now(), content: `Webhook error: ${String(err)}`, isUser: false, timestamp: new Date() }]);
        } finally {
          setIsProcessing(false);
        }
        return;
      }
      // Voice mode: ensure session and send via Vapi
      if (!vapiRef.current) return;
      if (!isListening) {
        await start();
      }
      setIsProcessing(true);
      vapiRef.current.send({
        type: 'add-message',
        message: { role: 'user', content: text },
        triggerResponseEnabled: true,
      });
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err-'+Date.now(), content: `Send failed: ${String(e)}` , isUser: false, timestamp: new Date() }]);
    }
  };

  // Webhook: forward chat-mode messages to n8n
  const WEBHOOK_URL = 'https://aicompany1.app.n8n.cloud/webhook/59688087-8e7a-4476-a549-16070fb38c99';
  const postWebhook = async (payload: any): Promise<{ status: number; ok: boolean; headers: Record<string,string>; text: string; json?: any; } | null> => {
    const body = {
      source: 'assistant-sidebar',
      assistantId: VAPI_ASSISTANT_ID,
      ...payload,
    };
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors',
    });
    const headers: Record<string,string> = {};
    try { for (const [k, v] of (res.headers as any).entries()) headers[k] = v; } catch {}
    let text = '';
    try { text = await res.text(); } catch { text = ''; }
    let json: any | undefined = undefined;
    try { if (text) json = JSON.parse(text); } catch {}
    if (!res.ok) {
      const msg = `Webhook error (${res.status}). ${text ? text.slice(0, 400) : ''}`.trim();
      setLastError(msg);
    }
    return { status: res.status, ok: res.ok, headers, text, json };
  };

  // Format webhook/plain text for better readability in chat
  const formatReadable = (raw: string): string => {
    let text = (raw || '').replace(/\r\n/g, '\n');
    // Convert leading markdown bullets to dot bullets
    text = text.replace(/^\s*[\*-]\s+/gm, '• ');
    // Convert markdown numbered list like "1) " to "1. "
    text = text.replace(/^(\s*\d+)\)\s+/gm, '$1. ');
    // Collapse excessive blank lines (max 2)
    text = text.replace(/\n{3,}/g, '\n\n');
    // Convert markdown links [text](url) => text (url)
    text = text.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1 ($2)');
    // Remove emphasis markers *italic*, **bold** while keeping content
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    // Trim whitespace
    return text.trim();
  };

  return (
    <div className="assistant-sidebar">
      {/* Controls row */}
      <div className="assistant-toolbar">
        <div className="assistant-toolbar-spacer" />
        <div className="assistant-toolbar-center">
          <div className="assistant-toggle">
            <div className="seg-toggle" role="tablist" aria-label="Mode toggle">
              <button
                type="button"
                role="tab"
                aria-selected={!chatMode}
                className={`seg-btn ${!chatMode ? 'active' : ''}`}
                onClick={() => setChatMode(false)}
              >
                Voice
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chatMode}
                className={`seg-btn ${chatMode ? 'active' : ''}`}
                onClick={() => setChatMode(true)}
              >
                Chat
              </button>
              <span className="seg-active" style={{ transform: chatMode ? 'translateX(100%)' : 'translateX(0%)' }} />
            </div>
          </div>
        </div>
        <div className="assistant-toolbar-right">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setChimeEnabled(v => !v)}
              title={chimeEnabled ? 'Disable connect chime' : 'Enable connect chime'}
              aria-label={chimeEnabled ? 'Disable connect chime' : 'Enable connect chime'}
            >
              {chimeEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            {isListening && (
              <Button size="sm" variant="secondary" onClick={stop}>Stop</Button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {lastError && (
        <div className="assistant-alert" role="alert">
          <div className="msg">{lastError}</div>
          <div className="actions">
            {!chatMode && (
              <button onClick={() => { setLastError(null); start(); }} className="retry">Try again</button>
            )}
            <button onClick={() => setLastError(null)} className="dismiss" aria-label="Dismiss">Dismiss</button>
          </div>
        </div>
      )}

      {/* Globe area with smooth hide in chat mode */}
      <AnimatePresence initial={false}>
        {!chatMode && (
          <motion.div
            key="globe"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="assistant-globe"
          >
            <InteractiveGlobe onVoiceStart={start} onVoiceEnd={stop} isListening={isListening} isProcessing={isProcessing} volume={volume} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation + input */}
      <div className="assistant-chat">
        {/* Fill remaining height with the chat thread; input sits below */}
        <div className="chat-thread flex-1 min-h-0">
          <PremiumConversation
            messages={messages}
            isVisible={chatMode}
            fillContainer={chatMode}
            compactHeader
            bottomPaddingPx={chatMode ? bottomReserve : undefined}
          />
        </div>
        <div ref={bottomRef} style={{ paddingTop: 8 }}>
          <AnimatePresence>
            {chatMode && (
              <motion.div
                key="text-input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="assistant-input"
              >
                <MessageSquare className="assistant-input-icon" />
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                  placeholder={chatMode ? 'Type a message…' : (isListening ? 'Type a message to the assistant…' : 'Type to auto-start and send…')}
                />
                <button className="assistant-send" disabled={!chatInput.trim()} onClick={sendChatMessage} aria-label="Send message">
                  <Send className="assistant-send-icon" />
                  <span>Send</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {chatMode && isProcessing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="assistant-typing"
              >
                <div className="assistant-dots" aria-label="Assistant is thinking">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Assistant is responding…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
// Helpers
function safeStringify(v: any): string {
  try { if (typeof v === 'string') return v; return JSON.stringify(v); } catch { return String(v); }
}
function normalizeError(e: any): string {
  try {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e?.message) return e.message as string;
    return JSON.stringify(e);
  } catch { return 'Unknown error'; }
}
