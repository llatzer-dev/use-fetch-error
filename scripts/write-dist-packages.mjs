// Marks each build folder so Node and TypeScript know which module system it uses.
import { writeFileSync } from "node:fs";

writeFileSync("dist/esm/package.json", JSON.stringify({ type: "module" }) + "\n");
writeFileSync("dist/cjs/package.json", JSON.stringify({ type: "commonjs" }) + "\n");
