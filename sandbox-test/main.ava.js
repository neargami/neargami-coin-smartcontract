import anyTest from 'ava';
import { Worker } from 'near-workspaces';
import { setDefaultResultOrder } from 'dns'; 
setDefaultResultOrder('ipv4first'); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('token-contract');

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// Test for minting tokens
test('mint tokens', async (t) => {
  const { root, contract } = t.context.accounts;

  // Set up the parameters for minting
  const receiverId = 'houssine.testnet'; // Replace with the account you want to mint tokens to
  const amount = '100';

  // Check initial balance of the receiver (should be zero)
  const initialBalance = await contract.view('getBalance', { accountId: receiverId });
  t.is(initialBalance, '0', 'Initial balance should be zero');

  // Mint tokens to the receiver account
  await root.call(contract, 'mint', { receiver: receiverId, amount }); // Use receiverId here

  // Check the balance after minting
  const newBalance = await contract.view('getBalance', { accountId: receiverId });
  t.is(newBalance, amount, 'New balance should equal the minted amount');
});
