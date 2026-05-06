import { useState, useCallback } from 'react';
import { useWriteContract, useChainId, useSwitchChain, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { toast as hotToast } from 'react-hot-toast';
import { parseTransactionError } from '../utils/ErrorMapper';
import { polygon } from 'viem/chains';

export function useTransaction() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const wagmiConfig = useConfig();

  /**
   * Executes a transaction with full lifecycle management, error parsing, and UI feedback.
   * 
   * @param {Object} contractConfig The wagmi contract config (address, abi, functionName, args, etc)
   * @param {Object} options Options containing callbacks and custom messages
   */
  const executeTransaction = useCallback(async (contractConfig, { 
    onSuccess, 
    onError, 
    successMessage = 'Transaction confirmed!',
    pendingMessage = 'Transaction processing on-chain...',
    retryOnGasFail = true
  } = {}) => {
    setIsPending(true);
    setIsSuccess(false);
    let toastId;

    try {
      // 1. Network Guard: Prompt network switch if user is on wrong chain
      if (chainId !== polygon.id) {
         if (switchChainAsync) {
             toastId = hotToast.loading('Switching to Polygon network...');
             await switchChainAsync({ chainId: polygon.id });
             hotToast.dismiss(toastId);
         } else {
             throw new Error('Please connect your wallet to the Polygon network.');
         }
      }

      toastId = hotToast.loading('Awaiting wallet signature...');

      // 2. Transaction Execution & Retry Mechanism for Gas Failures
      let hash;
      try {
         hash = await writeContractAsync(contractConfig);
      } catch (err) {
         // Simple retry mechanism if gas estimation explicitly fails and retry is requested
         if (retryOnGasFail && err.message && err.message.toLowerCase().includes('gas required exceeds allowance')) {
            hotToast.loading('Retrying with higher gas tolerance...', { id: toastId });
            // Attempt a blind retry (often wagmi/viem auto-adjusts, but we could inject manual gas limits here)
            hash = await writeContractAsync({ ...contractConfig, gas: 3000000n });
         } else {
            throw err;
         }
      }

      hotToast.loading(pendingMessage, { id: toastId });

      // 3. Receipt Waiting
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          confirmations: 1
      });

      if (receipt.status === 'success') {
          hotToast.success(successMessage, { id: toastId });
          setIsSuccess(true);
          if (onSuccess) onSuccess(receipt);
          return receipt;
      } else {
          throw new Error('Transaction reverted by the EVM.');
      }
    } catch (error) {
      console.error('[Transaction Error]', error);
      const parsedMessage = parseTransactionError(error);
      
      if (toastId) {
          hotToast.error(parsedMessage, { id: toastId, duration: 6000 });
      } else {
          hotToast.error(parsedMessage, { duration: 6000 });
      }
      
      if (onError) onError(error, parsedMessage);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, chainId, switchChainAsync, wagmiConfig]);

  return { executeTransaction, isPending, isSuccess };
}
