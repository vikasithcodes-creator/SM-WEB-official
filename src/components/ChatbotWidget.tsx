import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  User,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Menu,
  ShoppingBag,
  Sparkles,
  Package,
  MessageCircle,
} from 'lucide-react';
import { FAQ_CATEGORIES, FAQ_ANSWERS, WELCOME_MESSAGE } from '../data/faqData';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isAnswer?: boolean;
}

interface ChatbotWidgetProps {
  onOpenTrackOrder?: () => void;
  onOpenCustomQuote?: () => void;
  onOpenCart?: () => void;
  onNavigateCatalog?: () => void;
}

type ChatView = 'menu' | 'conversation';

const WHATSAPP_NUMBER = '9014506060';
const WHATSAPP_URL = `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi SM Studios, I would like to inquire about your 3D printing products and services.'
)}`;

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  onOpenTrackOrder,
  onOpenCustomQuote,
  onOpenCart,
  onNavigateCatalog,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatView, setChatView] = useState<ChatView>('menu');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, chatView]);

  // When customer clicks a question:
  // 1. Immediately switch view to 'conversation' (hiding menu completely)
  // 2. Display selected question as customer message
  // 3. Display corresponding answer as assistant message
  // 4. Render follow-up action buttons
  const handleSelectQuestion = (question: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: time,
    };

    const answerText =
      FAQ_ANSWERS[question] ||
      'For more details regarding this specific inquiry, our workshop desk is available to assist you directly on WhatsApp (+91 9014506060).';

    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      sender: 'bot',
      text: answerText,
      timestamp: time,
      isAnswer: true,
    };

    setMessages([userMsg, botMsg]);
    setChatView('conversation');
  };

  // "Ask Another Question":
  // Hide current conversation and bring back question-selection menu
  const handleAskAnotherQuestion = () => {
    setChatView('menu');
    setActiveCategoryFilter(null);
  };

  // "Main Menu":
  // Return to initial chatbot welcome screen & question-selection menu
  const handleMainMenu = () => {
    setChatView('menu');
    setActiveCategoryFilter(null);
  };

  const handleActionExploreProducts = () => {
    setIsOpen(false);
    if (onNavigateCatalog) {
      onNavigateCatalog();
    } else {
      const el = document.getElementById('storefront-catalog') || document.getElementById('store-catalog');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleActionCustomQuote = () => {
    setIsOpen(false);
    if (onOpenCustomQuote) {
      onOpenCustomQuote();
    } else {
      const el = document.getElementById('custom-service');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleActionTrackOrder = () => {
    setIsOpen(false);
    onOpenTrackOrder?.();
  };

  const handleActionWhatsApp = () => {
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  const visibleCategories = activeCategoryFilter
    ? FAQ_CATEGORIES.filter((c) => c.title === activeCategoryFilter)
    : FAQ_CATEGORIES;

  return (
    <div className="fixed bottom-5 right-5 z-60 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="sm-chatbot-launcher-btn"
          type="button"
          onClick={() => {
            setIsOpen(true);
            setChatView('menu');
          }}
          aria-label="Open SM Studios Assistant"
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-black text-white rounded-full shadow-2xl hover:bg-[#1A1A1A] active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <div className="relative">
            <Bot size={18} className="text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            SM Assistant
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
            FAQ
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="sm-chatbot-window"
          className="relative w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#FAFAFA] text-gray-950 border border-[#E5E5E5] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header: Strict Black & White */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-black text-white border-b border-black shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white leading-none">
                    SM Studios Assistant
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                    FAQ
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Instant Support & Knowledge Base
                </p>
              </div>
            </div>
            <button
              id="close-chatbot-btn"
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>

          {/* VIEW 1: MENU (Initial Screen & Welcome Message + Categories) */}
          {chatView === 'menu' && (
            <div
              className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4"
              style={{ scrollbarColor: '#999999 #F2F2F2' }}
            >
              {/* Welcome Message Bubble */}
              <div className="flex items-start gap-2 flex-row">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs bg-white text-black border border-[#E5E5E5]">
                  <Bot size={12} />
                </div>
                <div className="max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs bg-white text-[#111111] border border-[#E5E5E5]">
                  <p className="whitespace-pre-line">{WELCOME_MESSAGE}</p>
                  <span className="block text-[9px] mt-1.5 text-[#888888] text-left">
                    SM Studios Assistant
                  </span>
                </div>
              </div>

              {/* Clickable Question Categories / Selector */}
              <div id="faq-question-browser" className="pt-1 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <HelpCircle size={13} className="text-black" />
                    <span>
                      {activeCategoryFilter ? `Category: ${activeCategoryFilter}` : 'Select a Question'}
                    </span>
                  </div>
                  {activeCategoryFilter && (
                    <button
                      type="button"
                      onClick={() => setActiveCategoryFilter(null)}
                      className="text-[10px] text-gray-500 hover:text-black font-semibold underline cursor-pointer"
                    >
                      View All Categories
                    </button>
                  )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter(null)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                      activeCategoryFilter === null
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-gray-600 border-[#E5E5E5] hover:text-black hover:border-black'
                    }`}
                  >
                    All
                  </button>
                  {FAQ_CATEGORIES.map((c) => (
                    <button
                      key={c.title}
                      type="button"
                      onClick={() => setActiveCategoryFilter(c.title)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                        activeCategoryFilter === c.title
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-gray-600 border-[#E5E5E5] hover:text-black hover:border-black'
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>

                {/* Categorized Question Lists */}
                {visibleCategories.map((category) => (
                  <div
                    key={category.title}
                    className="bg-white border border-[#E5E5E5] rounded-2xl p-3 shadow-xs space-y-2"
                  >
                    <div className="text-[10px] font-mono font-bold tracking-widest text-[#555555] uppercase px-1">
                      {category.title}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {category.questions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => handleSelectQuestion(question)}
                          className="group flex items-center justify-between text-left text-xs font-medium text-[#111111] bg-[#FAFAFA] hover:bg-black hover:text-white border border-[#EBEBEB] hover:border-black rounded-xl px-3 py-2 transition-all cursor-pointer active:scale-[0.99]"
                        >
                          <span className="pr-2">{question}</span>
                          <ChevronRight
                            size={13}
                            className="text-gray-400 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* VIEW 2: CONVERSATION (Question + Answer + Action Buttons ONLY - Menu is completely hidden) */}
          {chatView === 'conversation' && (
            <div
              className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4"
              style={{ scrollbarColor: '#999999 #F2F2F2' }}
            >
              {/* Messages Thread: Customer Question & Assistant Answer */}
              {messages.map((m) => {
                const isUser = m.sender === 'user';

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        isUser
                          ? 'bg-black text-white'
                          : 'bg-white text-black border border-[#E5E5E5]'
                      }`}
                    >
                      {isUser ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div
                      className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-black text-white font-normal'
                          : 'bg-white text-[#111111] border border-[#E5E5E5]'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <span
                        className={`block text-[9px] mt-1.5 ${
                          isUser ? 'text-white/60 text-right' : 'text-[#888888] text-left'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Action Buttons Box (Directly below answer) */}
              <div className="ml-8 mr-1 p-3 bg-white border border-[#E5E5E5] rounded-2xl shadow-xs space-y-2.5 animate-in fade-in duration-150">
                <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-1">
                  Where would you like to go next?
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={handleAskAnotherQuestion}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-black bg-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer border border-[#E5E5E5] text-left"
                  >
                    <RotateCcw size={12} className="shrink-0" />
                    <span className="truncate">Ask Another Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMainMenu}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-black bg-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer border border-[#E5E5E5] text-left"
                  >
                    <Menu size={12} className="shrink-0" />
                    <span className="truncate">Main Menu</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleActionExploreProducts}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-black bg-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer border border-[#E5E5E5] text-left"
                  >
                    <ShoppingBag size={12} className="shrink-0" />
                    <span className="truncate">Explore Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleActionCustomQuote}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-black bg-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer border border-[#E5E5E5] text-left"
                  >
                    <Sparkles size={12} className="shrink-0 text-amber-500" />
                    <span className="truncate">Custom 3D Printing</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleActionTrackOrder}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-black bg-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer border border-[#E5E5E5] text-left"
                  >
                    <Package size={12} className="shrink-0" />
                    <span className="truncate">Track My Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleActionWhatsApp}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold text-white bg-black hover:bg-[#1A1A1A] transition-all cursor-pointer border border-black text-left shadow-2xs"
                  >
                    <MessageCircle size={12} className="shrink-0 text-emerald-400" />
                    <span className="truncate">Contact on WhatsApp</span>
                  </button>
                </div>
              </div>

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Actions Footer Strip */}
          <div className="px-3.5 py-2.5 bg-white border-t border-[#E5E5E5] flex items-center justify-between text-[11px] shrink-0">
            <button
              type="button"
              onClick={handleActionTrackOrder}
              className="text-gray-600 hover:text-black font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Package size={12} />
              <span>Track Order</span>
            </button>
            <div className="h-3 w-[1px] bg-gray-200" />
            <button
              type="button"
              onClick={handleActionCustomQuote}
              className="text-gray-600 hover:text-black font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles size={12} className="text-amber-500" />
              <span>Upload STL</span>
            </button>
            <div className="h-3 w-[1px] bg-gray-200" />
            <button
              type="button"
              onClick={handleActionWhatsApp}
              className="text-black hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Chat on WhatsApp: 9014506060"
            >
              <MessageCircle size={12} className="text-emerald-500" />
              <span>WhatsApp: 9014506060</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
