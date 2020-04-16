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
  private config: Required<ClientConfig>;
  private verifier: VerifyToken;

  constructor(config: ClientConfig) {
    const audiences = Array.isArray(config.audiences)
      ? config.audiences
      : [config.audiences];

    this.config = {
      adminURL: config.issuer,
      keychainTTL: 60,
      ...config,
    };

    this.verifier = TokenVerifier({
      issuer: config.issuer,
      audiences,
      getKey: Keychain({
        issuer: config.issuer,
        keychainTTL: this.config.keychainTTL,
      }),
    });
  }

  async subjectFrom(idToken: string | undefined): Promise<string | undefined> {
    if (!idToken) return;
    return (await this.verifier(idToken))["sub"];
  }
}

export default Client;
