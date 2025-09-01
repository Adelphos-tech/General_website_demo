import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface PremiumConversationProps {
  messages: ChatMessage[];
  isVisible: boolean;
}

export function PremiumConversation({ messages, isVisible }: PremiumConversationProps) {
  if (!isVisible || messages.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-[1400px] mx-auto mt-6"
    >
      <div className="backdrop-blur-md bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white/90 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Conversation History
          </h2>
        </div>
        
        <ScrollArea className="h-[70vh]">
          <div className="p-6 space-y-6">
            <AnimatePresence>
              {messages.slice(1).map((message, index) => (
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
    </motion.div>
  );
}
