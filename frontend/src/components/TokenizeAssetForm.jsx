import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import AssetTokenizerABI from '../abis/AssetTokenizer.json';

const ASSET_TYPES = {
    INVOICE: 0,
    IP_RIGHTS: 1,
    REVENUE_SHARE: 2,
    FUTURE_EARNINGS: 3,
    PHYSICAL_ASSET: 4
};

export default function TokenizeAssetForm({ contractAddress }) {
    const { address } = useAccount();
    const [formData, setFormData] = useState({
        assetType: ASSET_TYPES.REVENUE_SHARE,
        paymentToken: '0x0000000000000000000000000000000000000000', // Native token
        totalValue: '',
        totalSupply: '',
        maturityMonths: 12,
        metadataURI: '',
        legalHash: ''
    });

    const { data: hash, writeContract: tokenizeAsset } = useWriteContract();

    const { isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const maturityDate = Math.floor(Date.now() / 1000) + (formData.maturityMonths * 30 * 24 * 60 * 60);
        const legalHashBytes = formData.legalHash || '0x' + '0'.repeat(64);

        tokenizeAsset({
            address: contractAddress,
            abi: AssetTokenizerABI,
            functionName: 'tokenizeAsset',
            args: [
                formData.assetType,
                formData.paymentToken,
                parseUnits(formData.totalValue, 6), // Assuming USDC (6 decimals)
                BigInt(formData.totalSupply),
                BigInt(maturityDate),
                formData.metadataURI,
                legalHashBytes
            ]
        });
    };

    return (
        <div className="tokenize-asset-form">
            <h2>🪙 Tokenize Real-World Asset</h2>
            <p className="subtitle">Create fractional tokens backed by real-world value</p>

            <form onSubmit={handleSubmit}>
                {/* Asset Type */}
                <div className="form-group">
                    <label>Asset Type</label>
                    <select
                        value={formData.assetType}
                        onChange={(e) => setFormData({ ...formData, assetType: parseInt(e.target.value) })}
                        required
                    >
                        <option value={ASSET_TYPES.INVOICE}>📄 Invoice</option>
                        <option value={ASSET_TYPES.IP_RIGHTS}>🎨 IP Rights</option>
                        <option value={ASSET_TYPES.REVENUE_SHARE}>💰 Revenue Share</option>
                        <option value={ASSET_TYPES.FUTURE_EARNINGS}>📈 Future Earnings</option>
                        <option value={ASSET_TYPES.PHYSICAL_ASSET}>📦 Physical Asset</option>
                    </select>
                </div>

                {/* Total Value */}
                <div className="form-group">
                    <label>Total Value (USDC)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 50000"
                        value={formData.totalValue}
                        onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                        required
                    />
                    <small>Total value of the asset in USDC</small>
                </div>

                {/* Total Supply */}
                <div className="form-group">
                    <label>Fractional Tokens</label>
                    <input
                        type="number"
                        placeholder="e.g., 10000"
                        value={formData.totalSupply}
                        onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                        required
                    />
                    <small>Number of fractional ownership tokens to create</small>
                </div>

                {/* Maturity Period */}
                <div className="form-group">
                    <label>Maturity Period (Months)</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.maturityMonths}
                        onChange={(e) => setFormData({ ...formData, maturityMonths: parseInt(e.target.value) })}
                        required
                    />
                    <small>When the asset matures and all value should be distributed</small>
                </div>

                {/* Metadata URI */}
                <div className="form-group">
                    <label>Documentation (IPFS)</label>
                    <input
                        type="text"
                        placeholder="ipfs://Qm..."
                        value={formData.metadataURI}
                        onChange={(e) => setFormData({ ...formData, metadataURI: e.target.value })}
                        required
                    />
                    <small>IPFS hash with asset documentation, contracts, and proof</small>
                </div>

                {/* Legal Hash */}
                <div className="form-group">
                    <label>Legal Agreement Hash (Optional)</label>
                    <input
                        type="text"
                        placeholder="0x..."
                        value={formData.legalHash}
                        onChange={(e) => setFormData({ ...formData, legalHash: e.target.value })}
                    />
                    <small>Hash of the legal agreement for dispute resolution</small>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || !address}
                >
                    {isLoading ? '⏳ Tokenizing...' : '🚀 Tokenize Asset'}
                </button>

                {isSuccess && (
                    <div className="success-message">
                        ✅ Asset tokenized successfully! Transaction: {hash?.slice(0, 10)}...
                    </div>
                )}
            </form>

            <style jsx>{`
        .tokenize-asset-form {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
          border-radius: 16px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #94a3b8;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        input, select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        small {
          display: block;
          margin-top: 0.25rem;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .btn-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          color: #22c55e;
        }
      `}</style>
        </div>
    );
}
