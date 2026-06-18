import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessageWithMentions({ text, mentions = [], className = "", isMe = false }) {
    const navigate = useNavigate();

    if (!mentions || mentions.length === 0 || !text) {
        return <span className={className}>{text}</span>;
    }

    // Create a regular expression to match all mentioned names.
    // e.g. if mentions are [{name: "John Doe"}, {name: "Alice"}],
    // regex matches: /(@John Doe|@Alice)/g
    const sortedMentions = [...mentions].sort((a, b) => b.name.length - a.name.length);
    const mentionNames = sortedMentions.map(m => `@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    
    if (mentionNames.length === 0) {
        return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${mentionNames.join('|')})`, 'g');
    const parts = text.split(regex);

    // Style dynamically based on whether the bubble is the sender's (which is dark indigo)
    // or the receiver's (which is light/dark based on theme).
    const mentionStyle = isMe 
        ? "font-extrabold text-amber-300 hover:text-amber-200 hover:underline decoration-amber-300/50 cursor-pointer transition-colors"
        : "font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline cursor-pointer transition-colors";

    return (
        <span className={className}>
            {parts.map((part, index) => {
                const isMention = part.startsWith('@');
                if (isMention) {
                    const mentionName = part.substring(1); // remove the '@'
                    const matchedUser = sortedMentions.find(m => m.name === mentionName);
                    if (matchedUser) {
                        return (
                            <span
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/profile/${matchedUser.id}`);
                                }}
                                className={mentionStyle}
                            >
                                {part}
                            </span>
                        );
                    }
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </span>
    );
}
