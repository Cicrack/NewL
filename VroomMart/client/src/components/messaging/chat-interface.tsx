import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, Phone, Video, MoreVertical, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface ChatInterfaceProps {
  user: any;
  messages: any[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isSending?: boolean;
}

export default function ChatInterface({ 
  user, 
  messages, 
  onSendMessage, 
  isLoading = false, 
  isSending = false 
}: ChatInterfaceProps) {
  const { user: currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() && !isSending) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [date: string]: any[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-cream bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user.profileImageUrl} 
              alt={user.firstName}
              data-testid="img-chat-user-avatar"
            />
            <AvatarFallback>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-charcoal" data-testid="text-chat-user-name">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-medium-gray" data-testid="text-chat-user-status">
              {user.username ? `@${user.username}` : "Active"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-medium-gray hover:text-charcoal"
            data-testid="button-voice-call"
          >
            <Phone size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-medium-gray hover:text-charcoal"
            data-testid="button-video-call"
          >
            <Video size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-medium-gray hover:text-charcoal"
            data-testid="button-chat-info"
          >
            <Info size={18} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-warm-white">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-2 animate-pulse" data-testid={`skeleton-message-${i}`}>
                <div className="w-8 h-8 bg-cream rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-cream rounded w-1/4"></div>
                  <div className="h-16 bg-cream rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" data-testid="text-no-messages">
            <Avatar className="w-16 h-16 mb-4">
              <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
              <AvatarFallback className="text-xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Start a conversation with {user.firstName}
            </h3>
            <p className="text-medium-gray text-center max-w-md">
              Send a message to start chatting about products, orders, or just say hello!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-cream px-3 py-1 rounded-full">
                    <span className="text-xs text-medium-gray font-medium" data-testid={`text-date-${date}`}>
                      {formatDate(date)}
                    </span>
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-4">
                  {dayMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser?.id;
                    const messageTime = new Date(message.createdAt);

                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isOwnMessage && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                              <AvatarFallback className="text-sm">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                            <div 
                              className={`px-4 py-2 rounded-2xl ${
                                isOwnMessage 
                                  ? 'gradient-bg text-white' 
                                  : 'bg-white border border-cream text-charcoal'
                              }`}
                            >
                              <p className="text-sm" data-testid={`text-message-content-${message.id}`}>
                                {message.content}
                              </p>
                            </div>
                            <span 
                              className="text-xs text-medium-gray mt-1 px-1"
                              data-testid={`text-message-time-${message.id}`}
                            >
                              {messageTime.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-cream bg-white p-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={`Message ${user.firstName}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="pr-12 border-cream focus:border-terracotta rounded-full"
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 gradient-bg text-white hover:opacity-90 rounded-full w-8 h-8 p-0"
              data-testid="button-send-message"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-medium-gray mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
