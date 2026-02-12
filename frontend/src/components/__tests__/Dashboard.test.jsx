import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
    useAccount: vi.fn(() => ({ address: '0x1234567890123456789012345678901234567890', isConnected: true })),
    useBalance: vi.fn(() => ({ data: { formatted: '1.5', symbol: 'MATIC' } })),
    useContractRead: vi.fn(() => ({ data: null, isLoading: false })),
    useContractReads: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Mock ethers
vi.mock('ethers', () => ({
    ethers: {
        Contract: vi.fn(),
        formatEther: vi.fn((val) => val),
        parseEther: vi.fn((val) => val),
    },
}));

// Mock Apollo Client
vi.mock('@apollo/client', () => ({
    useQuery: vi.fn(() => ({
        loading: false,
        error: null,
        data: {
            jobs: [],
            globalStats: [{ totalJobs: '0', totalVolume: '0', activeUsers: '0' }],
        },
    })),
    gql: vi.fn((strings) => strings[0]),
}));

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render dashboard without crashing', () => {
        render(
            <BrowserRouter>
                <Dashboard address="0x1234567890123456789012345678901234567890" />
            </BrowserRouter>
        );

        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('should display user address when connected', () => {
        render(
            <BrowserRouter>
                <Dashboard address="0x1234567890123456789012345678901234567890" />
            </BrowserRouter>
        );

        // Should show truncated address
        expect(screen.getByText(/0x1234/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: true,
            error: null,
            data: null,
        });

        render(
            <BrowserRouter>
                <Dashboard address="0x1234567890123456789012345678901234567890" />
            </BrowserRouter>
        );

        // Should show loading indicators
        const loadingElements = screen.queryAllByText(/loading/i);
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display error message when query fails', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: false,
            error: new Error('Network error'),
            data: null,
        });

        render(
            <BrowserRouter>
                <Dashboard address="0x1234567890123456789012345678901234567890" />
            </BrowserRouter>
        );

        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should display stats when data is loaded', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: false,
            error: null,
            data: {
                jobs: [
                    { id: '1', status: 'Completed' },
                    { id: '2', status: 'Ongoing' },
                ],
                globalStats: [{
                    totalJobs: '100',
                    totalVolume: '50000',
                    activeUsers: '25',
                }],
            },
        });

        render(
            <BrowserRouter>
                <Dashboard address="0x1234567890123456789012345678901234567890" />
            </BrowserRouter>
        );

        // Should display statistics
        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('should handle wallet disconnection', () => {
        const { useAccount } = require('wagmi');
        useAccount.mockReturnValue({
            address: undefined,
            isConnected: false,
        });

        render(
            <BrowserRouter>
                <Dashboard address={undefined} />
            </BrowserRouter>
        );

        // Should show connect wallet message or handle gracefully
        expect(screen.getByText(/connect/i) || screen.getByText(/wallet/i)).toBeInTheDocument();
    });
});
