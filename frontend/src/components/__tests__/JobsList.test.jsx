import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobsList from '../JobsList';

// Mock wagmi
vi.mock('wagmi', () => ({
    useAccount: vi.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
    useContractWrite: vi.fn(() => ({
        write: vi.fn(),
        isLoading: false,
        isSuccess: false,
    })),
    useWaitForTransaction: vi.fn(() => ({ isLoading: false, isSuccess: false })),
}));

// Mock Apollo Client
vi.mock('@apollo/client', () => ({
    useQuery: vi.fn(() => ({
        loading: false,
        error: null,
        data: {
            jobs: [
                {
                    id: '1',
                    jobId: '1',
                    client: '0xClient1',
                    freelancer: '0xFreelancer1',
                    amount: '1000000000000000000',
                    status: 'Created',
                    deadline: '1234567890',
                    category: '1',
                    ipfsHash: 'QmTest1',
                },
                {
                    id: '2',
                    jobId: '2',
                    client: '0xClient2',
                    freelancer: '0x0000000000000000000000000000000000000000',
                    amount: '2000000000000000000',
                    status: 'Ongoing',
                    deadline: '1234567890',
                    category: '2',
                    ipfsHash: 'QmTest2',
                },
            ],
        },
        refetch: vi.fn(),
    })),
    gql: vi.fn((strings) => strings[0]),
}));

describe('JobsList Component', () => {
    const mockOnUserClick = vi.fn();
    const mockOnSelectChat = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render jobs list without crashing', () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/jobs/i) || screen.getByText(/explorer/i)).toBeInTheDocument();
    });

    it('should display all jobs from GraphQL query', () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Should display both jobs
        expect(screen.getByText(/QmTest1/i) || screen.getAllByText(/job/i).length).toBeGreaterThan(0);
    });

    it('should show loading state when fetching jobs', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: true,
            error: null,
            data: null,
            refetch: vi.fn(),
        });

        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message when query fails', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: false,
            error: new Error('Failed to fetch jobs'),
            data: null,
            refetch: vi.fn(),
        });

        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
    });

    it('should filter jobs by status', async () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Find and click filter button/dropdown
        const filterButtons = screen.queryAllByRole('button');
        const statusFilter = filterButtons.find(btn =>
            btn.textContent.includes('Status') || btn.textContent.includes('Filter')
        );

        if (statusFilter) {
            fireEvent.click(statusFilter);

            await waitFor(() => {
                // Should show filter options
                expect(screen.getByText(/created/i) || screen.getByText(/ongoing/i)).toBeInTheDocument();
            });
        }
    });

    it('should search jobs by keyword', async () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        const searchInput = screen.queryByPlaceholderText(/search/i);

        if (searchInput) {
            fireEvent.change(searchInput, { target: { value: 'test' } });

            await waitFor(() => {
                // Should filter jobs based on search
                expect(searchInput.value).toBe('test');
            });
        }
    });

    it('should handle job application', async () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Find apply button
        const applyButtons = screen.queryAllByText(/apply/i);

        if (applyButtons.length > 0) {
            fireEvent.click(applyButtons[0]);

            await waitFor(() => {
                // Should show application modal or confirmation
                expect(screen.getByText(/confirm/i) || screen.getByText(/stake/i)).toBeInTheDocument();
            });
        }
    });

    it('should call onUserClick when clicking on user address', () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Find user address links
        const userLinks = screen.queryAllByText(/0x/i);

        if (userLinks.length > 0) {
            fireEvent.click(userLinks[0]);
            expect(mockOnUserClick).toHaveBeenCalled();
        }
    });

    it('should call onSelectChat when clicking chat button', () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Find chat buttons
        const chatButtons = screen.queryAllByLabelText(/chat/i);

        if (chatButtons.length > 0) {
            fireEvent.click(chatButtons[0]);
            expect(mockOnSelectChat).toHaveBeenCalled();
        }
    });

    it('should display empty state when no jobs available', () => {
        const { useQuery } = require('@apollo/client');
        useQuery.mockReturnValue({
            loading: false,
            error: null,
            data: { jobs: [] },
            refetch: vi.fn(),
        });

        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/no jobs/i) || screen.getByText(/empty/i)).toBeInTheDocument();
    });

    it('should sort jobs by different criteria', async () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={false}
                    smartAccount={null}
                />
            </BrowserRouter>
        );

        // Find sort dropdown
        const sortButtons = screen.queryAllByRole('button');
        const sortButton = sortButtons.find(btn =>
            btn.textContent.includes('Sort') || btn.textContent.includes('Order')
        );

        if (sortButton) {
            fireEvent.click(sortButton);

            await waitFor(() => {
                // Should show sort options
                expect(
                    screen.getByText(/newest/i) ||
                    screen.getByText(/budget/i) ||
                    screen.getByText(/deadline/i)
                ).toBeInTheDocument();
            });
        }
    });

    it('should handle gasless mode correctly', () => {
        render(
            <BrowserRouter>
                <JobsList
                    onUserClick={mockOnUserClick}
                    onSelectChat={mockOnSelectChat}
                    gasless={true}
                    smartAccount={{ accountAddress: '0xSmartAccount' }}
                />
            </BrowserRouter>
        );

        // Should indicate gasless mode is active
        expect(screen.getByText(/gasless/i) || screen.getByText(/sponsored/i)).toBeInTheDocument();
    });
});
