import { format } from 'date-fns';

export default function ChatSidebar({ user, chats, selectedChat, onSelectChat, onCreateChat, loading, onlineUsers }) {
    return (
        <div className="bg-gray-50 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-base">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold">{user?.name}</div>
                        <div className="text-xs text-gray-600 flex items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-2"></span> Online
                        </div>
                    </div>
                </div>
                <button onClick={onCreateChat} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60" disabled={loading}>
                    {loading ? 'Creating...' : '+ New Chat'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <div className="text-6xl mb-4">💬</div>
                        <p>No chats yet</p>
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat._id}
                            className={`p-4 border-b border-gray-200 cursor-pointer transition-all ${selectedChat?._id === chat._id ? 'bg-green-100 border-l-4 border-l-emerald-500' : 'hover:bg-gray-100'}`}
                            onClick={() => onSelectChat(chat)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-base">
                                    {chat.participants.find((p) => p._id !== user._id)?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold mb-1">
                                        {chat.participants.find((p) => p._id !== user._id)?.name}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {chat.lastMessage?.content?.substring(0, 30) || 'No messages yet'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {chat.lastMessage && format(new Date(chat.lastMessage.createdAt), 'HH:mm')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
