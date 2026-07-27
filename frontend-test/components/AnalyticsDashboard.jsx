import { useState, useEffect } from 'react';

export default function AnalyticsDashboard({ token, API_URL }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/analytics/dashboard?timeRange=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="bg-white rounded-xl p-6">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Analytics Dashboard</h2>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 rounded-xl">
                    <div className="text-sm opacity-80 mb-2">Total Messages</div>
                    <div className="text-3xl font-bold">{analytics.totalMessages || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-xl">
                    <div className="text-sm opacity-80 mb-2">Total Chats</div>
                    <div className="text-3xl font-bold">{analytics.totalChats || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-xl">
                    <div className="text-sm opacity-80 mb-2">Active Users</div>
                    <div className="text-3xl font-bold">{analytics.activeUsers || 0}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Messages Over Time</h3>
                    {analytics.messagesOverTime && analytics.messagesOverTime.length > 0 ? (
                        <div className="space-y-2">
                            {analytics.messagesOverTime.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{item.date}</span>
                                    <span className="font-semibold">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No data available</p>
                    )}
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">User Engagement</h3>
                    {analytics.userEngagement ? (
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Avg Messages/Day</div>
                                <div className="font-semibold text-lg">{analytics.userEngagement.avgMessagesPerDay || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Peak Hours</div>
                                <div className="font-semibold text-lg">{analytics.userEngagement.peakHours || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
                                <div className="font-semibold text-lg">{analytics.userEngagement.avgResponseTime || 'N/A'}</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
