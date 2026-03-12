import { useBalance } from 'wagmi';

/**
 * useTokenBalance: Fetches the balance of a specific token or native currency.
 * Used for gating premium "Elite AGA" features.
 */
export const useTokenBalance = (address, tokenAddress = null) => {
    const { data, isError, isLoading } = useBalance({
        address,
        tokenAddress,
        watch: true,
    });

    return {
        balance: data?.formatted || '0',
        symbol: data?.symbol || 'MATIC',
        isLoading,
        isError
    };
};
