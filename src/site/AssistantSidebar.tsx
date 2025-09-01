import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { InteractiveGlobe } from '../untitled/components/InteractiveGlobe';
import { PremiumConversation } from '../untitled/components/PremiumConversation';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AssistantSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'w', content: "Welcome! I'm your AI assistant. Ask me about any property.", isUser: false, timestamp: new Date() },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const VAPI_PUBLIC_KEY = (import.meta as any).env.VITE_VAPI_PUBLIC_KEY as string | undefined;
  const VAPI_ASSISTANT_ID = (import.meta as any).env.VITE_VAPI_ASSISTANT_ID as string | undefined;

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) return;
    const v = new Vapi(
      VAPI_PUBLIC_KEY,
      undefined,
      { avoidEval: true, alwaysIncludeMicInPermissionPrompt: true },
    );
    v.on('call-start', () => { setIsListening(true); setIsProcessing(false); });
    v.on('call-end', () => { setIsListening(false); setIsProcessing(false); });
    v.on('speech-start', () => setIsProcessing(true));
    v.on('speech-end', () => setIsProcessing(false));
    v.on('message', (m: any) => {
      if (m?.type === 'transcript' && m.transcriptType === 'final') {
        const id = String(Date.now());
        if (m.role === 'user') setMessages(prev => [...prev, { id, content: m.transcript, isUser: true, timestamp: new Date() }]);
        if (m.role === 'assistant') setMessages(prev => [...prev, { id: id+'a', content: m.transcript, isUser: false, timestamp: new Date() }]);
      }
    });
    vapiRef.current = v;
    return () => { v.stop(); vapiRef.current = null; };
  }, []);

  const start = async () => {
    if (!vapiRef.current) return;
    try {
      if (VAPI_ASSISTANT_ID) await vapiRef.current.start(VAPI_ASSISTANT_ID);
      else await vapiRef.current.start({
        model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: 'You are a property advisor for a real estate company.' }] },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
        firstMessage: 'Hi! Looking to buy, rent, or sell?'
      });
    } catch {}
  };
  const stop = () => vapiRef.current?.stop();

  return (
    <div className="assistant-sidebar">
      <div className="assistant-globe">
        <InteractiveGlobe onVoiceStart={start} onVoiceEnd={stop} isListening={isListening} isProcessing={isProcessing} />
      </div>
      <div className="assistant-chat">
        <PremiumConversation messages={messages} isVisible={true} />
      </div>
    </div>
  );
}

