// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

import { Script, console2 } from "forge-std/Script.sol";
import { AmmoraFactory } from "../src/AmmoraFactory.sol";
import { AmmoraPair } from "../src/AmmoraPair.sol";
import { AmmoraRouter } from "../src/AmmoraRouter.sol";
import { DemoToken } from "../src/DemoToken.sol";

contract Deploy is Script {
    uint256 private constant AETH_MINT = 1_000 ether;
    uint256 private constant AUSD_MINT = 1_000_000 ether;
    uint256 private constant AETH_LIQUIDITY = 100 ether;
    uint256 private constant AUSD_LIQUIDITY = 258_000 ether;

    function run()
        external
        returns (
            AmmoraFactory factory,
            AmmoraRouter router,
            DemoToken aEth,
            DemoToken aUsd,
            AmmoraPair pair
        )
    {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer;
        if (deployerPrivateKey == 0) {
            deployer = vm.envAddress("DEPLOYER_ADDRESS");
            vm.startBroadcast();
        } else {
            deployer = vm.addr(deployerPrivateKey);
            vm.startBroadcast(deployerPrivateKey);
        }
        factory = new AmmoraFactory();
        router = new AmmoraRouter(address(factory));
        aEth = new DemoToken("Ammora Test ETH", "aETH", 10 ether, deployer);
        aUsd = new DemoToken("Ammora Test USD", "aUSD", 10_000 ether, deployer);

        aEth.mint(deployer, AETH_MINT);
        aUsd.mint(deployer, AUSD_MINT);
        aEth.approve(address(router), AETH_LIQUIDITY);
        aUsd.approve(address(router), AUSD_LIQUIDITY);
        router.addLiquidity(
            address(aEth),
            address(aUsd),
            AETH_LIQUIDITY,
            AUSD_LIQUIDITY,
            AETH_LIQUIDITY,
            AUSD_LIQUIDITY,
            deployer,
            block.timestamp + 20 minutes
        );
        pair = AmmoraPair(factory.getPair(address(aEth), address(aUsd)));
        vm.stopBroadcast();

        console2.log("AmmoraFactory", address(factory));
        console2.log("AmmoraRouter", address(router));
        console2.log("AmmoraPair", address(pair));
        console2.log("aETH", address(aEth));
        console2.log("aUSD", address(aUsd));
        console2.log("Initial LP owner", deployer);
    }
}
