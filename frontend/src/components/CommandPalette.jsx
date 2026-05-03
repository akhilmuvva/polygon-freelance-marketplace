import React, { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, User, Trophy, Layout, Shield, Home, Terminal, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, setIsOpen, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <Home size={18} />, category: 'Navigation' },
    { id: 'jobs', label: 'Browse Jobs', icon: <Briefcase size={18} />, category: 'Navigation' },
    { id: 'specialists', label: 'Find Specialists', icon: <Zap size={18} />, category: 'Navigation' },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={18} />, category: 'Navigation' },
    { id: 'identity', label: 'Manage Identity', icon: <User size={18} />, category: 'Navigation' },
    { id: 'compliance', label: 'Compliance Center', icon: <Shield size={18} />, category: 'Protocols' },
    { id: 'manifesto', label: 'Read Manifesto', icon: <Terminal size={18} />, category: 'General' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (!isOpen) return;

      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, setIsOpen]);

  const executeCommand = (cmd) => {
    setActiveTab(cmd.id);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cmd-palette-overlay" onClick={() => setIsOpen(false)}>
          <motion.div 
            className="cmd-palette" 
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="cmd-input-wrapper">
              <Search size={20} className="text-zinc-500" />
              <input 
                ref={inputRef}
                className="cmd-input"
                placeholder="Search commands, pages, or freelancers..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <div className="cmd-kbd">ESC</div>
            </div>
            
            <div className="cmd-results">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <div 
                    key={cmd.id}
                    className={`cmd-item ${idx === selectedIndex ? 'active' : ''}`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="cmd-item-icon">{cmd.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{cmd.label}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{cmd.category}</span>
                    </div>
                    {idx === selectedIndex && <div className="cmd-kbd">ENTER</div>}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  No commands found for "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
