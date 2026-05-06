import React, { createContext, useContext, useState, useEffect } from 'react';
import MockDataService from '../services/MockDataService';
import hotToast from 'react-hot-toast';

const DemoContext = createContext();

export const useDemo = () => useContext(DemoContext);

export const DemoProvider = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoWalletAddress, setDemoWalletAddress] = useState(null);
    const [demoTransactions, setDemoTransactions] = useState([]);

    const activateDemoMode = () => {
        setIsDemoMode(true);
        window.isDemoMode = true;
        setDemoWalletAddress('0xDemoUser' + Math.floor(Math.random() * 1000000).toString(16));
        hotToast.success('Activated Demo Mode. You are exploring with mock data.');
    };

    const deactivateDemoMode = () => {
        setIsDemoMode(false);
        window.isDemoMode = false;
        setDemoWalletAddress(null);
        setDemoTransactions([]);
        hotToast.success('Exited Demo Mode.');
    };

    const addDemoTransaction = (txName, durationMs = 2000) => {
        const id = 'tx_' + Date.now();
        setDemoTransactions(prev => [...prev, { id, name: txName, status: 'pending' }]);
        
        return new Promise(resolve => {
            setTimeout(() => {
                setDemoTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status: 'success' } : tx));
                resolve(id);
            }, durationMs);
        });
    };

    return (
        <DemoContext.Provider value={{
            isDemoMode,
            demoWalletAddress,
            activateDemoMode,
            deactivateDemoMode,
            addDemoTransaction,
            demoTransactions,
            mockData: MockDataService
        }}>
            {children}
        </DemoContext.Provider>
    );
};
