import { format } from 'date-fns';

export default function MessageItem({ message, isOwn, onRead, onEdit, onDelete, onReaction, highlightMentions }) {
    const handleReadClick = () => {
        if (onRead && !isOwn) {
            onRead(message._id);
        }
    };

    const readCount = message.readBy?.length || 0;
    const deliveredCount = message.deliveredTo?.length || 0;

    const renderContent = () => {
        if (message.type === 'file' && message.fileUrl) {
            return (
                <div>
                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        📎 {message.content}
                    </a>
                </div>
            );
        }
        
        const content = highlightMentions ? highlightMentions(message.content) : message.content;
        return <div className="text-sm" dangerouslySetInnerHTML={{ __html: content }} />;
    };

    return (
        <div className={`mb-4 flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-sm ${isOwn ? '' : ''}`}>
                {message.sender.name?.charAt(0).toUpperCase()}
            </div>
            <div className={`max-w-[70%] p-3 rounded-xl relative ${isOwn ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                <div className="font-semibold mb-1 text-sm">{message.sender.name}</div>
                {renderContent()}
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {message.reactions.map((reaction, idx) => (
                            <span key={idx} className="text-sm bg-white/20 px-2 py-1 rounded-full">
                                {reaction.emoji} {reaction.count || 1}
                            </span>
                        ))}
                    </div>
                )}

                <div className="text-xs opacity-70 mt-1 flex items-center gap-2 flex-wrap">
                    {format(new Date(message.createdAt), 'HH:mm')}
                    {isOwn && (
                        <span className="flex items-center gap-1">
                            {readCount > 0 ? (
                                <span className="text-blue-200">✓✓ Read ({readCount})</span>
                            ) : deliveredCount > 0 ? (
                                <span className="text-blue-200">✓✓ Delivered</span>
                            ) : (
                                <span className="text-blue-200">✓ Sent</span>
                            )}
                        </span>
                    )}
                    {!isOwn && (
                        <button 
                            onClick={handleReadClick}
                            className="text-xs underline opacity-70 hover:opacity-100"
                        >
                            Mark as read
                        </button>
                    )}
                    {isOwn && (
                        <>
                            <button 
                                onClick={() => onEdit && onEdit(message)}
                                className="text-xs underline opacity-70 hover:opacity-100"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => onDelete && onDelete(message)}
                                className="text-xs underline opacity-70 hover:opacity-100 text-red-300"
                            >
                                Delete
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => onReaction && onReaction(message)}
                        className="text-xs opacity-70 hover:opacity-100"
                    >
                        😊
                    </button>
                </div>
                {message.edited && (
                    <div className="text-xs opacity-50 italic">(edited)</div>
                )}
            </div>
        </div>
    );
}
