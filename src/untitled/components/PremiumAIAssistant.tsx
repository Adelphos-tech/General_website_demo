import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveGlobe } from './InteractiveGlobe';
import { PremiumConversation } from './PremiumConversation';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Settings, Menu, X, Bell, BellOff } from 'lucide-react';
import Vapi from '@vapi-ai/web';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function PremiumAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Welcome! I'm your AI assistant. Touch the globe and speak to me naturally.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showConversation, setShowConversation] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(true);
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chimeEnabled, setChimeEnabled] = useState(false);
  // Persist chime preference across sessions (shared key with sidebar)
  useEffect(() => {
    try {
      const v = localStorage.getItem('assistant_chime_enabled');
      if (v !== null) setChimeEnabled(v === '1' || v === 'true');
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('assistant_chime_enabled', chimeEnabled ? '1' : '0'); } catch {}
  }, [chimeEnabled]);
  // Vapi client
  const vapiRef = useRef<Vapi | null>(null);
  const VAPI_PUBLIC_KEY = (import.meta as any).env.VITE_VAPI_PUBLIC_KEY as string | undefined;
  const VAPI_ASSISTANT_ID = (import.meta as any).env.VITE_VAPI_ASSISTANT_ID as string | undefined;

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      setMessages(prev => [...prev, { id: 'nokey', content: 'VITE_VAPI_PUBLIC_KEY missing in .env.local', isUser: false, timestamp: new Date() }]);
      return;
    }
    const v = new Vapi(
      VAPI_PUBLIC_KEY,
      undefined,
      { avoidEval: true, alwaysIncludeMicInPermissionPrompt: true },
    );
    v.on('call-start', () => { setIsListening(true); setIsProcessing(false); setShowConversation(true); if (chimeEnabled) try { playChime(); } catch {} });
    v.on('call-end', () => { setIsListening(false); setIsProcessing(false); });
    v.on('speech-start', () => setIsProcessing(true));
    v.on('speech-end', () => setIsProcessing(false));
    v.on('volume-level', (lvl: number) => setVolume(Math.max(0, Math.min(1, lvl))));
    v.on('message', (m: any) => {
      if (m?.type === 'transcript' && m.transcriptType === 'final') {
        const id = String(Date.now());
        if (m.role === 'user') setMessages(prev => [...prev, { id, content: m.transcript, isUser: true, timestamp: new Date() }]);
        if (m.role === 'assistant') setMessages(prev => [...prev, { id: id+'a', content: m.transcript, isUser: false, timestamp: new Date() }]);
      }
    });
    v.on('error', (e: any) => {
      const msg = (() => { try { return typeof e==='string'? e : JSON.stringify(e);} catch { return 'Unknown error'; }})();
      setMessages(prev => [...prev, { id: 'err-'+Date.now(), content: `Error: ${msg}`, isUser: false, timestamp: new Date() }]);
      setIsListening(false); setIsProcessing(false);
    });
    vapiRef.current = v;
    return () => { v.stop(); vapiRef.current = null; };
  }, []);

  // When entering chat mode, mute the mic to avoid accidental voice input
  useEffect(() => {
    try { vapiRef.current?.setMuted?.(chatMode); } catch {}
  }, [chatMode]);

  const handleVoiceStart = async () => {
    if (!vapiRef.current) return;
    try {
      setMessages(prev => [...prev, { id: 'sys-'+Date.now(), content: 'Starting Vapi call…', isUser: false, timestamp: new Date() }]);
      setIsProcessing(true);
      if (VAPI_ASSISTANT_ID) {
        await vapiRef.current.start(VAPI_ASSISTANT_ID);
      } else {
        await vapiRef.current.start({
          model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: 'You are a helpful voice assistant.' }] },
          voice: { provider: 'vapi', voiceId: 'Elliot' },
          transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
          firstMessage: "Hello! I'm your AI assistant. How can I help you today?",
        });
      }
    } catch (e) {
      setIsProcessing(false);
    }
  };

  // Subtle connect chime (muted by default)
  const playChime = async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.25);
      setTimeout(() => { try { ctx.close(); } catch {} }, 300);
    } catch {}
  };

  const handleVoiceEnd = () => {
    setMessages(prev => [...prev, { id: 'sys-'+Date.now(), content: 'Stopping call…', isUser: false, timestamp: new Date() }]);
    vapiRef.current?.stop();
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    try {
      if (!vapiRef.current) return;
      // Ensure a session is active for text chat
      if (!isListening) {
        await handleVoiceStart();
      }
      const id = 'user-'+Date.now();
      setMessages(prev => [...prev, { id, content: text, isUser: true, timestamp: new Date() }]);
      setChatInput("");
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0">
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-6"
      >
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <motion.h1 
            className="text-2xl font-medium text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            AI Globe Assistant
          </motion.h1>
          
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setChimeEnabled(v => !v)}
              title={chimeEnabled ? 'Disable connect chime' : 'Enable connect chime'}
              aria-label={chimeEnabled ? 'Disable connect chime' : 'Enable connect chime'}
            >
              {chimeEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setShowMenu(!showMenu)}
            >
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 min-h-[calc(100vh-120px)] px-6">
        {isListening ? (
          <div className="mx-auto w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 pt-10 items-start">
            {/* Mobile: compact globe above conversation */}
            <div className="flex md:hidden flex-col items-center gap-3">
              <div className="scale-[0.7]">
                <InteractiveGlobe
                  onVoiceStart={handleVoiceStart}
                  onVoiceEnd={handleVoiceEnd}
                  isListening={isListening}
                  isProcessing={isProcessing}
                  volume={volume}
                />
              </div>
              <div className="text-[12px] leading-tight text-white/70 text-center px-3">
                Tap the globe to start talking to our experts instantly
              </div>
            </div>

            {/* Desktop: compact globe sidebar */}
            <div className="hidden md:flex flex-col items-center gap-4 sticky top-24 h-min">
              <div className="scale-[0.45] origin-top-left">
                <InteractiveGlobe
                  onVoiceStart={handleVoiceStart}
                  onVoiceEnd={handleVoiceEnd}
                  isListening={isListening}
                  isProcessing={isProcessing}
                />
              </div>
              <div className="text-[11px] leading-tight text-white/70 text-center">
                Tap to continue speaking<br />
                Tap the globe to start talking to our experts instantly
              </div>
            </div>

            {/* Right: conversation maximized with controls */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-sm">Show transcript</span>
                    <Switch
                      checked={transcriptVisible}
                      onCheckedChange={(v) => setTranscriptVisible(!!v)}
                      aria-label="Toggle transcript visibility"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-sm">Chat mode</span>
                    <Switch
                      checked={chatMode}
                      onCheckedChange={(v) => setChatMode(!!v)}
                      aria-label="Toggle chat mode"
                    />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    try { vapiRef.current?.stop(); } catch {}
                    setIsListening(false);
                    setIsProcessing(false);
                    setMessages([{ id: '1', content: "Welcome! I'm your AI assistant. Touch the globe and speak to me naturally.", isUser: false, timestamp: new Date() }]);
                    setShowConversation(false);
                    setChatMode(false);
                  }}
                >
                  New Chat
                </Button>
              </div>
              <PremiumConversation messages={messages} isVisible={transcriptVisible} />
              <AnimatePresence>
                {chatMode && (
                  <motion.div
                    key="chat-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-2"
                  >
                    <input
                      className="flex-1 bg-transparent text-white placeholder-white/50 outline-none px-3 py-2"
                      placeholder={isListening ? 'Type a message to the assistant…' : 'Start will auto-connect and send…'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                    />
                    <Button
                      variant="secondary"
                      disabled={!chatInput.trim()}
                      onClick={sendChatMessage}
                    >
                      Send
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <InteractiveGlobe
                onVoiceStart={handleVoiceStart}
                onVoiceEnd={handleVoiceEnd}
                isListening={isListening}
                isProcessing={isProcessing}
                volume={volume}
              />
            </motion.div>
            <PremiumConversation messages={messages} isVisible={showConversation} />
          </div>
        )}
      </main>

      {/* Side menu overlay */}
      {showMenu && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="fixed right-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6"
        >
          <div className="mt-20">
            <h3 className="text-white text-lg mb-6">Settings</h3>
            <div className="space-y-4 text-white/70">
              <p>Voice Recognition: Enabled</p>
              <p>Language: English</p>
              <p>Theme: Premium Dark</p>
              <p>Conversations: {messages.length - 1}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
