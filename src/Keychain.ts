import { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

interface Config {
  issuer: string; // URL
  keychainTTL: number; // in minutes
}

export interface GetKey {
  (header: JwtHeader): Promise<string>;
}

const Keychain = (config: Config): GetKey => {
  const client = jwksClient({
    cache: true,
    cacheMaxAge: config.keychainTTL * 60 * 1000,
    jwksUri: `${config.issuer}/jwks`,
  });
  return async (header) =>
    await new Promise((resolve, reject) => {
      client.getSigningKey(header.kid || "unknown", function (err, key) {
        err ? reject(err) : resolve(key ? key.getPublicKey(): "");
      });
    });
};
export default Keychain;
