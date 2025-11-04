import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';

interface TravelChatbotProps {
  sidebarWidth?: number;
  isPlacePopupOpen?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TravelChatbot: React.FC<TravelChatbotProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Namaste! 👋 I\'m your India travel assistant. Ask me about places, routes, travel tips, or anything related to traveling in India!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call OpenAI API or travel API
      const response = await fetchTravelAdvice(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or ask a different question.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fetch travel advice using OpenAI ChatGPT API
  const fetchTravelAdvice = async (query: string): Promise<string> => {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful and friendly travel assistant specializing in India travel. Provide detailed, accurate, and engaging information about places, routes, travel tips, cuisine, transportation, budget, safety, and cultural insights. Keep responses concise but informative, and use emojis when appropriate. Be enthusiastic and encouraging about traveling in India.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      // Fallback to helpful error message
      return `I apologize, but I'm having trouble connecting to the AI service right now. ${error.message ? `Error: ${error.message}` : 'Please try again in a moment.'}

In the meantime, I can help you with:
• Travel planning for India
• Route suggestions
• Best times to visit different regions
• Local cuisine and food recommendations
• Transportation options
• Budget planning tips

Feel free to ask again! 🇮🇳✨`;
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[9998] flex items-center justify-center bg-black"
          style={{
            width: '48px',
            height: '48px',
            padding: 0,
            borderRadius: '50%',
          }}
          title="Travel Chatbot"
        >
          <img
            src="/Assets/chatgpt-logo.png"
            alt="ChatGPT"
            className="w-9 h-9 object-contain"
          />
        </motion.button>
      )}

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-[9999] border border-gray-200 dark:border-gray-700"
            style={{
              width: '380px',
              height: '520px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="bg-black rounded-full p-1.5 flex items-center justify-center">
                  <img
                    src="/Assets/chatgpt-logo.png"
                    alt="ChatGPT"
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <h3 className="text-white font-semibold">Travel Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/30 p-2 rounded-full transition-colors flex items-center justify-center"
                title="Close chatbot"
                aria-label="Close chatbot"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2">
                    <Loader2 size={16} className="animate-spin text-purple-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about travel, places, routes..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors flex items-center justify-center"
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TravelChatbot;

