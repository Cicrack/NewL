import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/messaging/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Search, Send } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: currentConversation = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation],
    enabled: !!selectedConversation && !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
      await apiRequest("POST", "/api/messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/conversations/${userId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const filteredConversations = conversations.filter((conv: any) =>
    conv.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (userId: string) => {
    setSelectedConversation(userId);
    markAsReadMutation.mutate(userId);
  };

  const handleSendMessage = (content: string) => {
    if (selectedConversation && content.trim()) {
      sendMessageMutation.mutate({
        receiverId: selectedConversation,
        content: content.trim(),
      });
    }
  };

  const selectedUser = conversations.find((conv: any) => conv.user.id === selectedConversation)?.user;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 gradient-bg rounded-xl animate-pulse mx-auto mb-4"></div>
          <p className="text-medium-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-warm-white">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="h-screen flex">
          {/* Conversations List */}
          <div className="w-80 border-r border-cream bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-cream">
              <h1 className="text-xl font-bold text-charcoal mb-4" data-testid="text-page-title">Messages</h1>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-medium-gray" size={16} />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-cream border-none"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {conversationsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 animate-pulse" data-testid={`skeleton-conversation-${i}`}>
                      <div className="w-12 h-12 bg-cream rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-cream rounded w-1/2"></div>
                        <div className="h-3 bg-cream rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="space-y-1">
                  {filteredConversations.map((conversation: any) => (
                    <div
                      key={conversation.user.id}
                      onClick={() => handleSelectConversation(conversation.user.id)}
                      className={`flex items-center space-x-3 p-4 hover:bg-cream cursor-pointer transition-colors ${
                        selectedConversation === conversation.user.id ? 'bg-cream' : ''
                      }`}
                      data-testid={`conversation-item-${conversation.user.id}`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={conversation.user.profileImageUrl} 
                          alt={conversation.user.firstName}
                          data-testid={`img-conversation-avatar-${conversation.user.id}`}
                        />
                        <AvatarFallback>
                          {conversation.user.firstName?.[0]}{conversation.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-charcoal truncate" data-testid={`text-conversation-name-${conversation.user.id}`}>
                            {conversation.user.firstName} {conversation.user.lastName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge 
                              className="bg-coral text-white text-xs" 
                              data-testid={`badge-unread-${conversation.user.id}`}
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-medium-gray truncate mt-1" data-testid={`text-last-message-${conversation.user.id}`}>
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8" data-testid="text-no-conversations">
                  <MessageCircle className="text-medium-gray mb-4" size={64} />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No conversations yet</h3>
                  <p className="text-medium-gray text-center">
                    Start messaging by commenting on products or following other users
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation && selectedUser ? (
              <ChatInterface
                user={selectedUser}
                messages={currentConversation}
                onSendMessage={handleSendMessage}
                isLoading={messagesLoading}
                isSending={sendMessageMutation.isPending}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white" data-testid="text-select-conversation">
                <div className="text-center">
                  <MessageCircle className="mx-auto text-medium-gray mb-4" size={64} />
                  <h2 className="text-xl font-semibold text-charcoal mb-2">Select a conversation</h2>
                  <p className="text-medium-gray">Choose a conversation from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
