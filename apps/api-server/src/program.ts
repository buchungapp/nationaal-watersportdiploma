import "./appsignal.js";

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import * as programs from "./programs/index.js";
import { packageInfo } from "./utils/index.js";

main();

async function main() {
  const program = yargs(hideBin(process.argv));

  programs.configureServerProgram(program);

  // biome-ignore lint/style/noNonNullAssertion: intentional
  program.version(packageInfo.version!);
  program.demandCommand();

  await program.parseAsync();
}
