import MessageItem from './MessageItem';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ChatMain({ selectedChat, user, messages, typingUsers, messageInput, setMessageInput, onSendMessage, onTyping, messagesEndRef, onlineUsers, onRead, onEdit, onDelete, onReaction, onLoadMore, hasMore, onSearch, onFileUpload }) {
    const otherUser = selectedChat?.participants.find((p) => p._id !== user._id);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [file, setFile] = useState(null);

    const emojis = ['😀', '😂', '😍', '👍', '👎', '❤️', '🔥', '🎉', '😢', '😮'];

    const handleEmojiClick = (emoji) => {
        if (onReaction) {
            onReaction(editingMessage, emoji);
        }
        setShowEmojiPicker(false);
        setEditingMessage(null);
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setEditContent(message.content);
    };

    const handleSaveEdit = () => {
        if (onEdit && editingMessage) {
            onEdit(editingMessage._id, editContent);
        }
        setEditingMessage(null);
        setEditContent('');
    };

    const handleDelete = (message) => {
        if (onDelete && window.confirm('Are you sure you want to delete this message?')) {
            onDelete(message._id);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleFileSubmit = (e) => {
        e.preventDefault();
        if (onFileUpload && file) {
            onFileUpload(file);
        }
    };

    // Highlight mentions in message content
    const highlightMentions = (content) => {
        if (!content) return '';
        return content.replace(/@(\w+)/g, '<span class="text-emerald-600 font-semibold">@$1</span>');
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden flex flex-col relative">
            {selectedChat ? (
                <>
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-base">
                                    {selectedChat.isGroupChat ? '👥' : otherUser?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold">{selectedChat.isGroupChat ? selectedChat.name : otherUser?.name}</div>
                                    <div className="text-xs text-gray-600">
                                        {onlineUsers.has(otherUser?._id) ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Online</span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Offline</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                                    title="Search messages"
                                >
                                    🔍
                                </button>
                                <button 
                                    onClick={() => setShowFileUpload(!showFileUpload)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                                    title="Upload file"
                                >
                                    📎
                                </button>
                            </div>
                        </div>
                    </div>

                    {showSearch && (
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search messages..."
                                    className="flex-1 p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                                <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
                                    Search
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowSearch(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {showFileUpload && (
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <form onSubmit={handleFileSubmit} className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="flex-1"
                                />
                                <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
                                    Upload
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowFileUpload(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                        {hasMore && (
                            <button 
                                onClick={onLoadMore}
                                className="w-full py-2 mb-4 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                                Load more messages
                            </button>
                        )}
                        {messages.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <div className="text-6xl mb-4">📝</div>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg._id}>
                                    {editingMessage?._id === msg._id ? (
                                        <div className="mb-4 flex gap-3 flex-row-reverse">
                                            <div className="max-w-[70%] p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
                                                <input
                                                    type="text"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/70"
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={handleSaveEdit} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">Save</button>
                                                    <button onClick={() => setEditingMessage(null)} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <MessageItem 
                                            key={msg._id} 
                                            message={msg} 
                                            isOwn={msg.sender._id === user._id}
                                            onRead={onRead}
                                            onEdit={() => handleEdit(msg)}
                                            onDelete={() => handleDelete(msg)}
                                            onReaction={() => {
                                                setEditingMessage(msg);
                                                setShowEmojiPicker(true);
                                            }}
                                            highlightMentions={highlightMentions}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                        {typingUsers.size > 0 && (
                            <div className="px-4 py-2 bg-gray-100 rounded-xl text-xs text-gray-600 inline-block mb-2">
                                {Array.from(typingUsers).join(', ')} is typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-5 border-t border-gray-200 bg-white">
                        <form onSubmit={onSendMessage} className="flex gap-3 flex-1">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => {
                                    setMessageInput(e.target.value);
                                    onTyping();
                                }}
                                placeholder="Type a message... (Use @username to mention)"
                                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all"
                            />
                            <button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60" disabled={!messageInput.trim()}>
                                Send
                            </button>
                        </form>
                    </div>

                    {showEmojiPicker && (
                        <div className="absolute bottom-20 right-10 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50">
                            <div className="grid grid-cols-5 gap-2">
                                {emojis.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-2xl hover:bg-gray-100 p-2 rounded"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-xl mb-2">Select a chat</h3>
                        <p>Choose a conversation from the sidebar to start messaging</p>
                    </div>
                </div>
            )}
        </div>
    );
}
