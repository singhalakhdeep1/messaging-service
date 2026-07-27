import { useState, useEffect } from 'react';

export default function IntegrationSettings({ token, API_URL }) {
    const [integrations, setIntegrations] = useState({
        slack: { enabled: false, webhookUrl: '' },
        discord: { enabled: false, webhookUrl: '' },
        telegram: { enabled: false, botToken: '', chatId: '' }
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({});

    useEffect(() => {
        fetchIntegrations();
        checkStatus();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const res = await fetch(`${API_URL}/integrations/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
        }
    };

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/integrations/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const testIntegration = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/integrations/test/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    webhookUrl: integrations[type].webhookUrl,
                    botToken: integrations[type].botToken,
                    chatId: integrations[type].chatId
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} integration test successful!`);
            } else {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} integration test failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error testing integration:', error);
            alert('Failed to test integration');
        } finally {
            setLoading(false);
        }
    };

    const saveIntegration = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/integrations/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(integrations[type]),
            });
            const data = await res.json();
            if (data.success) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} integration saved successfully`);
                checkStatus();
            } else {
                alert(`Failed to save ${type} integration`);
            }
        } catch (error) {
            console.error('Error saving integration:', error);
            alert('Failed to save integration');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (type, field, value) => {
        setIntegrations((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const handleToggle = (type) => {
        setIntegrations((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                enabled: !prev[type].enabled
            }
        }));
    };

    return (
        <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Integration Settings</h2>

            <div className="space-y-6">
                {/* Slack Integration */}
                <div className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                S
                            </div>
                            <div>
                                <div className="font-semibold">Slack</div>
                                <div className="text-sm text-gray-600">Send messages to Slack channels</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('slack')}
                            className={`w-12 h-6 rounded-full transition-all ${
                                integrations.slack.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-all ${
                                    integrations.slack.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>

                    {integrations.slack.enabled && (
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">Webhook URL</label>
                                <input
                                    type="url"
                                    value={integrations.slack.webhookUrl}
                                    onChange={(e) => handleChange('slack', 'webhookUrl', e.target.value)}
                                    placeholder="https://hooks.slack.com/services/..."
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => saveIntegration('slack')}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-60"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => testIntegration('slack')}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Discord Integration */}
                <div className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                D
                            </div>
                            <div>
                                <div className="font-semibold">Discord</div>
                                <div className="text-sm text-gray-600">Send messages to Discord channels</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('discord')}
                            className={`w-12 h-6 rounded-full transition-all ${
                                integrations.discord.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-all ${
                                    integrations.discord.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>

                    {integrations.discord.enabled && (
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">Webhook URL</label>
                                <input
                                    type="url"
                                    value={integrations.discord.webhookUrl}
                                    onChange={(e) => handleChange('discord', 'webhookUrl', e.target.value)}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => saveIntegration('discord')}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-60"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => testIntegration('discord')}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Telegram Integration */}
                <div className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                                T
                            </div>
                            <div>
                                <div className="font-semibold">Telegram</div>
                                <div className="text-sm text-gray-600">Send messages via Telegram bot</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('telegram')}
                            className={`w-12 h-6 rounded-full transition-all ${
                                integrations.telegram.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-all ${
                                    integrations.telegram.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>

                    {integrations.telegram.enabled && (
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">Bot Token</label>
                                <input
                                    type="text"
                                    value={integrations.telegram.botToken}
                                    onChange={(e) => handleChange('telegram', 'botToken', e.target.value)}
                                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">Chat ID</label>
                                <input
                                    type="text"
                                    value={integrations.telegram.chatId}
                                    onChange={(e) => handleChange('telegram', 'chatId', e.target.value)}
                                    placeholder="-1001234567890"
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => saveIntegration('telegram')}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-60"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => testIntegration('telegram')}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Integration Status */}
            {Object.keys(status).length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">Integration Status</h3>
                    <div className="space-y-2">
                        {status.slack && (
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status.slack ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm">Slack: {status.slack ? 'Connected' : 'Not Connected'}</span>
                            </div>
                        )}
                        {status.discord && (
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status.discord ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm">Discord: {status.discord ? 'Connected' : 'Not Connected'}</span>
                            </div>
                        )}
                        {status.telegram && (
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status.telegram ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm">Telegram: {status.telegram ? 'Connected' : 'Not Connected'}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
