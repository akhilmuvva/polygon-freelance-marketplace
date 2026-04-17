import { createPublicClient, http, keccak256, stringToBytes } from 'viem';
import { polygon } from 'viem/chains';

const client = createPublicClient({
  chain: polygon,
  transport: http('https://polygon-rpc.com')
});

const ESCROW_ADDRESS = '0x38c76A767d45Fc390160449948aF80569E2C4217';
const ARCHITECT_WALLET = '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A';

// OpenZeppelin AccessControl roles
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MANAGER_ROLE = keccak256(stringToBytes('MANAGER_ROLE'));
const ARBITRATOR_ROLE = keccak256(stringToBytes('ARBITRATOR_ROLE'));

const ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkRoles() {
  console.log('--- Checking Roles for Architect ---');
  console.log('Wallet:', ARCHITECT_WALLET);
  
  try {
    const [isAdmin, isManager, isArbitrator] = await Promise.all([
      client.readContract({ address: ESCROW_ADDRESS, abi: ABI, functionName: 'hasRole', args: [DEFAULT_ADMIN_ROLE, ARCHITECT_WALLET] }),
      client.readContract({ address: ESCROW_ADDRESS, abi: ABI, functionName: 'hasRole', args: [MANAGER_ROLE, ARCHITECT_WALLET] }),
      client.readContract({ address: ESCROW_ADDRESS, abi: ABI, functionName: 'hasRole', args: [ARBITRATOR_ROLE, ARCHITECT_WALLET] })
    ]);

    console.log('Admin Role:', isAdmin ? '✅' : '❌');
    console.log('Manager Role:', isManager ? '✅' : '❌');
    console.log('Arbitrator Role:', isArbitrator ? '✅' : '❌');
  } catch (err) {
    console.error('Error reading roles:', err.message);
  }
}

checkRoles().catch(console.error);
