#!/usr/bin/env bash
set -euo pipefail

contracts_dir="$(cd "$(dirname "$0")/.." && pwd)"
repo_dir="$(cd "$contracts_dir/.." && pwd)"

# Load only the deployment variables we own. This avoids executing arbitrary shell code from
# .env.local while still keeping credentials out of command history and Git.
if [[ -f "$repo_dir/.env.local" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    name="${line%%=*}"
    value="${line#*=}"
    case "$name" in
      BASE_SEPOLIA_RPC_URL|BASESCAN_API_KEY|DEPLOYER_ADDRESS|PRIVATE_KEY)
        if [[ -z "${!name:-}" ]]; then
          export "$name=$value"
        fi
        ;;
    esac
  done < "$repo_dir/.env.local"
fi

export BASE_SEPOLIA_RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
: "${BASESCAN_API_KEY:?Add BASESCAN_API_KEY to .env.local or the shell environment}"
: "${DEPLOYER_ADDRESS:?Set DEPLOYER_ADDRESS to the encrypted keystore address}"

(
  cd "$contracts_dir"
  forge script \
    "script/Deploy.s.sol:Deploy" \
    --rpc-url base_sepolia \
    --broadcast \
    --slow \
    --verify \
    --verifier etherscan \
    --etherscan-api-key "$BASESCAN_API_KEY" \
    -vvvv \
    "$@"
)
