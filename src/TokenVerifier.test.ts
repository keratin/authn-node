import TokenVerifier from "./TokenVerifier";
import { JsonWebTokenError, sign } from "jsonwebtoken";
import Key from "node-rsa";

describe("TokenVerifier", () => {
  const key = new Key({ b: 2048 });
  const verifier = TokenVerifier({
    issuer: "authn.example.com",
    audiences: ["myapp.example.com"],
    getKey: async () => key.exportKey("pkcs1-public-pem"),
  });

  test("valid JWT", async () => {
    const token = jwt(key, { sub: "123" });
    await expect(verifier(token)).resolves.toHaveProperty("sub", "123");
  });

  test("with invalid JWT", async () => {
    await expect(verifier(null as unknown as string)).rejects.toEqual(
      new JsonWebTokenError("jwt must be provided")
    );
    await expect(verifier("")).rejects.toEqual(
      new JsonWebTokenError("jwt must be provided")
    );
    await expect(verifier("a")).rejects.toEqual(
      new JsonWebTokenError("jwt malformed")
    );
    await expect(verifier("a.b")).rejects.toEqual(
      new JsonWebTokenError("jwt malformed")
    );
    await expect(verifier("a.b.c")).rejects.toEqual(
      new JsonWebTokenError("invalid token")
    );
  });

  test("with unsigned JWT", async () => {
    const token = jwt(null, {}, "none");
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("jwt signature is required")
    );
  });

  test("with JWT signed by unknown keypair", async () => {
    const unknownKey = new Key({ b: 2048 });
    const token = jwt(unknownKey);
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("invalid signature")
    );
  });

  test("with JWT from different issuer", async () => {
    const token = jwt(key, { iss: "https://evil.tech" });
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("jwt issuer invalid. expected: authn.example.com")
    );
  });

  test("with JWT for different audience", async () => {
    const token = jwt(key, { aud: "https://evil.tech" });
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("jwt audience invalid. expected: myapp.example.com")
    );
  });

  test("with expired JWT", async () => {
    const token = jwt(key, { exp: secondsFromNow(-1) });
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("jwt expired")
    );
  });

  test("with tampered claims JWT", async () => {
    const [header, payload, signature] = jwt(key).split(".");
    const claims = decodeSegment(payload);
    claims["sub"] = -1;
    const token = [header, encodeClaims(claims), signature].join(".");
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("invalid signature")
    );
  });

  test("with tampered alg=none JWT", async () => {
    const [header, payload] = jwt(key).split(".");
    const claims = decodeSegment(header);
    claims["alg"] = "none";
    const token = [encodeClaims(claims), payload].join(".");
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("jwt malformed")
    );
  });

  test("with tampered alg=hmac JWT", async () => {
    const token = jwt(makeString(2048), {}, "HS256");
    await expect(verifier(token)).rejects.toEqual(
      new JsonWebTokenError("invalid algorithm")
    );
  });
});

const makeString = (len: number): string => {
  let outString: string = '';
  let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < len; i++) {
    outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
  }
  return outString;
}

const secondsFromNow = (seconds: number): number =>
  Math.floor(Date.now() / 1000) + seconds * 60;

interface Claims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
}

const jwt = (
  key: Key | string | null,
  claims: Partial<Claims> = {},
  algorithm: "RS256" | "HS256" | "none" = "RS256"
): string =>
  sign(
    {
      iss: "authn.example.com",
      aud: "myapp.example.com",
      sub: Math.floor(Math.random() * 1000),
      exp: secondsFromNow(60),
      iat: secondsFromNow(-60),
      ...claims,
    },
    (key && key instanceof Key) ? key.exportKey("pkcs1-private-pem"): (!key ? "": key),
    { algorithm }
  );

const decodeSegment = (segment: string): any =>
  JSON.parse(Buffer.from(segment, "base64").toString("ascii"));
const encodeClaims = (claims: any): string =>
  Buffer.from(JSON.stringify(claims)).toString("base64");
