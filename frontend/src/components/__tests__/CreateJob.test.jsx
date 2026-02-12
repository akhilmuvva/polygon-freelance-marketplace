import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateJob from '../CreateJob';

// Mock wagmi
vi.mock('wagmi', () => ({
    useAccount: vi.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
    useContractWrite: vi.fn(() => ({
        write: vi.fn(),
        isLoading: false,
        isSuccess: false,
        error: null,
    })),
    useWaitForTransaction: vi.fn(() => ({
        isLoading: false,
        isSuccess: false
    })),
    usePrepareContractWrite: vi.fn(() => ({
        config: {},
        error: null,
    })),
}));

// Mock ethers
vi.mock('ethers', () => ({
    ethers: {
        parseEther: vi.fn((val) => val),
        formatEther: vi.fn((val) => val),
    },
}));

// Mock toast
vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('CreateJob Component', () => {
    const mockOnJobCreated = vi.fn();
    const mockSmartAccount = null;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render create job form', () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/create/i) && screen.getByText(/job/i)).toBeInTheDocument();
    });

    it('should have all required form fields', () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        // Check for essential form fields
        expect(screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/budget/i) || screen.getByPlaceholderText(/budget/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/duration/i) || screen.getByPlaceholderText(/duration/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        // Try to submit without filling fields
        const submitButton = screen.getByRole('button', { name: /create|submit|post/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Should show validation errors
            expect(screen.getByText(/required/i) || screen.getByText(/fill/i)).toBeInTheDocument();
        });
    });

    it('should handle form input changes', () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
        fireEvent.change(titleInput, { target: { value: 'Test Job Title' } });

        expect(titleInput.value).toBe('Test Job Title');
    });

    it('should handle budget input validation', async () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const budgetInput = screen.getByLabelText(/budget/i) || screen.getByPlaceholderText(/budget/i);

        // Try negative budget
        fireEvent.change(budgetInput, { target: { value: '-10' } });

        await waitFor(() => {
            // Should show error or prevent negative values
            expect(budgetInput.value === '' || parseFloat(budgetInput.value) >= 0).toBe(true);
        });
    });

    it('should handle category selection', () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const categorySelect = screen.getByLabelText(/category/i) || screen.getByRole('combobox');
        fireEvent.change(categorySelect, { target: { value: '1' } });

        expect(categorySelect.value).toBe('1');
    });

    it('should handle freelancer address input', () => {
        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const freelancerInput = screen.queryByLabelText(/freelancer/i) || screen.queryByPlaceholderText(/freelancer/i);

        if (freelancerInput) {
            fireEvent.change(freelancerInput, { target: { value: '0xFreelancer123' } });
            expect(freelancerInput.value).toBe('0xFreelancer123');
        }
    });

    it('should submit form with valid data', async () => {
        const { useContractWrite } = require('wagmi');
        const mockWrite = vi.fn();
        useContractWrite.mockReturnValue({
            write: mockWrite,
            isLoading: false,
            isSuccess: false,
            error: null,
        });

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        // Fill in all required fields
        const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
        const descriptionInput = screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i);
        const budgetInput = screen.getByLabelText(/budget/i) || screen.getByPlaceholderText(/budget/i);
        const durationInput = screen.getByLabelText(/duration/i) || screen.getByPlaceholderText(/duration/i);

        fireEvent.change(titleInput, { target: { value: 'Test Job' } });
        fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
        fireEvent.change(budgetInput, { target: { value: '1.0' } });
        fireEvent.change(durationInput, { target: { value: '7' } });

        const submitButton = screen.getByRole('button', { name: /create|submit|post/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Should call contract write function
            expect(mockWrite).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('should show loading state during submission', () => {
        const { useContractWrite } = require('wagmi');
        useContractWrite.mockReturnValue({
            write: vi.fn(),
            isLoading: true,
            isSuccess: false,
            error: null,
        });

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const submitButton = screen.getByRole('button', { name: /create|submit|post|loading/i });
        expect(submitButton).toBeDisabled();
    });

    it('should call onJobCreated after successful submission', async () => {
        const { useContractWrite, useWaitForTransaction } = require('wagmi');

        useContractWrite.mockReturnValue({
            write: vi.fn(),
            isLoading: false,
            isSuccess: true,
            error: null,
        });

        useWaitForTransaction.mockReturnValue({
            isLoading: false,
            isSuccess: true,
        });

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(mockOnJobCreated).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('should display error message on submission failure', async () => {
        const { useContractWrite } = require('wagmi');
        const { toast } = require('react-toastify');

        useContractWrite.mockReturnValue({
            write: vi.fn(),
            isLoading: false,
            isSuccess: false,
            error: new Error('Transaction failed'),
        });

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it('should handle gasless mode with smart account', () => {
        const smartAccount = {
            accountAddress: '0xSmartAccount123',
        };

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={smartAccount}
                    gasless={true}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        // Should indicate gasless mode
        expect(screen.getByText(/gasless/i) || screen.getByText(/sponsored/i)).toBeInTheDocument();
    });

    it('should reset form after successful submission', async () => {
        const { useContractWrite, useWaitForTransaction } = require('wagmi');

        useContractWrite.mockReturnValue({
            write: vi.fn(),
            isLoading: false,
            isSuccess: true,
            error: null,
        });

        useWaitForTransaction.mockReturnValue({
            isLoading: false,
            isSuccess: true,
        });

        render(
            <BrowserRouter>
                <CreateJob
                    smartAccount={mockSmartAccount}
                    gasless={false}
                    address="0x1234567890123456789012345678901234567890"
                    onJobCreated={mockOnJobCreated}
                />
            </BrowserRouter>
        );

        const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
        fireEvent.change(titleInput, { target: { value: 'Test Job' } });

        await waitFor(() => {
            // Form should be reset
            expect(titleInput.value).toBe('');
        }, { timeout: 3000 });
    });
});
