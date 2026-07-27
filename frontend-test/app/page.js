'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Header from '@/components/Header';
import Message from '@/components/Message';
import LoginForm from '@/components/LoginForm';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMain from '@/components/ChatMain';
import Features from '@/components/Features';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import NotificationSettings from '@/components/NotificationSettings';
import IntegrationSettings from '@/components/IntegrationSettings';

export default function ChatApp() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [loading, setLoading] = useState({});
    const [message, setMessage] = useState(null);
    const [showLogin, setShowLogin] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [file, setFile] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [showIntegrationSettings, setShowIntegrationSettings] = useState(false);
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    // API wrapper with automatic token refresh
    const apiCall = async (url, options = {}) => {
        let currentToken = token;
        const headers = {
            ...options.headers,
            Authorization: `Bearer ${currentToken}`,
        };

        let response = await fetch(url, { ...options, headers });

        // If 401, try to refresh token
        if (response.status === 401) {
            await refreshToken();
            currentToken = localStorage.getItem('token');
            if (currentToken) {
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${currentToken}`,
                    },
                });
            }
        }

        return response;
    };

    const showMessage = (msg, type = 'success') => {
        setMessage({ text: msg, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const login = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;

        setLoading((prev) => ({ ...prev, login: true }));
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowLogin(false);
                connectSocket(data.token);
                fetchChats(data.token);
            }
        } catch (error) {
            showMessage('Login failed', 'error');
        } finally {
            setLoading((prev) => ({ ...prev, login: false }));
        }
    };

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            logout();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
            const data = await res.json();
            if (data.success) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                // Reconnect socket with new token
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    connectSocket(data.token);
                }
            } else {
                logout();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setShowLogin(true);
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const connectSocket = (authToken) => {
        socketRef.current = io(SOCKET_URL, {
            auth: { token: authToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            reconnectionDelayMax: 5000
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to socket');
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('Disconnected from socket:', reason);
            if (reason === 'io server disconnect') {
                // Server disconnected the socket, need to reconnect manually
                socketRef.current.connect();
            }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log('Reconnected to socket after', attemptNumber, 'attempts');
            // Re-join current chat
            if (selectedChat) {
                socketRef.current.emit('join:chat', selectedChat._id);
            }
        });

        socketRef.current.on('reconnect_attempt', (attemptNumber) => {
            console.log('Attempting to reconnect...', attemptNumber);
        });

        socketRef.current.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('Failed to reconnect to socket');
            showMessage('Connection lost. Please refresh the page.', 'error');
        });

        socketRef.current.on('message:received', (message) => {
            if (selectedChat && message.chat === selectedChat._id) {
                setMessages((prev) => [...prev, message]);
            }
            fetchChats(authToken);
        });

        socketRef.current.on('message:reaction', (data) => {
            if (selectedChat && data.messageId) {
                setMessages((prev) => 
                    prev.map((msg) => 
                        msg._id === data.messageId 
                            ? { ...msg, reactions: data.reactions } 
                            : msg
                    )
                );
            }
        });

        socketRef.current.on('message:delivered', (data) => {
            if (selectedChat && data.messageId) {
                setMessages((prev) => 
                    prev.map((msg) => 
                        msg._id === data.messageId 
                            ? { ...msg, deliveredTo: data.deliveredTo } 
                            : msg
                    )
                );
            }
        });

        socketRef.current.on('typing:start', ({ userId, userEmail }) => {
            if (selectedChat && userId !== user._id) {
                setTypingUsers((prev) => new Set([...prev, userEmail]));
            }
        });

        socketRef.current.on('typing:stop', ({ userId }) => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        });

        socketRef.current.on('user:online', ({ userId }) => {
            setOnlineUsers((prev) => new Set([...prev, userId]));
        });

        socketRef.current.on('user:offline', ({ userId }) => {
            setOnlineUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        });

        socketRef.current.on('error', (error) => {
            console.error('Socket error:', error);
        });
    };

    const fetchChats = async (authToken = token) => {
        try {
            const res = await fetch(`${API_URL}/chats`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const data = await res.json();
            setChats(data.data || []);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const fetchMessages = async (chatId, pageNum = 1) => {
        try {
            const res = await fetch(`${API_URL}/messages/chat/${chatId}?page=${pageNum}&limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (pageNum === 1) {
                setMessages(data.data || []);
            } else {
                setMessages((prev) => [...data.data, ...prev]);
            }
            setHasMore(data.data?.length === 50);
            setPage(pageNum);
            if (pageNum === 1) scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const loadMoreMessages = () => {
        if (selectedChat && hasMore) {
            fetchMessages(selectedChat._id, page + 1);
        }
    };

    const createChat = async () => {
        const email = prompt('Enter user email to chat with:');
        if (!email) return;

        setLoading((prev) => ({ ...prev, createChat: true }));
        try {
            const res = await fetch(`${API_URL}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ participants: [email] }),
            });
            const data = await res.json();
            if (data.success) {
                showMessage('Chat created successfully');
                fetchChats();
            }
        } catch (error) {
            showMessage('Failed to create chat', 'error');
        } finally {
            setLoading((prev) => ({ ...prev, createChat: false }));
        }
    };

    const selectChat = (chat) => {
        setSelectedChat(chat);
        setPage(1);
        setHasMore(true);
        if (socketRef.current) {
            socketRef.current.emit('leave:chat', selectedChat?._id);
            socketRef.current.emit('join:chat', chat._id);
        }
        fetchMessages(chat._id);
    };

    const handleRead = async (messageId) => {
        try {
            const res = await fetch(`${API_URL}/messages/${messageId}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, readBy: [...(msg.readBy || []), { user: user._id, readAt: new Date() }] }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleEdit = async (messageId, content) => {
        try {
            const res = await fetch(`${API_URL}/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (res.ok) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, content, edited: true, editedAt: new Date() }
                            : msg
                    )
                );
                showMessage('Message edited');
            }
        } catch (error) {
            console.error('Error editing message:', error);
            showMessage('Failed to edit message', 'error');
        }
    };

    const handleDelete = async (messageId) => {
        try {
            const res = await fetch(`${API_URL}/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, deleted: true, content: 'This message was deleted' }
                            : msg
                    )
                );
                showMessage('Message deleted');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            showMessage('Failed to delete message', 'error');
        }
    };

    const handleReaction = async (message, emoji) => {
        try {
            const res = await fetch(`${API_URL}/messages/${message._id}/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ emoji }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === message._id
                            ? { ...msg, reactions: data.data }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await fetch(`${API_URL}/messages/search?q=${encodeURIComponent(searchQuery)}&chatId=${selectedChat?._id || ''}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSearchResults(data.data?.messages || []);
            setShowSearch(true);
        } catch (error) {
            console.error('Error searching messages:', error);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/upload/file`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                // Send file message
                if (socketRef.current && selectedChat) {
                    socketRef.current.emit('message:send', {
                        chatId: selectedChat._id,
                        content: data.data.fileName,
                        type: 'file',
                        fileUrl: data.data.fileUrl,
                    });
                }
                setShowFileUpload(false);
                setFile(null);
                showMessage('File uploaded successfully');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showMessage('Failed to upload file', 'error');
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat || !socketRef.current) return;

        socketRef.current.emit('message:send', {
            chatId: selectedChat._id,
            content: messageInput,
            type: 'text',
        });

        setMessageInput('');
        setIsTyping(false);
    };

    const handleTyping = () => {
        if (!isTyping && socketRef.current && selectedChat) {
            setIsTyping(true);
            socketRef.current.emit('typing:start', { chatId: selectedChat._id });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (socketRef.current && selectedChat) {
                socketRef.current.emit('typing:stop', { chatId: selectedChat._id });
            }
        }, 1000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setShowLogin(false);
            connectSocket(savedToken);
            fetchChats(savedToken);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    if (showLogin) {
        return <LoginForm onSubmit={login} loading={loading.login} />;
    }

    return (
        <div className="max-w-7xl mx-auto px-5 py-10">
            <Header />
            <Message message={message} />
            
            <div className="grid grid-cols-[350px_1fr] gap-6 h-[calc(100vh-120px)]">
                <ChatSidebar 
                    user={user}
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    loading={loading.createChat}
                    onlineUsers={onlineUsers}
                    onShowAnalytics={() => setShowAnalytics(true)}
                    onShowNotificationSettings={() => setShowNotificationSettings(true)}
                    onShowIntegrationSettings={() => setShowIntegrationSettings(true)}
                />
                <ChatMain 
                    selectedChat={selectedChat}
                    user={user}
                    messages={messages}
                    typingUsers={typingUsers}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    onSendMessage={sendMessage}
                    onTyping={handleTyping}
                    messagesEndRef={messagesEndRef}
                    onlineUsers={onlineUsers}
                    onRead={handleRead}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReaction={handleReaction}
                    onLoadMore={loadMoreMessages}
                    hasMore={hasMore}
                    onSearch={handleSearch}
                    onFileUpload={handleFileUpload}
                />
            </div>

            <Features />

            {showAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Analytics Dashboard</h3>
                            <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        <AnalyticsDashboard token={token} API_URL={API_URL} />
                    </div>
                </div>
            )}

            {showNotificationSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Notification Settings</h3>
                            <button onClick={() => setShowNotificationSettings(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        <NotificationSettings token={token} API_URL={API_URL} user={user} />
                    </div>
                </div>
            )}

            {showIntegrationSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Integration Settings</h3>
                            <button onClick={() => setShowIntegrationSettings(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        <IntegrationSettings token={token} API_URL={API_URL} />
                    </div>
                </div>
            )}
        </div>
    );
}
