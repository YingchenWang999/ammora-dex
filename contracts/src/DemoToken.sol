// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title DemoToken
/// @notice Base Sepolia-only asset with a rate-limited public faucet.
contract DemoToken is ERC20, Ownable {
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    uint256 public immutable faucetAmount;

    mapping(address account => uint256 timestamp) public lastClaimAt;

    error FaucetCooldownActive(uint256 availableAt);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 faucetAmount_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        faucetAmount = faucetAmount_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function claim() external {
        uint256 lastClaim = lastClaimAt[msg.sender];
        // A small timestamp drift cannot bypass a day-long, testnet-only faucet cooldown.
        // slither-disable-start timestamp
        // forge-lint: disable-next-line(block-timestamp)
        if (lastClaim != 0 && block.timestamp < lastClaim + FAUCET_COOLDOWN) {
            revert FaucetCooldownActive(lastClaim + FAUCET_COOLDOWN);
        }
        // slither-disable-end timestamp

        lastClaimAt[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }
}
