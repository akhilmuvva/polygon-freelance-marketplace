import React from 'react';
import { EXPLORER_URL } from '../lib/constants';

interface UserLinkProps {
  address: string;
  className?: string;
  showAvatar?: boolean;
}

export const UserLink: React.FC<UserLinkProps> = ({ 
  address, 
  className = '', 
  showAvatar = true 
}) => {
  if (!address) return <span className="text-zinc-500 italic">Unidentified Protocol</span>;

  const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Generate a stable gradient based on the address
  const getGradient = (addr: string) => {
    const seed = addr.slice(2, 10);
    const h1 = parseInt(seed.slice(0, 4), 16) % 360;
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 80%, 50%))`;
  };

  return (
    <a
      href={`${EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 group transition-all duration-300 ${className}`}
    >
      {showAvatar && (
        <div 
          className="w-6 h-6 rounded-full border border-white/10 group-hover:scale-110 group-hover:border-violet-500/50 transition-all duration-300" 
          style={{ background: getGradient(address) }}
        />
      )}
      <span className="font-mono text-sm text-zinc-400 group-hover:text-violet-400 decoration-violet-500/0 group-hover:decoration-violet-500/50 underline underline-offset-4 transition-all">
        {displayAddress}
      </span>
    </a>
  );
};

export default UserLink;

