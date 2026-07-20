'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Header from '@/components/Header';
import Message from '@/components/Message';
import LoginForm from '@/components/LoginForm';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMain from '@/components/ChatMain';
import Features from '@/components/Features';

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
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

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

    const connectSocket = (authToken) => {
        socketRef.current = io(SOCKET_URL, {
            auth: { token: authToken },
            transports: ['websocket']
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to socket');
        });

        socketRef.current.on('message:received', (message) => {
            if (selectedChat && message.chat === selectedChat._id) {
                setMessages((prev) => [...prev, message]);
            }
            fetchChats(authToken);
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

    const fetchMessages = async (chatId) => {
        try {
            const res = await fetch(`${API_URL}/messages/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setMessages(data.data || []);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
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
        if (socketRef.current) {
            socketRef.current.emit('leave:chat', selectedChat?._id);
            socketRef.current.emit('join:chat', chat._id);
        }
        fetchMessages(chat._id);
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
                />
            </div>

            <Features />
        </div>
    );
}
