import { useState, useRef, useEffect } from "react";
import {
  Send,
  SmilePlus,
  PaperclipIcon,
  MicIcon,
  Brain,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const ChatInterface = () => {
  const { t } = useTranslation(["chat", "common"]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: t(
        "chat:botWelcomeMessage",
        "Hello! I'm your CareLink AI assistant. I'm here to listen, provide support, and help you navigate your mental health journey. How are you feeling today?",
      ),
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const botResponses = [
        t(
          "chat:response1",
          "I understand how you're feeling. Many people experience similar emotions. Would you like to tell me more about what's been going on?",
        ),
        t(
          "chat:response2",
          "Thank you for sharing that with me. It takes courage to open up. Based on what you've described, it sounds like you might be experiencing some anxiety. Have you noticed any physical symptoms like tension or racing heart?",
        ),
        t(
          "chat:response3",
          "I'm here to listen. What you're going through sounds challenging. Have you tried any relaxation techniques that might help in moments like this? Mindful breathing can be effective for many people.",
        ),
        t(
          "chat:response4",
          "It's important to acknowledge those feelings. They're valid and part of your experience. Would you like me to suggest some evidence-based strategies that might help?",
        ),
        t(
          "chat:response5",
          "I appreciate you opening up. When did you first start noticing these feelings? Understanding the triggers can often be helpful in managing them.",
        ),
      ];

      let responseIndex = Math.floor(Math.random() * botResponses.length);

      const lowercaseInput = input.toLowerCase();
      if (
        lowercaseInput.includes("anxious") ||
        lowercaseInput.includes("nervous") ||
        lowercaseInput.includes("worry")
      ) {
        responseIndex = 1;
      } else if (
        lowercaseInput.includes("breathe") ||
        lowercaseInput.includes("relax") ||
        lowercaseInput.includes("calm")
      ) {
        responseIndex = 2;
      } else if (
        lowercaseInput.includes("help") ||
        lowercaseInput.includes("suggest") ||
        lowercaseInput.includes("advice")
      ) {
        responseIndex = 3;
      } else if (
        lowercaseInput.includes("when") ||
        lowercaseInput.includes("start") ||
        lowercaseInput.includes("began")
      ) {
        responseIndex = 4;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponses[responseIndex],
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const aiDescriptions = [
    {
      title: t("chat:aiFeature1Title", "Advanced Emotional Recognition"),
      description: t(
        "chat:aiFeature1Description",
        "Our AI is trained to identify emotional patterns and provide appropriate support.",
      ),
      icon: Brain,
    },
    {
      title: t("chat:aiFeature2Title", "Evidence-Based Techniques"),
      description: t(
        "chat:aiFeature2Description",
        "Recommendations based on cognitive behavioral therapy and mindfulness practices.",
      ),
      icon: Sparkles,
    },
    {
      title: t("chat:aiFeature3Title", "Not a Replacement for Professionals"),
      description: t(
        "chat:aiFeature3Description",
        "While helpful, our AI doesn't replace professional mental health care.",
      ),
      icon: AlertCircle,
    },
  ];

  const starterPrompts = [
    t("chat:prompt1", "I've been feeling anxious lately"),
    t("chat:prompt2", "I'm having trouble sleeping"),
    t("chat:prompt3", "I feel overwhelmed with work and life"),
    t("chat:prompt4", "I need some coping strategies for stress"),
    t("chat:prompt5", "How can I improve my mental wellbeing?"),
    t("chat:prompt6", "I'm feeling sad most days"),
  ];

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src="/placeholder.svg" alt={t("chat:aiAssistant")} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                AI
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{t("chat:aiAssistant")}</h3>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {t("chat:advanced")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("chat:aiAssistantDescription")}
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {t("chat:learnAboutAI")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("chat:aboutAI")}</DialogTitle>
                <DialogDescription>
                  {t("chat:aboutAIDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {aiDescriptions.map((item, i) => (
                  <div key={i} className="flex space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="p-3 border border-amber-200 bg-amber-50 rounded-md mt-6 dark:bg-amber-900/20 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    {t("chat:emergencyMessage")}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex max-w-[80%] mb-4",
                message.sender === "user" ? "ml-auto" : "mr-auto",
              )}
            >
              {message.sender === "bot" && (
                <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={t("chat:aiAssistant")}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}

              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none",
                  )}
                >
                  {message.content}
                </div>
                <span
                  className={cn(
                    "text-xs text-muted-foreground mt-1",
                    message.sender === "user" ? "text-right" : "text-left",
                  )}
                >
                  {formatTime(message.timestamp)}
                </span>
              </motion.div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" alt={t("common:user")} />
                  <AvatarFallback className="bg-healing-500 text-white">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex max-w-[80%] mr-auto">
              <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                <AvatarImage
                  src="/placeholder.svg"
                  alt={t("chat:aiAssistant")}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center bg-muted rounded-2xl rounded-tl-none px-4 py-2">
                <div className="flex items-center">
                  <motion.div
                    className="h-2 w-2 bg-muted-foreground/60 rounded-full mx-0.5"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                  />
                  <motion.div
                    className="h-2 w-2 bg-muted-foreground/60 rounded-full mx-0.5"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  />
                  <motion.div
                    className="h-2 w-2 bg-muted-foreground/60 rounded-full mx-0.5"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background">
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {starterPrompts.map((prompt, index) => (
            <button
              key={index}
              className="p-2 text-xs text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors text-left"
              onClick={() => {
                setInput(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="p-4 flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <SmilePlus size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chat:expressFeeling")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <PaperclipIcon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chat:attachFile")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input
            placeholder={t("chat:typeMessage")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <MicIcon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chat:voiceMessage")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleSendMessage}
            size="icon"
            className="flex-shrink-0 rounded-full"
            disabled={input.trim() === ""}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
