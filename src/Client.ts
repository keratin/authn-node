/* API client */

import TokenVerifier, { VerifyToken } from "./TokenVerifier";
import Keychain from "./Keychain";

interface ClientConfig {
  // the base url of the service handling authentication
  // e.g. "https://issuer.tech"
  issuer: string;

  // the domain (host) of the main application. no protocol.
  // e.g. "audience.tech"
  audiences: string | string[];

  // URL used for private admin endpoints (default: issuer)
  adminURL?: string;

  // username for accessing private AuthN endpoints
  username: string;

  // password for accessing private AuthN endpoints
  password: string;

  // lifetime in minutes of keys in the keychain (default: 60)
  keychainTTL?: number;
}

class Client {
  config: Required<ClientConfig>;
  verifier: VerifyToken;

  constructor({ issuer, ...config }: ClientConfig) {
    const audiences = Array.isArray(config.audiences)
      ? config.audiences
      : [config.audiences];

    this.config = {
      issuer,
      adminURL: issuer,
      keychainTTL: 60,
      ...config,
    };

    this.verifier = TokenVerifier({
      issuer,
      audiences,
      getKey: Keychain({ issuer, keychainTTL: this.config.keychainTTL }),
    });
  }

  async subjectFrom(idToken: string): Promise<string> {
    return (await this.verifier(idToken))["Subject"];
  }
}

export default Client;
