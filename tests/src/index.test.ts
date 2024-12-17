import 'dotenv/config';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defaultChain } from '../../src';


const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const expectedAddress = process.env.TEST_PUBLIC_ADDRESS as `0x${string}`;


beforeAll(async () => {
  //connect wallet
  if (!privateKey || !expectedAddress) {
    throw new Error(
      'TEST_PRIVATE_KEY and TEST_PUBLIC_ADDRESS not set in .env'
    );
  };

});

afterAll(async () => {
  //disconnect wallet
});

test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
  const walletAccount = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    chain: defaultChain,
    transport: http(),
    account: walletAccount,
  });

  if (!walletAccount || !walletAccount.address) {
    throw new Error(
      'No account is connected. Check private key configuration.'
    );
  }

  expect(walletClient.account.address.toLowerCase()).toBe(
    expectedAddress.toLowerCase()
  );
});
