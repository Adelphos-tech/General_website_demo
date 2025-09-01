import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string | undefined;

if (!VAPI_PUBLIC_KEY) {
  throw new Error('VITE_VAPI_PUBLIC_KEY is required. Please set it in your .env.local file.');
}

interface Message {
  time: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
}

function App() {
  const [vapi] = useState(() => new Vapi(
    VAPI_PUBLIC_KEY,
    undefined,
    { avoidEval: true, alwaysIncludeMicInPermissionPrompt: true },
  ));
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [customSayText, setCustomSayText] = useState('');
  const [interruptionsEnabled, setInterruptionsEnabled] = useState(true);
  const [interruptAssistantEnabled, setInterruptAssistantEnabled] = useState(true);
  const [endCallAfterSay, setEndCallAfterSay] = useState(false);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Set up Vapi event listeners
    vapi.on('call-start', () => {
      console.log('Call started');
      setConnected(true);
      addMessage('system', 'Call connected');
    });

    vapi.on('call-end', () => {
      console.log('Call ended');
      setConnected(false);
      setAssistantIsSpeaking(false);
      setVolumeLevel(0);
      addMessage('system', 'Call ended');
    });

    vapi.on('speech-start', () => {
      console.log('Assistant started speaking');
      setAssistantIsSpeaking(true);
    });

    vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setAssistantIsSpeaking(false);
    });

    vapi.on('volume-level', (volume) => {
      setVolumeLevel(volume);
    });

    vapi.on('message', (message) => {
      console.log('Received message:', message);
      
      // Handle different message types
      if (message.type === 'transcript') {
        if (message.transcriptType === 'final') {
          if (message.role === 'user') {
            addMessage('user', message.transcript);
          } else if (message.role === 'assistant') {
            addMessage('assistant', message.transcript);
          }
        }
      } else if (message.type === 'function-call') {
        addMessage('system', `Function called: ${message.functionCall.name}`);
      } else if (message.type === 'hang') {
        addMessage('system', 'Call ended by assistant');
      }
    });

    vapi.on('error', (error) => {
      // Normalize error for display
      const normalized = (() => {
        try {
          if (typeof error === 'string') return error;
          if (error?.message) return error.message;
          return JSON.stringify(error);
        } catch {
          return String(error);
        }
      })();
      console.error('Vapi error:', error);
      addMessage('system', `Error: ${normalized}`);
    });

    vapi.on('call-start-progress', (e: any) => {
      addMessage('system', `Start progress: ${e.stage} - ${e.status}`);
    });

    vapi.on('call-start-failed', (e: any) => {
      const details = (() => { try { return JSON.stringify(e); } catch { return String(e); } })();
      addMessage('system', `Start failed: ${details}`);
    });

    return () => {
      clearInterval(timer);
      vapi.stop();
    };
  }, [vapi]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string) => {
    setMessages(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      type,
      content
    }]);
  };

  const startCall = async () => {
    try {
      addMessage('system', 'Starting call...');
      // Preflight checks for secure context and media APIs
      const isSecure = (window as any).isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecure) {
        addMessage('system', 'Blocked: Browser requires a secure context for microphone. Open this app on https://localhost or over HTTPS.');
        return;
      }
      if (!(navigator.mediaDevices && (navigator.mediaDevices as any).enumerateDevices)) {
        addMessage('system', 'Blocked: navigator.mediaDevices is unavailable. Ensure HTTPS and allow microphone permissions.');
        return;
      }
      
      // Prefer starting with Assistant ID if provided via env
      if (VAPI_ASSISTANT_ID) {
        try {
          const res = await vapi.start(VAPI_ASSISTANT_ID);
          if (res) return;
          throw new Error('AssistantId start returned null');
        } catch (err) {
          const s = (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
          addMessage('system', `AssistantId start failed; falling back. ${s}`);
        }
      }

      // Otherwise start with inline assistant configuration
      await vapi.start({
        // Basic assistant configuration
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. Keep your responses concise and conversational. You're speaking to someone through voice, so avoid using formatting or special characters."
            }
          ]
        },
        
        // Voice configuration
        voice: {
          provider: "vapi",
          voiceId: "Elliot"
        },
        
        // Transcriber configuration
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US"
        },
        
        // Call settings
        firstMessage: "Hello! I'm your AI assistant. How can I help you today?",
        endCallMessage: "Thank you for the conversation. Goodbye!",
        endCallPhrases: ["goodbye", "bye", "end call", "hang up"],
        
        // Max call duration (in seconds) - 10 minutes
        maxDurationSeconds: 600
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      addMessage('system', `Failed to start call: ${error}`);
    }
  };

  const stopCall = () => {
    vapi.stop();
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    vapi.setMuted(newMutedState);
    setIsMuted(newMutedState);
    addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted');
  };

  const sendMessage = (content?: string) => {
    const text = (content ?? textInput).trim();
    if (!text) return;
    // Add to UI immediately
    addMessage('user', text);
    setTextInput('');
    // Send as a user message to assistant
    vapi.send({
      type: 'add-message',
      message: { role: 'user', content: text },
      triggerResponseEnabled: true,
    });
  };

  const handleManualSay = (text: string, endCallAfter: boolean = false) => {
    if (!connected || !text.trim()) return;
    
    try {
      // Use the full say() method signature with all 4 parameters
      vapi.say(text, endCallAfter, interruptionsEnabled, interruptAssistantEnabled);
      
      const statusParts = [
        `Manual say: "${text}"`,
        endCallAfter ? 'end call after' : null,
        `interrupt user: ${interruptionsEnabled ? 'enabled' : 'disabled'}`,
        `interrupt assistant: ${interruptAssistantEnabled ? 'enabled' : 'disabled'}`
      ].filter(Boolean);
      
      addMessage('system', statusParts.join(' | '));
    } catch (error) {
      console.error('Error with manual say:', error);
      addMessage('system', `Error with manual say: ${error}`);
    }
  };

  const handleCustomSay = () => {
    if (customSayText.trim()) {
      handleManualSay(customSayText, endCallAfterSay);
      setCustomSayText('');
    }
  };

  const handlePresetSay = (text: string) => {
    handleManualSay(text, endCallAfterSay);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="title">Vapi Voice Assistant</div>
        <div className="status">
          <span className={`chip ${connected ? 'ok' : 'bad'}`}>{connected ? 'Connected' : 'Disconnected'}</span>
          <span className="chip">{assistantIsSpeaking ? 'Assistant: Speaking' : 'Assistant: Listening'}</span>
          <span className="chip">Mic: {isMuted ? 'Muted' : 'Active'}</span>
          <span className="chip">{currentTime}</span>
        </div>
      </div>
      
      <div className="panel">
        <div className="row" style={{marginBottom: 10}}>
          <div style={{flex: 1}}>
            <div className="meter"><span style={{width: `${Math.round(volumeLevel * 100)}%`}} /></div>
            <div className="hint">Volume level</div>
          </div>
        </div>
        {/* Central call orb */}
        <div className="orb-wrap">
          <div
            className={`orb ${connected ? 'connected' : 'idle'} ${assistantIsSpeaking ? 'speaking' : ''}`}
            onClick={connected ? stopCall : startCall}
            title={connected ? 'Stop Call' : 'Start Call'}
            style={{ transform: `scale(${1 + Math.min(0.12, volumeLevel * 0.12)})` }}
          >
            <img src="/03.svg" alt="Call" />
          </div>
          <div className="hint">{connected ? (assistantIsSpeaking ? 'Assistant is speaking… tap to stop' : 'Connected — tap to stop') : 'Tap to start call'}</div>
        </div>
        <div className="controls">
          <button className="btn accent" onClick={toggleMute} disabled={!connected}>{isMuted ? 'Unmute' : 'Mute'}</button>
          <button className="btn" onClick={() => sendMessage('The user has indicated they want to change topics.')} disabled={!connected}>Send Context</button>
        </div>
      </div>

      {/* Old control button row removed in favor of the orb */}

      {/* Manual Say Controls removed */}

      {/* Chat Panel */}
      <div className="chat-wrap">
        <div className="chat">
          {messages.length === 0 ? (
            <div className="hint" style={{ textAlign: 'center', padding: '12px' }}>
              No messages yet. Start a call to begin the conversation.
            </div>
          ) : (
            messages.map((m, i) => (
              m.type === 'system' ? (
                <div key={i} className="bubble system">{m.content}</div>
              ) : (
                <div key={i} className="bubble-row">
                  {m.type === 'assistant' && <div className="chat-avatar assistant">AI</div>}
                  <div className={`bubble ${m.type}`}>{m.content}</div>
                  {m.type === 'user' && <div className="chat-avatar user">YOU</div>}
                </div>
              )
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="input-bar">
          <input
            placeholder={connected ? 'Type a message…' : 'Connect to start chatting…'}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            disabled={!connected}
          />
          <button onClick={() => sendMessage()} disabled={!connected || !textInput.trim()}>Send</button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="panel" style={{background: '#1a1430'}}>
        <h4 style={{ marginTop: 0 }}>How to use:</h4>
        <ul style={{ marginBottom: 0 }}>
          <li>Click "Start Call" to begin a voice conversation</li>
          <li>Speak naturally - the AI will respond with voice</li>
          <li>Use "Mute" to temporarily disable your microphone</li>
          <li>Say "goodbye" or "end call" to end the conversation</li>
          <li>Click "Stop Call" to manually end the call</li>
        </ul>
      </div>
    </div>
  );
}

export default App; 
