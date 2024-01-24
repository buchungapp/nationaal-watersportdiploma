#!/usr/bin/env node

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import * as programs from "./programs/index.js";
import { packageInfo } from "./utils/index.js";

await main();

async function main() {
  const program = yargs(hideBin(process.argv));

  programs.configureServerProgram(program);

  program.version(packageInfo.version!);
  program.demandCommand();

  await program.parseAsync();
}
