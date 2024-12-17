import './index.test';
import { ADDRESSES, v3routing } from '../../src';

describe('swap', () => {
  test('routing', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.IP.id; // IP token
    const amount = BigInt(10 ** 15); // for example, 0.001 WIP

    const routes = await v3routing(tokenIn, tokenOut, amount, true);
    console.log('Routes:', routes);

    // // Expect that either we get a route or an empty array
    expect(routes).toBeDefined();
  });
});
