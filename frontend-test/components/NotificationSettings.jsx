import { useState, useEffect } from 'react';

export default function NotificationSettings({ token, API_URL, user }) {
    const [preferences, setPreferences] = useState({
        messageNotifications: true,
        mentionNotifications: true,
        typingIndicators: true,
        readReceipts: true,
        soundEnabled: true,
        desktopNotifications: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await fetch(`${API_URL}/notifications/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setPreferences(data.data);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const updatePreferences = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(preferences),
            });
            const data = await res.json();
            if (data.success) {
                alert('Notification preferences updated successfully');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            alert('Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Notification Settings</h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Message Notifications</div>
                        <div className="text-sm text-gray-600">Receive notifications for new messages</div>
                    </div>
                    <button
                        onClick={() => handleToggle('messageNotifications')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.messageNotifications ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.messageNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Mention Notifications</div>
                        <div className="text-sm text-gray-600">Receive notifications when mentioned</div>
                    </div>
                    <button
                        onClick={() => handleToggle('mentionNotifications')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.mentionNotifications ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.mentionNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Typing Indicators</div>
                        <div className="text-sm text-gray-600">Show when others are typing</div>
                    </div>
                    <button
                        onClick={() => handleToggle('typingIndicators')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.typingIndicators ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.typingIndicators ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Read Receipts</div>
                        <div className="text-sm text-gray-600">Let others know when you've read messages</div>
                    </div>
                    <button
                        onClick={() => handleToggle('readReceipts')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.readReceipts ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.readReceipts ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Sound</div>
                        <div className="text-sm text-gray-600">Play sound for new notifications</div>
                    </div>
                    <button
                        onClick={() => handleToggle('soundEnabled')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.soundEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div>
                        <div className="font-semibold">Desktop Notifications</div>
                        <div className="text-sm text-gray-600">Show desktop notifications</div>
                    </div>
                    <button
                        onClick={() => handleToggle('desktopNotifications')}
                        className={`w-12 h-6 rounded-full transition-all ${
                            preferences.desktopNotifications ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 bg-white rounded-full transition-all ${
                                preferences.desktopNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <button
                onClick={updatePreferences}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60"
            >
                {loading ? 'Saving...' : 'Save Preferences'}
            </button>
        </div>
    );
}
