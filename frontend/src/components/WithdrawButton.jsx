import React, { useEffect, useState } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { Coins, Loader2, RefreshCcw } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { formatEther } from 'viem';
import { showPendingToast, updateToastToSuccess, updateToastToError, handleError } from '../utils/feedback';

export default function WithdrawButton({ address }) {
    const client = usePublicClient();
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0].address);
    const [balance, setBalance] = useState(null);

    // Read Balance from Escalated "balances" mapping
    const { data: balanceData, refetch, isLoading: isReading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'balances',
        args: [address, selectedToken],
    });

    const { writeContractAsync, isPending } = useWriteContract();

    // We handle the waiting manually/imperatively or via the feedback util if we wanted to block
    // But since we want to show the pending toast with link immediately:

    const handleWithdraw = async () => {
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'withdraw',
                args: [selectedToken],
            });

            // Show pending toast with link
            const toastId = showPendingToast(hash);

            // Wait for transaction receipt
            const receipt = await client.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                updateToastToSuccess(toastId, "Withdrawal Successful!");
                refetch();
            } else {
                updateToastToError(toastId, { shortMessage: "Transaction Reverted" });
            }
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
            <h3 className="text-sm font-black text-text-dim uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Coins size={16} /> Withdrawable Balance
            </h3>

            <div className="flex gap-2 mb-4">
                {SUPPORTED_TOKENS.map(token => (
                    <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token.address)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${selectedToken === token.address
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                    >
                        {token.symbol}
                    </button>
                ))}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <div className="text-3xl font-black tracking-tight flex items-center gap-2">
                        {balance || '0.0'}
                        {isReading && <Loader2 size={16} className="animate-spin opacity-50" />}
                    </div>
                    <span className="text-xs text-text-muted">Available to claim</span>
                </div>

                <button
                    onClick={handleWithdraw}
                    disabled={!balance || balance === '0' || isPending || isConfirming}
                    className="btn-primary !py-2 !px-4 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending || isConfirming ? (
                        <><Loader2 className="animate-spin" size={14} /> Processing</>
                    ) : (
                        <><RefreshCcw size={14} /> Withdraw</>
                    )}
                </button>
            </div>
        </div>
    );
}
