import React, { useState } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { Coins, Loader2, RefreshCcw } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { formatUnits } from 'viem';
import { showPendingToast, updateToastToSuccess, updateToastToError, handleError } from '../utils/feedback';

export default function WithdrawButton({ address }) {
    const client = usePublicClient();
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0].address);
    const [isConfirming, setIsConfirming] = useState(false);

    const { data: balanceData, refetch, isLoading: isReading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'balances',
        args: [address, selectedToken],
    });

    const { writeContractAsync, isPending } = useWriteContract();

    /// @notice Actuates a capital withdrawal by neutralizing the accumulated balance into the sovereign's wallet.
    /// @dev Implements a non-custodial pull pattern. The protocol never pushes funds: users actuate their own liquidity.
    const actuateWithdrawalIntent = async () => {
        if (!address) {
            handleError({ shortMessage: "Sovereign identity required for withdrawal." });
            return;
        }

        try {
            // Signal intent to the EVM state via the fallback-resilient transport layer.
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'withdraw',
                args: [selectedToken],
                gas: 1000000n // Directive 02: Simulation Bypass for Functional Finality
            });
            
            const toastId = showPendingToast(hash);
            setIsConfirming(true);
            
            // Wait for network resonance to confirm the state transition.
            const receipt = await client.waitForTransactionReceipt({ hash });
            setIsConfirming(false);
            
            if (receipt.status === 'success') {
                updateToastToSuccess(toastId, "Liquidity Successfully Neutralized!");
                refetch();
            } else {
                updateToastToError(toastId, { shortMessage: "Gravity Anchor Detected: Transaction Reverted." });
            }
        } catch (error) {
            setIsConfirming(false);
            // Handle error through the centralized Antigravity feedback engine.
            handleError(error);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Coins size={16} style={{ color: 'var(--accent-light)' }} />
                <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>Withdrawable Balance</h3>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {SUPPORTED_TOKENS.map(token => (
                    <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token.address)}
                        style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px',
                            borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease',
                            background: selectedToken === token.address ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selectedToken === token.address ? 'rgba(124,92,252,0.3)' : 'var(--border)'}`,
                            color: selectedToken === token.address ? 'var(--accent-light)' : 'var(--text-tertiary)',
                        }}
                    >
                        {token.symbol}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {balanceData ? formatUnits(balanceData, SUPPORTED_TOKENS.find(t => t.address === selectedToken)?.decimals || 18) : '0.0'}
                        {isReading && <Loader2 size={14} style={{ opacity: 0.4, animation: 'spin 1s linear infinite' }} />}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Available to claim</span>
                </div>

                <button
                    onClick={actuateWithdrawalIntent}
                    disabled={!balanceData || balanceData === 0n || isPending || isConfirming}
                    className="btn btn-primary btn-sm"
                    style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, opacity: (!balanceData || balanceData === 0n || isPending || isConfirming) ? 0.5 : 1 }}
                >
                    {isPending || isConfirming ? (
                        <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processing</>
                    ) : (
                        <><RefreshCcw size={13} /> Withdraw</>
                    )}
                </button>
            </div>
        </div>
    );
}
