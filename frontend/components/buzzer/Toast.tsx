import { useState } from 'react';

export function Toast({ message, type = 'info', onClose }: { message: string, type?: 'info' | 'error' | 'success', onClose: () => void }) {
    if (!message) return null;
    let color = 'bg-blue-600';
    if (type === 'error') color = 'bg-red-600';
    if (type === 'success') color = 'bg-green-600';
    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 ${color}`}
            onClick={onClose}
            style={{ cursor: 'pointer' }}
        >
            {message}
        </div>
    );
}
