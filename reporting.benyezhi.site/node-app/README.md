## Authentication

### Architectural Choices & Implementation
For this platform, authentication is built using a server-side MVC pattern powered by Node.js, Express, and MySQL. Session state is maintained via `express-session` backed by encrypted, HTTP-only cookies (`analytics_sid`), paired with server-side authentication and role-based middleware (`requireAuth` and `requireAdmin`).

### Design Decisions & Rationales
* **Session-Based Authentication over Client Tokens:** A server-side session mechanism was chosen over stateless JWTs to ensure immediate invalidation upon logout or credential changes[cite: 1]. Storing only the signed session identifier in an `HttpOnly` and `SameSite` cookie prevents client-side script access, effectively eliminating XSS-based credential theft.
* **Cryptographic Signing (`SESSION_SECRET`):** Session IDs are cryptographically signed using an HMAC-SHA256 digest with an environment-level secret key (`SESSION_SECRET`). This prevents session tampering, guessing, and privilege escalation from forged client cookies.
* **Password Hashing with Bcrypt:** User passwords are encrypted using `bcrypt` before database persistence[cite: 1]. Bcrypt incorporates an adaptive cost factor and an automatic salt, providing robust defense against rainbow table attacks and brute-force cracking.
* **Unified Identifier Login:** To provide an intuitive user experience, the login handler matches a single input against both `username` and `email` fields (`WHERE username = ? OR email = ?`), reflecting modern authentication standards without exposing query distinctions on invalid credentials[cite: 1].
* **Extensible Role-Based Access Control (RBAC):** Rather than a restrictive boolean, user access levels are defined via numeric masks (`0xFFFF` / `65535` for Admin, `0x0001` / `1` for Basic User) stored in MySQL, facilitating straightforward future permission extensions[cite: 1].