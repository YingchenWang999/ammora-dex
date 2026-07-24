// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import { StdInvariant } from "forge-std/StdInvariant.sol";
import { Test } from "forge-std/Test.sol";
import { AmmoraFactory } from "../src/AmmoraFactory.sol";
import { AmmoraPair } from "../src/AmmoraPair.sol";
import { AmmoraRouter } from "../src/AmmoraRouter.sol";
import { MockERC20 } from "../src/MockERC20.sol";

contract SwapHandler is Test {
    AmmoraRouter private immutable router;
    MockERC20 private immutable tokenA;
    MockERC20 private immutable tokenB;

    constructor(AmmoraRouter router_, MockERC20 tokenA_, MockERC20 tokenB_) {
        router = router_;
        tokenA = tokenA_;
        tokenB = tokenB_;
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
    }

    function swapAForB(uint96 rawAmountIn) external {
        _swap(tokenA, tokenB, bound(uint256(rawAmountIn), 1e12, 10 ether));
    }

    function swapBForA(uint96 rawAmountIn) external {
        _swap(tokenB, tokenA, bound(uint256(rawAmountIn), 1e12, 10 ether));
    }

    function _swap(MockERC20 tokenIn, MockERC20 tokenOut, uint256 amountIn) private {
        tokenIn.mint(address(this), amountIn);
        address[] memory path = new address[](2);
        path[0] = address(tokenIn);
        path[1] = address(tokenOut);
        router.swapExactTokensForTokens(amountIn, 0, path, address(this), block.timestamp);
    }
}

contract AmmoraInvariantTest is StdInvariant, Test {
    AmmoraPair private pair;
    uint256 private initialK;

    function setUp() external {
        MockERC20 tokenA = new MockERC20("Ammora USD", "aUSD");
        MockERC20 tokenB = new MockERC20("Ammora ETH", "aETH");
        AmmoraFactory factory = new AmmoraFactory();
        AmmoraRouter router = new AmmoraRouter(address(factory));

        tokenA.mint(address(this), 1_000 ether);
        tokenB.mint(address(this), 1_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            1_000 ether,
            1_000 ether,
            1_000 ether,
            1_000 ether,
            address(this),
            block.timestamp
        );

        pair = AmmoraPair(factory.getPair(address(tokenA), address(tokenB)));
        (uint112 reserve0, uint112 reserve1) = pair.getReserves();
        initialK = uint256(reserve0) * uint256(reserve1);

        SwapHandler handler = new SwapHandler(router, tokenA, tokenB);
        targetContract(address(handler));
    }

    function invariant_ConstantProductNeverFallsBelowInitialK() external view {
        (uint112 reserve0, uint112 reserve1) = pair.getReserves();
        assertGe(uint256(reserve0) * uint256(reserve1), initialK);
    }

    function invariant_ReservesMatchTokenBalances() external view {
        (uint112 reserve0, uint112 reserve1) = pair.getReserves();
        assertEq(reserve0, MockERC20(pair.token0()).balanceOf(address(pair)));
        assertEq(reserve1, MockERC20(pair.token1()).balanceOf(address(pair)));
    }
}
