import { build, emptyDir } from "@deno/dnt";
import { bgGreen } from "@std/fmt/colors";
import denoJson from "../deno.json" with { type: "json" };

const version = denoJson.version;
console.log(bgGreen(`version: ${version}`));

await emptyDir("./.npm");

const baseKeywords = [
  "openauth",
  "oauth",
  "oauth2",
  "social-login",
  "socialite",
  "passport",
  "arctic",
  "typescript",
];

const services = [
  {
    name: "apple",
    description: "Sign in with Apple OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "atlassian",
    description: "Atlassian OAuth 2.0 client - login flow and user profile",
    keywords: [],
  },
  {
    name: "discord",
    description: "Discord OAuth 2.0 client - login flow and user profile",
    keywords: [],
  },
  {
    name: "facebook",
    description: "Facebook OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "figma",
    description: "Figma OAuth 2.0 client - login flow and user profile",
    keywords: [],
  },
  {
    name: "github",
    description: "GitHub OAuth 2.0 client - login flow and user profile",
    keywords: [],
  },
  {
    name: "gitlab",
    description: "GitLab OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "google",
    description: "Google OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "kakao",
    description: "Kakao OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "line",
    description: "LINE OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "linkedin",
    description: "LinkedIn OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
  {
    name: "naver",
    description: "Naver OAuth 2.0 client - login flow and user profile",
    keywords: [],
  },
  {
    name: "slack",
    description: "Sign in with Slack OAuth 2.0 client - login flow and OIDC-verified user profile",
    keywords: ["oidc"],
  },
];

// Build core first
await build({
  entryPoints: ["./core/mod.ts"],
  outDir: "./.npm/core",
  shims: {
    deno: false,
  },
  test: false,
  compilerOptions: {
    lib: ["ES2021", "DOM", "DOM.Iterable"],
  },
  package: {
    name: "@openauth/core",
    version,
    description: "Minimal, typed OAuth 2.0 clients with verified OIDC id_tokens",
    keywords: ["core", "oidc", ...baseKeywords],
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/denostack/openauth.git",
    },
    bugs: {
      url: "https://github.com/denostack/openauth/issues",
    },
  },
  postBuild() {
    Deno.copyFileSync("LICENSE", ".npm/core/LICENSE");
    Deno.copyFileSync("README.md", ".npm/core/README.md");
  },
});

// Build services (skip npm install since @openauth/core is not yet published)
await Promise.all(
  services.map(({
    name,
    description,
    keywords,
  }) =>
    build({
      entryPoints: [`./${name}/mod.ts`],
      outDir: `./.npm/${name}`,
      shims: {
        deno: false,
      },
      test: false,
      skipNpmInstall: true,
      typeCheck: false,
      compilerOptions: {
        lib: ["ES2021", "DOM", "DOM.Iterable"],
      },
      mappings: {
        "./core/mod.ts": {
          name: "@openauth/core",
          version,
        },
      },
      package: {
        name: `@openauth/${name}`,
        version,
        description,
        keywords: [name, ...baseKeywords, ...keywords],
        license: "MIT",
        repository: {
          type: "git",
          url: "git+https://github.com/denostack/openauth.git",
        },
        bugs: {
          url: "https://github.com/denostack/openauth/issues",
        },
      },
      postBuild() {
        Deno.copyFileSync("LICENSE", `.npm/${name}/LICENSE`);
        Deno.copyFileSync(`${name}/README.md`, `.npm/${name}/README.md`);
      },
    })
  ),
);
