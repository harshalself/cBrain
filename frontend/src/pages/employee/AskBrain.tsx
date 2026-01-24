import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getCurrentUser } from '@/lib/mockData';
import { formatRelativeTime } from '@/lib/utils';
import { Send, Brain, Clock, Sparkles, Loader2, AlertCircle, FileText, Copy, Check } from 'lucide-react';
import chatService, { ChatMessage, ChatSessionWithSummary, SendMessageResponse } from '@/services/chatService';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceDocuments } from '@/components/chat/SourceDocuments';
import MessageRating from '@/components/chat/MessageRating';

const AskBrain: React.FC = () => {
    const user = getCurrentUser();
    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentNotConfigured, setAgentNotConfigured] = useState(false);

    // Chat state
    const [sessions, setSessions] = useState<ChatSessionWithSummary[]>([]);
    const [activeSession, setActiveSession] = useState<ChatSessionWithSummary | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageMetadata, setMessageMetadata] = useState<Map<number, SendMessageResponse>>(new Map());
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

    // Note: Using agentId = 1 as default - this should be configurable
    const DEFAULT_AGENT_ID = 1;

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, []);

    // Load messages when active session changes
    useEffect(() => {
        if (activeSession) {
            loadMessages(activeSession.id);
        }
    }, [activeSession]);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await chatService.getSessions(DEFAULT_AGENT_ID);
            setSessions(data);

            // Auto-select most recent session or create new one
            if (data.length > 0) {
                setActiveSession(data[0]);
            } else {
                await createNewSession();
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load conversations';
            // Check if error is due to agent not existing
            if (errorMsg.includes('Agent not found') || err.response?.status === 404) {
                setAgentNotConfigured(true);
            } else {
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (sessionId: number) => {
        try {
            const history = await chatService.getSessionHistory(sessionId);
            setMessages(history);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load messages';
            toast.error(errorMsg);
        }
    };

    const createNewSession = async () => {
        try {
            setIsCreatingSession(true);
            const newSession = await chatService.createSession(DEFAULT_AGENT_ID);
            setSessions(prev => [newSession, ...prev]);
            setActiveSession(newSession);
            setMessages([]);
            toast.success('New conversation started');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to create conversation';
            toast.error(errorMsg);
        } finally {
            setIsCreatingSession(false);
        }
    };

    const handleDeleteSession = async (sessionId: number) => {
        try {
            await chatService.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));

            // If deleted session was active, switch to another or create new
            if (activeSession?.id === sessionId) {
                const remaining = sessions.filter(s => s.id !== sessionId);
                if (remaining.length > 0) {
                    setActiveSession(remaining[0]);
                } else {
                    await createNewSession();
                }
            }

            toast.success('Conversation deleted');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to delete conversation';
            toast.error(errorMsg);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !activeSession) return;

        const userMessageContent = question.trim();
        setQuestion('');
        setIsSending(true);

        // Optimistically add user message to UI
        const tempUserMessage: ChatMessage = {
            id: Date.now(), // temporary ID
            session_id: activeSession.id,
            role: 'user',
            content: userMessageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            // Build message history for context
            const messageHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Send message to AI
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

            // Add AI response to messages
            const aiMessage: ChatMessage = {
                id: Date.now() + 1, // temporary ID
                session_id: activeSession.id,
                role: 'assistant',
                content: response.response,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, aiMessage]);

            // Store metadata for this message
            if (response.sources || response.metadata) {
                setMessageMetadata(prev => new Map(prev).set(aiMessage.id, response));
            }

            // Reload session list to update last_message_at
            loadSessions();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to send message';
            toast.error(errorMsg);

            // Remove optimistic user message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            setQuestion(userMessageContent); // Restore question
        } finally {
            setIsSending(false);
        }
    };

    const handleCopyMessage = async (content: string, messageId: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const suggestedQuestions = [
        "How do I apply for leave?",
        "What is the deployment process?",
        "Where is the API documentation?",
        "What are company benefits?",
    ];

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask cBrain" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading conversations...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Agent not configured state
    if (agentNotConfigured) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask cBrain" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mx-auto flex items-center justify-center mb-6">
                            <Brain className="w-10 h-10 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">AI Assistant Not Ready Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            The AI assistant hasn't been configured by your administrator yet.
                            Please check back later or contact your admin to set up the knowledge base.
                        </p>
                        <div className="glass rounded-xl p-4 text-left">
                            <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Admin creates an AI agent</li>
                                <li>• Knowledge documents are uploaded</li>
                                <li>• Agent is trained on company data</li>
                                <li>• You can start asking questions!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && sessions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask cBrain" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={loadSessions}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader title="Ask cBrain" user={user} />

            <div className="flex-1 flex overflow-hidden">
                {/* Conversation Sidebar */}
                <ConversationSidebar
                    sessions={sessions}
                    activeSessionId={activeSession?.id || null}
                    onSelectSession={setActiveSession}
                    onCreateNew={createNewSession}
                    onDelete={handleDeleteSession}
                    isCreating={isCreatingSession}
                />

                {/* Main Chat Area */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col max-w-4xl mx-auto w-full overflow-y-auto">
                    {/* Hero Section - Only show when no messages */}
                    {messages.length === 0 && (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-4">
                                    <Brain className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-foreground">How can I help you today?</h1>
                                <p className="text-muted-foreground mt-2">
                                    Ask me anything about company policies, processes, or documentation
                                </p>
                            </div>

                            {/* Suggested Questions */}
                            <div className="mb-8">
                                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Suggested questions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setQuestion(q)}
                                            className="px-4 py-2 rounded-full bg-secondary/30 hover:bg-secondary/50 text-sm text-foreground transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Conversation History */}
                    {messages.length > 0 && (
                        <div className="flex-1 space-y-6 mb-8 overflow-y-auto">
                            {messages.map((message, idx) => (
                                <div key={message.id} className="glass rounded-2xl p-6 space-y-4">
                                    {message.role === 'user' ? (
                                        <div className="flex items-start gap-3">
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="font-medium text-foreground">{message.content}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatRelativeTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                                <Brain className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                {/* AI Response with Markdown */}
                                                <div className="prose prose-sm max-w-none dark:prose-invert text-foreground/90">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>

                                                {/* Source Documents */}
                                                {messageMetadata.get(message.id)?.sources && (
                                                    <SourceDocuments sources={messageMetadata.get(message.id)!.sources!} />
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-4 mt-4">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {messageMetadata.get(message.id)?.metadata?.response_time
                                                            ? `${messageMetadata.get(message.id)!.metadata!.response_time}s`
                                                            : 'Just now'}
                                                    </span>

                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <button
                                                            onClick={() => handleCopyMessage(message.content, message.id)}
                                                            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copiedMessageId === message.id ? (
                                                                <Check className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <MessageRating
                                                            messageId={message.id}
                                                            currentRating={message.feedback as 'up' | 'down' | null}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator when sending */}
                            {isSending && (
                                <div className="glass rounded-2xl p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                            <Brain className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input Form - Fixed at bottom */}
                    <form onSubmit={handleSubmit} className="mt-auto">
                        <div className="glass rounded-2xl p-2 flex items-center gap-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Type your question here..."
                                className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!question.trim() || isSending}
                                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AskBrain;
