import { generateKeyPair as generateCryptoKeyPair } from 'crypto';
import { promisify } from 'util';
import { KeyAlgorithm } from '../entities/keypair.entity';

const generateKeyPairAsync = promisify(generateCryptoKeyPair);

export async function generateKeyPair(algorithm: KeyAlgorithm = KeyAlgorithm.RSA): Promise<{ publicKey: string; privateKey: string }> {
  if (algorithm === KeyAlgorithm.RSA) {
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
  } else if (algorithm === KeyAlgorithm.Ed25519) {
    const { publicKey, privateKey } = await generateKeyPairAsync('ed25519', {
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
  
  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  return generateKeyPair(KeyAlgorithm.RSA);
}

export async function generateEd25519KeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  return generateKeyPair(KeyAlgorithm.Ed25519);
}