import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MessageSquare, Send, Users, Hash, Database, 
  Sparkles, CheckCheck, Smile, FolderGit2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import type { ChatMessage, ConversationChannel } from '../../types/index.js';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedChannel = searchParams.get('channel') || '';

  const [channels, setChannels] = useState<ConversationChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<ConversationChannel[]>('/chat/channels');
        setChannels(data);

        const initialChannel = requestedChannel && data.some((c) => c.id === requestedChannel)
          ? requestedChannel
          : data.length > 0 ? data[0].id : '';

        if (initialChannel) {
          setActiveChannelId(initialChannel);
          loadMessages(initialChannel);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [requestedChannel]);

  const loadMessages = async (channelId: string) => {
    try {
      const msgs = await apiClient.get<ChatMessage[]>(`/chat/channels/${channelId}/messages`);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  // Setup Server-Sent Events (SSE) for Real-Time Messages
  useEffect(() => {
    const eventSource = new EventSource(`${(import.meta.env.VITE_API_URL as string) || '/api'}/chat/stream`);

    eventSource.addEventListener('chat_message', (e) => {
      try {
        const newMsg: ChatMessage = JSON.parse(e.data);
        if (newMsg.conversationId === activeChannelId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error('Lỗi phân tích SSE message:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [activeChannelId]);

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    loadMessages(channelId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannelId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sent = await apiClient.post<ChatMessage>(`/chat/channels/${activeChannelId}/messages`, {
        content: textToSend,
        messageType: 'Text',
      });

      setMessages((prev) => [...prev, sent]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  if (loading) return <LoadingSpinner text="Đang mở phòng chat thời gian thực..." />;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-full sm:w-72 bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Kênh trò chuyện ({channels.length})
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Phòng trao đổi công việc & chuẩn hóa dữ liệu
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map((chan) => {
            const isSelected = chan.id === activeChannelId;
            return (
              <button
                key={chan.id}
                onClick={() => handleSelectChannel(chan.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {chan.type === 'Public' ? (
                  <Hash className="w-4 h-4 shrink-0" />
                ) : (
                  <FolderGit2 className="w-4 h-4 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{chan.title}</p>
                  <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {chan.lastMessage || 'Chưa có tin nhắn'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeChannel?.title || 'Phòng chat'}
              </h3>
              <span className="text-[10px] text-slate-400">
                Thời gian thực (Real-time SignalR/SSE Enabled)
              </span>
            </div>
          </div>

          {activeChannel?.projectId && (
            <Link to={`/projects/${activeChannel.projectId}`}>
              <Button variant="outline" size="sm">
                Vào Repository
              </Button>
            </Link>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chưa có tin nhắn nào trong kênh này. Hãy là người đầu tiên gửi tin nhắn!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <img
                    src={msg.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.senderName)}`}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200 dark:border-slate-800"
                  />

                  <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isMe ? 'Bạn' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                          : msg.messageType === 'DatasetRef'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {msg.metadata?.datasetId && (
                        <div className="mt-2 pt-2 border-t border-indigo-400/30 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold">
                            Dataset: {msg.metadata.datasetName} ({msg.metadata.versionTag})
                          </span>
                          <Link
                            to={`/normalization?datasetId=${msg.metadata.datasetId}`}
                            className="underline text-[10px] font-semibold"
                          >
                            Xem &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            placeholder="Nhập tin nhắn... (Nhấn Enter để gửi)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim() || sending}
            isLoading={sending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Gửi
          </Button>
        </form>
      </div>
    </div>
  );
};
