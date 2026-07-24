// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import { Script, console2 } from "forge-std/Script.sol";
import { AmmoraFactory } from "../src/AmmoraFactory.sol";
import { AmmoraRouter } from "../src/AmmoraRouter.sol";

contract Deploy is Script {
    function run() external returns (AmmoraFactory factory, AmmoraRouter router) {
        vm.startBroadcast();
        factory = new AmmoraFactory();
        router = new AmmoraRouter(address(factory));
        vm.stopBroadcast();

        console2.log("AmmoraFactory", address(factory));
        console2.log("AmmoraRouter", address(router));
    }
}
