import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, AlertCircle, Brain, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessageToGemini, resetChat } from "@/services/geminiService";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const STARTER_PROMPTS = [
  "I've been feeling anxious lately",
  "I'm having trouble sleeping",
  "I feel overwhelmed with work and life",
  "I need coping strategies for stress",
  "How can I improve my mental wellbeing?",
  "I'm feeling sad most days",
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your CareLink AI assistant. I'm here to listen, provide support, and help you navigate your mental health journey. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: msg,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    inputRef.current?.focus();

    try {
      const response = await sendMessageToGemini(msg);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "bot",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    resetChat();
    setMessages([{
      id: Date.now().toString(),
      content: "Hello! I'm your CareLink AI assistant. I'm here to listen, provide support, and help you navigate your mental health journey. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const showPrompts = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">AI Assistant</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Powered by Llama</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online · Mental health support</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleReset} title="New conversation">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">About AI</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About the AI Assistant</DialogTitle>
                <DialogDescription>How this assistant works and its limitations</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {[
                  { icon: Brain, title: "Helpful Information", desc: "Can answer questions and help you explore your thoughts and feelings." },
                  { icon: Sparkles, title: "Supportive Suggestions", desc: "Offers general wellness tips and conversation to help you feel supported." },
                  { icon: AlertCircle, title: "Not a Replacement", desc: "This is an AI assistant, not a substitute for professional mental health care." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    If you're in crisis, please call emergency services or a crisis hotline immediately.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 min-h-0">
        <div className="space-y-4 w-full">
          <AnimatePresence initial={false}>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("flex gap-2.5", message.sender === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col max-w-[75%]", message.sender === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}>
                    {message.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(message.timestamp)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div key={i} className="h-2 w-2 bg-muted-foreground/50 rounded-full"
                    animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay }} />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Starter prompts — only show before first user message */}
      {showPrompts && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2 text-center">Quick starters</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button key={i} onClick={() => handleSend(prompt)}
                className="text-xs text-left px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t bg-card">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI responses are for support only · Not a substitute for professional care
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
