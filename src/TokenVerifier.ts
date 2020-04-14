import { verify } from "jsonwebtoken";
import { GetKey } from "./Keychain";

interface Config {
  issuer: string;
  audiences: string[];
  getKey: GetKey;
}

interface Payload {
  Subject: string;
}

export interface VerifyToken {
  (token: string): Promise<Payload>;
}

const TokenVerifier = (config: Config): VerifyToken => async (token: string) =>
  await new Promise((resolve, reject) => {
    verify(
      token,
      config.getKey,
      {
        issuer: config.issuer,
        audience: config.audiences,
      },
      (err, payload) => (err ? reject(err) : resolve(payload as Payload))
    );
  });

export default TokenVerifier;
