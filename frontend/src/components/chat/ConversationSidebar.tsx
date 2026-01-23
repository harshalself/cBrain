import React from 'react';
import { ChatSessionWithSummary } from '@/services/chatService';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationSidebarProps {
    sessions: ChatSessionWithSummary[];
    activeSessionId: number | null;
    onSelectSession: (session: ChatSessionWithSummary) => void;
    onCreateNew: () => void;
    onDelete: (sessionId: number) => void;
    isCreating?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onCreateNew,
    onDelete,
    isCreating = false,
}) => {
    return (
        <div className="w-80 border-r border-border bg-secondary/5 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <button
                    onClick={onCreateNew}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                    <Plus className="w-5 h-5" />
                    New Conversation
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2">
                {sessions.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                            No conversations yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Start a new one!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <ConversationItem
                                key={session.id}
                                session={session}
                                isActive={session.id === activeSessionId}
                                onClick={() => onSelectSession(session)}
                                onDelete={() => onDelete(session.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                    {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
                </p>
            </div>
        </div>
    );
};

interface ConversationItemProps {
    session: ChatSessionWithSummary;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
    session,
    isActive,
    onClick,
    onDelete,
}) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDelete();
        }
    };

    // Generate a title from session data or use default
    const title = session.title || `Conversation #${session.id}`;
    const messageCount = session.message_count || 0;
    const lastMessageAt = session.last_message_at || session.updated_at;

    return (
        <div
            onClick={onClick}
            className={`
                group relative p-3 rounded-lg cursor-pointer transition-all
                ${isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-secondary/50 border border-transparent'
                }
            `}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(lastMessageAt)}</span>
                    </div>
                </div>

                {/* Delete button - shows on hover */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                p-1 rounded hover:bg-secondary/80 transition-opacity
                                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                        >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
