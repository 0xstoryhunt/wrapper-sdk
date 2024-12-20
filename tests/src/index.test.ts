import 'dotenv/config';
import { getWriteClient, initClient } from '../../src';
// import { defaultChain } from '../../src';
// import { ethers } from 'ethers';

const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const expectedAddress = process.env.TEST_PUBLIC_ADDRESS as `0x${string}`;

beforeAll(async () => {
  // 1. Setup: Initialize SDK with Wallet Client using Viem(Private Key)
  await initClient({ privateKey });

  // 2. Setup: Initialize SDK with Ether Signer
  // const provider = new ethers.JsonRpcProvider(
  //   defaultChain.rpcUrls.default.http[0]
  // );
  // const signer = new ethers.Wallet(privateKey || '', provider);
  // await initClient({ ethersSigner: signer });
});

describe('config wallet client using viem', () => {
  test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
    const walletClient: any = getWriteClient();
    expect(walletClient.account.address.toLowerCase()).toBe(
      expectedAddress.toLowerCase()
    );
  });
});
