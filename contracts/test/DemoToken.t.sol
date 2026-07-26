// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { DemoToken } from "../src/DemoToken.sol";

contract DemoTokenTest is Test {
    address private owner = makeAddr("owner");
    address private user = makeAddr("user");
    DemoToken private token;

    function setUp() external {
        token = new DemoToken("Ammora Test ETH", "aETH", 10 ether, owner);
    }

    function test_AnyoneCanClaimFixedFaucetAmount() external {
        vm.warp(10);
        vm.prank(user);
        token.claim();
        assertEq(token.balanceOf(user), 10 ether);
    }

    function test_ClaimEnforcesCooldown() external {
        vm.warp(10);
        vm.prank(user);
        token.claim();

        vm.expectRevert(
            abi.encodeWithSelector(DemoToken.FaucetCooldownActive.selector, 10 + 1 days)
        );
        vm.prank(user);
        token.claim();
    }

    function test_OwnerCanSeedLiquiditySupply() external {
        vm.prank(owner);
        token.mint(owner, 100 ether);
        assertEq(token.balanceOf(owner), 100 ether);
    }

    function test_NonOwnerCannotMint() external {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        vm.prank(user);
        token.mint(user, 100 ether);
    }
}
