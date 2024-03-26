import { verify } from "jsonwebtoken";
import { GetKey } from "./Keychain.js";

interface Config {
  issuer: string;
  audiences: string[];
  getKey: GetKey;
}

interface Payload {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
}

export interface VerifyToken {
  (token: string): Promise<Payload>;
}

const TokenVerifier =
  (config: Config): VerifyToken =>
  async (token: string) =>
    await new Promise((resolve, reject) => {
      verify(
        token,
        (header, callback) => {
          config
            .getKey(header)
            .then((k) => callback(null, k))
            .catch((err) => callback(err));
        },
        {
          issuer: config.issuer,
          audience: config.audiences,
        },
        (err, payload) => (err ? reject(err) : resolve(payload as Payload))
      );
    });

export default TokenVerifier;
