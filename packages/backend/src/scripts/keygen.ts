async function keygen() {
  // Dynamic import to avoid ESM issues with ts-node
  const { exportJwk, generateCryptoKeyPair } = await import('@fedify/fedify');

  const keyPair = await generateCryptoKeyPair('RSASSA-PKCS1-v1_5');
  const jwk = await exportJwk(keyPair.privateKey);
  console.log(JSON.stringify(jwk, null, 2));
}

keygen().catch(console.error);
