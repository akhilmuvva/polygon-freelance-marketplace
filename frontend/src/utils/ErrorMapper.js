export const ERROR_MESSAGES = {
  // Custom smart contract errors from FreelanceEscrowBase & FreelanceEscrow
  NotAuthorized: 'You are not authorized to perform this action. Ensure you are the correct party or have supreme access.',
  InvalidStatus: 'This action cannot be performed in the current job state.',
  AlreadyPaid: 'This job has already been fully paid out.',
  MilestoneAlreadyReleased: 'This milestone has already been released.',
  InvalidMilestone: 'The specified milestone is invalid or out of bounds.',
  InvalidAddress: 'An invalid address was provided (e.g., zero address).',
  LowStake: 'The provided application stake amount is too low.',
  LowValue: 'The funded amount specified is too low.',
  TransferFailed: 'The token transfer failed. Check your allowance and balance.',
  TokenNotWhitelisted: 'The specified token is not whitelisted for platform payments.',
  FrictionLevelNotDisputed: 'The job is not currently in a disputed state for resolution.',
  ProtocolEntropyDetected: 'System anomaly detected. Transaction aborted for security.',
  EmergencyActive: 'The protocol is currently in a sovereign freeze (emergency pause mode).',

  // Standard EVM / RPC errors
  UserRejectedRequestError: 'Transaction was rejected by the user.',
  InsufficientFundsError: 'Insufficient funds for gas or token transfer.',
  Unknown: 'An unknown error occurred during the transaction.',
};

/**
 * Parses a wagmi/viem error object and maps it to a human-readable string.
 * @param {Error} error The caught error object
 * @returns {string} Human readable error message
 */
export const parseTransactionError = (error) => {
  if (!error) return ERROR_MESSAGES.Unknown;

  // 1. User rejection check
  if (
    error.code === 4001 || 
    error.name === 'UserRejectedRequestError' || 
    (error.message && error.message.toLowerCase().includes('rejected'))
  ) {
    return ERROR_MESSAGES.UserRejectedRequestError;
  }

  // 2. Viem decoded custom errors (walk the error tree)
  if (typeof error.walk === 'function') {
    const revertError = error.walk((e) => e.name === 'ContractFunctionRevertedError');
    if (revertError && revertError.data && revertError.data.errorName) {
      const errorName = revertError.data.errorName;
      if (ERROR_MESSAGES[errorName]) {
        return ERROR_MESSAGES[errorName];
      }
    }
  }

  // 3. Fallback string matching for custom errors if ABI decoding failed
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (error.message && error.message.includes(key)) {
      return ERROR_MESSAGES[key];
    }
  }

  // 4. Common base RPC errors
  if (error.message && error.message.toLowerCase().includes('insufficient funds')) {
      return ERROR_MESSAGES.InsufficientFundsError;
  }

  // Return the shortest, most relevant message viem provides, or fallback
  return error.shortMessage || error.message || ERROR_MESSAGES.Unknown;
};
