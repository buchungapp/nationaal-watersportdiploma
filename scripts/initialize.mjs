#!/usr/bin/env node

import cp from 'child_process'
import path from 'path'

const options = { shell: true, stdio: 'inherit' }

cp.execFileSync(
  process.env.npm_execpath,
  [
    '--package',
    '@skiffa/generator@0.13.20',
    'dlx',
    'skiffa-generator',
    'package',
    path.resolve('specifications', 'api.yaml'),
    '--package-directory',
    path.resolve('generated', 'api'),
    '--package-name',
    '@nawadi/api',
    '--package-version',
    '0.0.0',
  ],
  options,
)

cp.execFileSync(
  process.env.npm_execpath,
  ['--filter', '@nawadi/api', 'install'],
  options,
)
cp.execFileSync(
  process.env.npm_execpath,
  ['--filter', '@nawadi/api', 'build'],
  options,
)
