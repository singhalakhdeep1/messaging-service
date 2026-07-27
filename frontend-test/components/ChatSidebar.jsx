import { format } from 'date-fns';
import { useState } from 'react';

export default function ChatSidebar({ user, chats, selectedChat, onSelectChat, onCreateChat, loading, onlineUsers, onShowAnalytics, onShowNotificationSettings, onShowIntegrationSettings }) {
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [participants, setParticipants] = useState('');

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName || !participants) return;

        const participantEmails = participants.split(',').map(p => p.trim());
        
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            
            const res = await fetch(`${API_URL}/chats/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: groupName,
                    participants: participantEmails
                }),
            });

            if (res.ok) {
                setShowGroupModal(false);
                setGroupName('');
                setParticipants('');
                onCreateChat();
            }
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

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
                <div className="flex gap-2">
                    <button onClick={onCreateChat} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60 text-sm" disabled={loading}>
                        {loading ? 'Creating...' : '+ New Chat'}
                    </button>
                    <button onClick={() => setShowGroupModal(true)} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                        + Group
                    </button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={onShowAnalytics} className="flex-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                        📊 Analytics
                    </button>
                    <button onClick={onShowNotificationSettings} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-700 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                        🔔 Settings
                    </button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={onShowIntegrationSettings} className="flex-1 bg-gradient-to-r from-pink-500 to-pink-700 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                        🔗 Integrations
                    </button>
                </div>
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
                                    {chat.isGroupChat ? '👥' : chat.participants.find((p) => p._id !== user._id)?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold mb-1">
                                        {chat.isGroupChat ? chat.name : chat.participants.find((p) => p._id !== user._id)?.name}
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

            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create Group Chat</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block mb-2 font-semibold text-gray-700">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-semibold text-gray-700">Participants (comma-separated emails)</label>
                                <input
                                    type="text"
                                    value={participants}
                                    onChange={(e) => setParticipants(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    placeholder="user1@example.com, user2@example.com"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all">
                                    Create Group
                                </button>
                                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
