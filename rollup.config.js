export default {
  input: "lib/index.js",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.module.js",
      format: "es",
    },
  ],
  external: ["jsonwebtoken", "jwks-rsa"],
};
