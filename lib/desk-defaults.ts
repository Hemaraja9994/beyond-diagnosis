/**
 * Starting passwords for the three coordinator logins, stored only as slow scrypt hashes (N = 2^17),
 * so they cannot practically be recovered from this public code. Once a coordinator saves a new
 * password on the desk, that one (kept in the site's private database) replaces the starting one.
 */
export const startingPasswordHashes: Record<string, string> = {
  rachana: "scrypt17$fB51y_iPr8-R20lmrinf6Q$2eVhQx35CeGQOromUe45MtcCakBewCqDHFLlyFEylLo",
  swathi: "scrypt17$eQNP40wP70haeGyjdmVKgQ$K9awYDUQ7GpXhKSjal3dVEVjU66uHhed0xoCxd-3rSw",
  pavana: "scrypt17$tY79lTeil-49uMW_Se_xvA$8CjOGPWckyEnKczMOkru9eFegEYf164EyDdOipkRFEw",
};
