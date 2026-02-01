import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronDown, Maximize2, Send, Loader2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import chatService, { ChatMessage, ChatSessionWithSummary } from '@/services/chatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DEFAULT_AGENT_ID = 1;

export const ChatbotWidget: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSession, setActiveSession] = useState<ChatSessionWithSummary | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Initial load of session when widget opens
    useEffect(() => {
        if (isOpen && !activeSession) {
            initializeChat();
        }
    }, [isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isSending]);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            // Get recent sessions
            const sessions = await chatService.getSessions(DEFAULT_AGENT_ID);

            if (sessions.length > 0) {
                // Use the most recent session
                const recentSession = sessions[0];
                setActiveSession(recentSession);

                // Load messages for this session
                const history = await chatService.getSessionHistory(recentSession.id);
                setMessages(history);
            } else {
                // Create new session if none exist
                const newSession = await chatService.createSession(DEFAULT_AGENT_ID);
                setActiveSession(newSession);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to initialize chat widget:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !activeSession || isSending) return;

        const userMessageContent = question.trim();
        setQuestion('');
        setIsSending(true);

        // Optimistically add user message
        const tempUserMessage: ChatMessage = {
            id: Date.now(),
            session_id: activeSession.id,
            role: 'user',
            content: userMessageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            // Build history context
            const messageHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Send to API
            const response = await chatService.sendMessage(DEFAULT_AGENT_ID, {
                messages: [
                    ...messageHistory,
                    { role: 'user', content: userMessageContent }
                ],
                sessionId: activeSession.id.toString(),
                sourceSelection: 'auto',
                searchStrategy: 'simple_hybrid',
                enableReranking: true
            });

            // Add AI response
            const aiMessage: ChatMessage = {
                id: Date.now() + 1,
                session_id: activeSession.id,
                role: 'assistant',
                content: response.response,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove the temporary message on failure
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            setQuestion(userMessageContent); // Restore input
        } finally {
            setIsSending(false);
        }
    };

    const handleFullScreen = () => {
        if (!user) return;
        navigate(`/${user.role}/ask`);
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
            ref={widgetRef}
        >
            {/* Chat Window */}
            <div
                className={cn(
                    "w-[380px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right mb-4 pointer-events-auto flex flex-col",
                    isOpen
                        ? "opacity-100 scale-100 h-[600px] translate-y-0"
                        : "opacity-0 scale-95 h-0 translate-y-12 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/20">
                            <Brain className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Chat with cBrain</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleFullScreen}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            title="Open full screen"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Connecting to cBrain...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                <Brain className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">How can I help?</h3>
                            <p className="text-xs text-muted-foreground">
                                Ask me about company policies, documents, or workflows.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full mb-4",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-card border border-border text-foreground rounded-bl-none"
                                        )}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className="flex justify-start w-full">
                                    <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-card border-t border-border">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question..."
                            disabled={isSending || isLoading}
                            className="flex-1 bg-white border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!question.trim() || isSending || isLoading}
                            className={cn(
                                "p-2.5 rounded-xl transition-all shadow-sm",
                                question.trim() && !isSending
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleOpen}
                className={cn(
                    "pointer-events-auto flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 z-50",
                    isOpen
                        ? "bg-[#547792] text-white hover:bg-[#547792]/90 rotate-0"
                        : "bg-gradient-to-br from-[#213448] to-[#547792] text-white rotate-0"
                )}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {isOpen ? (
                    <ChevronDown className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};
