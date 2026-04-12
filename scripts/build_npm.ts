import { build, emptyDir } from "@deno/dnt";
import { bgGreen } from "@std/fmt/colors";
import denoJson from "../deno.json" with { type: "json" };

const version = denoJson.version;
console.log(bgGreen(`version: ${version}`));

await emptyDir("./.npm");

const commonKeywords = ["openauth", "oauth", "socialite", "passport", "typescript"];

const services = [
  { name: "github", description: "GitHub OAuth library" },
  { name: "google", description: "Google OAuth library" },
  { name: "facebook", description: "Facebook OAuth library" },
  { name: "kakao", description: "Kakao OAuth library" },
  { name: "naver", description: "Naver OAuth library" },
  { name: "line", description: "LINE OAuth library" },
  { name: "discord", description: "Discord OAuth library" },
  { name: "gitlab", description: "GitLab OAuth library" },
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
    description: "Core OAuth 2.0 library",
    keywords: ["core", ...commonKeywords],
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
  services.map(({ name, description }) =>
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
        keywords: [name, ...commonKeywords],
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
