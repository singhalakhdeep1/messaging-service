export default function LoginForm({ onSubmit, loading }) {
    return (
        <div className="max-w-6xl mx-auto px-5 py-10">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mt-24">
                <h2 className="text-2xl mb-5 text-center">💬 Join Chat</h2>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold text-gray-700">Name</label>
                        <input name="name" type="text" className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all" required placeholder="Your name" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold text-gray-700">Email</label>
                        <input name="email" type="email" className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all" required placeholder="your@email.com" />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60" disabled={loading}>
                        {loading ? 'Joining...' : 'Join Chat'}
                    </button>
                </form>
            </div>
        </div>
    );
}
