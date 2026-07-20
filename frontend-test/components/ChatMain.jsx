import MessageItem from './MessageItem';
import { format } from 'date-fns';

export default function ChatMain({ selectedChat, user, messages, typingUsers, messageInput, setMessageInput, onSendMessage, onTyping, messagesEndRef, onlineUsers }) {
    const otherUser = selectedChat?.participants.find((p) => p._id !== user._id);

    return (
        <div className="bg-white rounded-xl overflow-hidden flex flex-col">
            {selectedChat ? (
                <>
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-base">
                                {otherUser?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold">{otherUser?.name}</div>
                                <div className="text-xs text-gray-600">
                                    {onlineUsers.has(otherUser?._id) ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Online</span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Offline</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <div className="text-6xl mb-4">📝</div>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <MessageItem key={msg._id} message={msg} isOwn={msg.sender._id === user._id} />
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
                                placeholder="Type a message..."
                                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all"
                            />
                            <button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60" disabled={!messageInput.trim()}>
                                Send
                            </button>
                        </form>
                    </div>
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
