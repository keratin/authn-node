import TokenVerifier, { VerifyToken } from "./TokenVerifier.js";
import Keychain from "./Keychain.js";
import axios, { AxiosRequestConfig } from "axios";

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

interface Account {
  id: number;
  username: string;
  locked: boolean;
  deleted: boolean;
}

interface Response<T> {
  result: T;
  errors: { field: string; message: string }[];
}

class Client {
  private config: Required<ClientConfig>;
  private verifier: VerifyToken;
  private axiosConfig: AxiosRequestConfig;

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
        issuer: config.adminURL || config.issuer,
        keychainTTL: this.config.keychainTTL,
      }),
    });

    this.axiosConfig = {
      auth: {
        username: config.username,
        password: config.password,
      },
    };
  }

  async account(id: number): Promise<Account> {
    return (
      await axios.get<Response<Account>>(this.accountURL(id), this.axiosConfig)
    ).data.result;
  }

  async updateAccount(id: number, data: { username: string }): Promise<void> {
    await axios.patch(this.accountURL(id), data, this.axiosConfig);
  }

  async archiveAccount(id: number): Promise<void> {
    await axios.delete(this.accountURL(id), this.axiosConfig);
  }

  async lockAccount(id: number): Promise<void> {
    await axios.patch(this.accountURL(id, "lock"), {}, this.axiosConfig);
  }

  async unlockAccount(id: number): Promise<void> {
    await axios.patch(this.accountURL(id, "unlock"), {}, this.axiosConfig);
  }

  async importAccount(data: {
    username: string;
    password: string;
    locked?: boolean;
  }): Promise<{ id: number }> {
    return (
      await axios.post<Response<{ id: number }>>(
        `${this.config.adminURL}/accounts/import`,
        data,
        this.axiosConfig
      )
    ).data.result;
  }

  async expirePassword(id: number): Promise<void> {
    await axios.patch(
      this.accountURL(id, "expire_password"),
      {},
      this.axiosConfig
    );
  }

  async subjectFrom(idToken: string | undefined): Promise<string | undefined> {
    if (!idToken) return;
    return (await this.verifier(idToken))["sub"];
  }

  private accountURL(id: number, action?: string): string {
    return `${this.config.adminURL}/accounts/${id}${
      action ? `/${action}` : ""
    }`;
  }
}

export default Client;
