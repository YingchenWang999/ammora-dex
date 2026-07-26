#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for target in src/AmmoraFactory.sol src/AmmoraPair.sol src/AmmoraRouter.sol src/DemoToken.sol; do
  slither "$target" --compile-force-framework solc --config-file slither.config.json
done
