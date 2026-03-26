import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import hotToast from 'react-hot-toast';

/**
 * @hook useTx
 * @notice Centralized transaction lifecycle management hook.
 * Handles loading states, toast notifications, and hash confirmation.
 */
export function useTx() {
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const execute = useCallback(async (txPromise, options = {}) => {
        const { 
            loadingMsg = 'Calibrating Intent...', 
            successMsg = 'Resonance Success!', 
            errorMsg = 'Transaction Failed',
            onSuccess = () => {},
            onError = () => {}
        } = options;

        const toastId = hotToast.loading(loadingMsg);
        setIsLoading(true);
        setTxHash(null);

        try {
            const hash = await txPromise;
            setTxHash(hash);
            
            hotToast.loading('Confirming Sovereignty...', { id: toastId });
            
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash,
                confirmations: 1
            });

            if (receipt.status === 'success') {
                hotToast.success(successMsg, { id: toastId });
                onSuccess(receipt);
                return receipt;
            } else {
                throw new Error('Transaction reverted on-chain');
            }
        } catch (error) {
            console.error('[TX_ERROR]', error);
            const msg = error.shortMessage || error.message || errorMsg;
            hotToast.error(msg, { id: toastId });
            onError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [publicClient]);

    return { execute, isLoading, txHash };
}
