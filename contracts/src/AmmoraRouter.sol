// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IAmmoraFactory } from "./interfaces/IAmmoraFactory.sol";
import { IAmmoraPair } from "./interfaces/IAmmoraPair.sol";
import { AmmoraMath } from "./libraries/AmmoraMath.sol";

/// @title AmmoraRouter
/// @notice User-facing liquidity and single-hop swap operations.
contract AmmoraRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable factory;

    error ZeroAddress();
    error Expired();
    error PairMissing();
    error InvalidPath();
    error InsufficientAmountA();
    error InsufficientAmountB();
    error InsufficientOutputAmount();

    modifier ensure(uint256 deadline) {
        // Deadlines intentionally use the current block time; small validator drift cannot bypass
        // a user-supplied expiry in a way that affects the swap invariant.
        // forge-lint: disable-next-line(block-timestamp)
        if (deadline < block.timestamp) revert Expired();
        _;
    }

    constructor(address factory_) {
        if (factory_ == address(0)) revert ZeroAddress();
        factory = factory_;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        nonReentrant
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        if (to == address(0)) revert ZeroAddress();
        address pair = IAmmoraFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) pair = IAmmoraFactory(factory).createPair(tokenA, tokenB);

        (amountA, amountB) = _calculateLiquidityAmounts(
            pair, tokenA, amountADesired, amountBDesired, amountAMin, amountBMin
        );
        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        liquidity = IAmmoraPair(pair).mint(to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        if (to == address(0)) revert ZeroAddress();
        address pair = IAmmoraFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairMissing();

        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = IAmmoraPair(pair).burn(to);
        (amountA, amountB) =
            tokenA == IAmmoraPair(pair).token0() ? (amount0, amount1) : (amount1, amount0);
        if (amountA < amountAMin) revert InsufficientAmountA();
        if (amountB < amountBMin) revert InsufficientAmountB();
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountOut) {
        if (path.length != 2 || path[0] == path[1]) revert InvalidPath();
        if (to == address(0)) revert ZeroAddress();

        address pair = IAmmoraFactory(factory).getPair(path[0], path[1]);
        if (pair == address(0)) revert PairMissing();

        (uint256 reserveIn, uint256 reserveOut) = _orderedReserves(pair, path[0]);
        amountOut = AmmoraMath.getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < amountOutMin) revert InsufficientOutputAmount();

        IERC20(path[0]).safeTransferFrom(msg.sender, pair, amountIn);
        bool zeroForOne = path[0] == IAmmoraPair(pair).token0();
        IAmmoraPair(pair).swap(zeroForOne ? 0 : amountOut, zeroForOne ? amountOut : 0, to);
    }

    function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut)
        external
        view
        returns (uint256 amountOut)
    {
        address pair = IAmmoraFactory(factory).getPair(tokenIn, tokenOut);
        if (pair == address(0)) revert PairMissing();
        (uint256 reserveIn, uint256 reserveOut) = _orderedReserves(pair, tokenIn);
        amountOut = AmmoraMath.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function _calculateLiquidityAmounts(
        address pair,
        address tokenA,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private view returns (uint256 amountA, uint256 amountB) {
        (uint256 reserveA, uint256 reserveB) = _orderedReserves(pair, tokenA);
        if (reserveA == 0 && reserveB == 0) {
            if (amountADesired < amountAMin) revert InsufficientAmountA();
            if (amountBDesired < amountBMin) revert InsufficientAmountB();
            return (amountADesired, amountBDesired);
        }

        uint256 amountBOptimal = AmmoraMath.quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            if (amountADesired < amountAMin) revert InsufficientAmountA();
            if (amountBOptimal < amountBMin) revert InsufficientAmountB();
            return (amountADesired, amountBOptimal);
        }

        uint256 amountAOptimal = AmmoraMath.quote(amountBDesired, reserveB, reserveA);
        if (amountAOptimal < amountAMin) revert InsufficientAmountA();
        if (amountBDesired < amountBMin) revert InsufficientAmountB();
        return (amountAOptimal, amountBDesired);
    }

    function _orderedReserves(address pair, address tokenA)
        private
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (uint112 reserve0, uint112 reserve1) = IAmmoraPair(pair).getReserves();
        (reserveA, reserveB) =
            tokenA == IAmmoraPair(pair).token0() ? (reserve0, reserve1) : (reserve1, reserve0);
    }
}
