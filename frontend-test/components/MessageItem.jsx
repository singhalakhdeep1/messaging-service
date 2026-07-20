import { format } from 'date-fns';

export default function MessageItem({ message, isOwn }) {
    return (
        <div className={`mb-4 flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-sm ${isOwn ? '' : ''}`}>
                {message.sender.name?.charAt(0).toUpperCase()}
            </div>
            <div className={`max-w-[70%] p-3 rounded-xl relative ${isOwn ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                <div className="font-semibold mb-1 text-sm">{message.sender.name}</div>
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                    {format(new Date(message.createdAt), 'HH:mm')}
                </div>
            </div>
        </div>
    );
}
