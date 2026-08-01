// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

import { Test } from "forge-std/Test.sol";
import { AmmoraFactory } from "../src/AmmoraFactory.sol";
import { AmmoraPair } from "../src/AmmoraPair.sol";
import { AmmoraRouter } from "../src/AmmoraRouter.sol";
import { MockERC20 } from "../src/MockERC20.sol";

contract AmmoraRouterTest is Test {
    uint256 private constant INITIAL_BALANCE = 10_000 ether;
    uint256 private constant INITIAL_LIQUIDITY = 1_000 ether;

    address private liquidityProvider = makeAddr("liquidityProvider");
    address private trader = makeAddr("trader");

    MockERC20 private tokenA;
    MockERC20 private tokenB;
    AmmoraFactory private factory;
    AmmoraRouter private router;
    AmmoraPair private pair;

    function setUp() external {
        tokenA = new MockERC20("Ammora USD", "aUSD");
        tokenB = new MockERC20("Ammora ETH", "aETH");
        factory = new AmmoraFactory();
        router = new AmmoraRouter(address(factory));

        tokenA.mint(liquidityProvider, INITIAL_BALANCE);
        tokenB.mint(liquidityProvider, INITIAL_BALANCE);
        tokenA.mint(trader, INITIAL_BALANCE);
        tokenB.mint(trader, INITIAL_BALANCE);

        vm.startPrank(liquidityProvider);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            INITIAL_LIQUIDITY,
            INITIAL_LIQUIDITY,
            INITIAL_LIQUIDITY,
            INITIAL_LIQUIDITY,
            liquidityProvider,
            block.timestamp
        );
        vm.stopPrank();

        pair = AmmoraPair(factory.getPair(address(tokenA), address(tokenB)));
    }

    function test_CreatePairStoresBothDirections() external view {
        assertTrue(address(pair) != address(0));
        assertEq(factory.getPair(address(tokenB), address(tokenA)), address(pair));
        assertEq(factory.allPairsLength(), 1);
    }

    function test_RevertWhenPairAlreadyExists() external {
        vm.expectRevert(AmmoraFactory.PairExists.selector);
        factory.createPair(address(tokenA), address(tokenB));
    }

    function test_RevertWhenPairTokensAreIdentical() external {
        vm.expectRevert(AmmoraFactory.IdenticalTokens.selector);
        factory.createPair(address(tokenA), address(tokenA));
    }

    function test_InitialLiquidityLocksMinimumShares() external view {
        assertEq(pair.balanceOf(address(1)), pair.MINIMUM_LIQUIDITY());
        assertGt(pair.balanceOf(liquidityProvider), 0);
        assertEq(pair.totalSupply(), INITIAL_LIQUIDITY);
    }

    function test_SwapExactTokensForTokens() external {
        uint256 amountIn = 10 ether;
        uint256 expectedOut = router.getAmountOut(amountIn, address(tokenA), address(tokenB));
        uint256 balanceBefore = tokenB.balanceOf(trader);
        address[] memory path = _path(address(tokenA), address(tokenB));

        vm.startPrank(trader);
        tokenA.approve(address(router), amountIn);
        uint256 amountOut =
            router.swapExactTokensForTokens(amountIn, expectedOut, path, trader, block.timestamp);
        vm.stopPrank();

        assertEq(amountOut, expectedOut);
        assertEq(tokenB.balanceOf(trader) - balanceBefore, expectedOut);
    }

    function test_RemoveLiquidityReturnsUnderlyingAssets() external {
        uint256 liquidity = pair.balanceOf(liquidityProvider) / 2;
        uint256 tokenABefore = tokenA.balanceOf(liquidityProvider);
        uint256 tokenBBefore = tokenB.balanceOf(liquidityProvider);

        vm.startPrank(liquidityProvider);
        pair.approve(address(router), liquidity);
        (uint256 amountA, uint256 amountB) = router.removeLiquidity(
            address(tokenA), address(tokenB), liquidity, 1, 1, liquidityProvider, block.timestamp
        );
        vm.stopPrank();

        assertEq(tokenA.balanceOf(liquidityProvider) - tokenABefore, amountA);
        assertEq(tokenB.balanceOf(liquidityProvider) - tokenBBefore, amountB);
        assertGt(amountA, 0);
        assertGt(amountB, 0);
    }

    function test_AddLiquidityUsesOptimalPoolRatio() external {
        (uint112 reserve0Before, uint112 reserve1Before) = pair.getReserves();

        vm.startPrank(liquidityProvider);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            100 ether,
            50 ether,
            50 ether,
            50 ether,
            liquidityProvider,
            block.timestamp
        );
        vm.stopPrank();

        (uint112 reserve0After, uint112 reserve1After) = pair.getReserves();
        assertEq(uint256(reserve0After) - reserve0Before, 50 ether);
        assertEq(uint256(reserve1After) - reserve1Before, 50 ether);
    }

    function test_RevertWhenDeadlineExpired() external {
        address[] memory path = _path(address(tokenA), address(tokenB));
        vm.expectRevert(AmmoraRouter.Expired.selector);
        vm.prank(trader);
        router.swapExactTokensForTokens(1 ether, 0, path, trader, block.timestamp - 1);
    }

    function test_RevertWhenSwapMinimumCannotBeMet() external {
        uint256 amountIn = 1 ether;
        uint256 quoted = router.getAmountOut(amountIn, address(tokenA), address(tokenB));
        address[] memory path = _path(address(tokenA), address(tokenB));

        vm.startPrank(trader);
        tokenA.approve(address(router), amountIn);
        vm.expectRevert(AmmoraRouter.InsufficientOutputAmount.selector);
        router.swapExactTokensForTokens(amountIn, quoted + 1, path, trader, block.timestamp);
        vm.stopPrank();
    }

    function test_RevertWhenSwapPathIsInvalid() external {
        address[] memory path = _path(address(tokenA), address(tokenA));
        vm.expectRevert(AmmoraRouter.InvalidPath.selector);
        vm.prank(trader);
        router.swapExactTokensForTokens(1 ether, 0, path, trader, block.timestamp);
    }

    function test_RevertWhenLiquidityMinimumCannotBeMet() external {
        vm.startPrank(liquidityProvider);
        vm.expectRevert(AmmoraRouter.InsufficientAmountA.selector);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            1 ether,
            1 ether,
            2 ether,
            1 ether,
            liquidityProvider,
            block.timestamp
        );
        vm.stopPrank();
    }

    function testFuzz_SwapPreservesOrIncreasesK(uint96 rawAmountIn) external {
        uint256 amountIn = bound(uint256(rawAmountIn), 1e12, 100 ether);
        (uint112 reserve0Before, uint112 reserve1Before) = pair.getReserves();
        uint256 kBefore = uint256(reserve0Before) * uint256(reserve1Before);
        address[] memory path = _path(address(tokenA), address(tokenB));

        vm.startPrank(trader);
        tokenA.approve(address(router), amountIn);
        router.swapExactTokensForTokens(amountIn, 0, path, trader, block.timestamp);
        vm.stopPrank();

        (uint112 reserve0After, uint112 reserve1After) = pair.getReserves();
        assertGe(uint256(reserve0After) * uint256(reserve1After), kBefore);
    }

    function _path(address tokenIn, address tokenOut) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
    }
}
