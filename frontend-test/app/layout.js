import './globals.css';

export const metadata = {
    title: 'Real-Time Chat',
    description: 'Real-time chat application with Socket.io',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
