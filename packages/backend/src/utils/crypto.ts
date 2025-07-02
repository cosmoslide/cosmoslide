import { generateKeyPair as generateCryptoKeyPair } from 'crypto';
import { promisify } from 'util';

const generateKeyPairAsync = promisify(generateCryptoKeyPair);

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}