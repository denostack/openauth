import { build, emptyDir } from "@deno/dnt";
import { bgGreen } from "@std/fmt/colors";
import denoJson from "../deno.json" with { type: "json" };

const version = denoJson.version;
console.log(bgGreen(`version: ${version}`));

await emptyDir("./.npm");

const services = [
  {
    name: "github",
    description: "GitHub OAuth library",
    keywords: [
      "github",
      "openauth",
      "oauth",
      "socialite",
      "passport",
      "typescript",
    ],
  },
  {
    name: "google",
    description: "Google OAuth library",
    keywords: [
      "google",
      "openauth",
      "oauth",
      "socialite",
      "passport",
      "typescript",
    ],
  },
  {
    name: "facebook",
    description: "Facebook OAuth library",
    keywords: [
      "facebook",
      "openauth",
      "oauth",
      "socialite",
      "passport",
      "typescript",
    ],
  },
  {
    name: "kakao",
    description: "Kakao OAuth library",
    keywords: [
      "kakao",
      "openauth",
      "oauth",
      "socialite",
      "passport",
      "typescript",
    ],
  },
  {
    name: "naver",
    description: "Naver OAuth library",
    keywords: [
      "naver",
      "openauth",
      "oauth",
      "socialite",
      "passport",
      "typescript",
    ],
  },
];

await Promise.all(services.map(({ name, description, keywords }) =>
  build({
    entryPoints: [`./${name}/mod.ts`],
    outDir: `./.npm/${name}`,
    shims: {
      deno: false,
    },
    test: false,
    compilerOptions: {
      lib: ["ES2021", "DOM"],
    },
    package: {
      name: `@openauth/${name}`,
      version,
      description,
      keywords,
      license: "MIT",
      repository: {
        type: "git",
        url: "git+https://github.com/denostack/openauth.git",
      },
      bugs: {
        url: "https://github.com/denostack/openauth/issues",
      },
    },
  })
));
