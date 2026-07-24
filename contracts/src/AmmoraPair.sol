// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { AmmoraMath } from "./libraries/AmmoraMath.sol";

/// @title AmmoraPair
/// @notice Constant-product liquidity pool for exactly two ERC-20 assets.
/// @dev Educational testnet implementation. Fee-on-transfer and rebasing tokens are unsupported.
contract AmmoraPair is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_LIQUIDITY = 1_000;
    uint256 private constant BPS = 10_000;
    uint256 private constant SWAP_FEE_BPS = 30;

    address public immutable factory;
    address public immutable token0;
    address public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    error IdenticalTokens();
    error ZeroAddress();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientOutputAmount();
    error InsufficientLiquidity();
    error InvalidRecipient();
    error InsufficientInputAmount();
    error InvariantViolation();
    error ReserveOverflow();

    constructor(address tokenA, address tokenB) ERC20("Ammora LP", "AMM-LP") {
        if (tokenA == tokenB) revert IdenticalTokens();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();

        factory = msg.sender;
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }

    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        if (to == address(0)) revert ZeroAddress();

        (uint112 _reserve0, uint112 _reserve1) = (reserve0, reserve1);
        (uint256 balance0, uint256 balance1) = _balances();
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;
        uint256 supply = totalSupply();

        // Exact zero selects the one-time pool-initialization branch.
        // slither-disable-next-line incorrect-equality
        if (supply == 0) {
            uint256 rootK = AmmoraMath.sqrt(amount0 * amount1);
            if (rootK <= MINIMUM_LIQUIDITY) revert InsufficientLiquidityMinted();
            liquidity = rootK - MINIMUM_LIQUIDITY;
            _mint(address(1), MINIMUM_LIQUIDITY);
        } else {
            liquidity =
                AmmoraMath.min((amount0 * supply) / _reserve0, (amount1 * supply) / _reserve1);
            // A rounded LP share of exactly zero must not be minted.
            // slither-disable-next-line incorrect-equality
            if (liquidity == 0) revert InsufficientLiquidityMinted();
        }

        _mint(to, liquidity);
        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1, to);
    }

    /// @notice Burns LP tokens transferred to this pair and returns the underlying assets.
    function burn(address to) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        if (to == address(0) || to == token0 || to == token1) revert InvalidRecipient();

        (uint256 balance0, uint256 balance1) = _balances();
        uint256 liquidity = balanceOf(address(this));
        uint256 supply = totalSupply();

        amount0 = (liquidity * balance0) / supply;
        amount1 = (liquidity * balance1) / supply;
        // Burning must return a non-zero amount of both pool assets.
        // slither-disable-next-line incorrect-equality
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();

        _burn(address(this), liquidity);
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        (balance0, balance1) = _balances();
        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /// @notice Executes an exact-output swap after the caller has transferred input tokens in.
    function swap(uint256 amount0Out, uint256 amount1Out, address to) external nonReentrant {
        if (amount0Out == 0 && amount1Out == 0) revert InsufficientOutputAmount();
        (uint112 _reserve0, uint112 _reserve1) = (reserve0, reserve1);
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1) revert InsufficientLiquidity();
        if (to == address(0) || to == token0 || to == token1) revert InvalidRecipient();

        if (amount0Out > 0) IERC20(token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).safeTransfer(to, amount1Out);

        (uint256 balance0, uint256 balance1) = _balances();
        uint256 amount0In =
            balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In =
            balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        // A swap is invalid only when neither asset entered the pair.
        // slither-disable-next-line incorrect-equality
        if (amount0In == 0 && amount1In == 0) revert InsufficientInputAmount();

        uint256 balance0Adjusted = balance0 * BPS - amount0In * SWAP_FEE_BPS;
        uint256 balance1Adjusted = balance1 * BPS - amount1In * SWAP_FEE_BPS;
        if (
            balance0Adjusted * balance1Adjusted
                < uint256(_reserve0) * uint256(_reserve1) * BPS * BPS
        ) revert InvariantViolation();

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function sync() external nonReentrant {
        (uint256 balance0, uint256 balance1) = _balances();
        _update(balance0, balance1);
    }

    function _balances() private view returns (uint256 balance0, uint256 balance1) {
        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
    }

    function _update(uint256 balance0, uint256 balance1) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max) revert ReserveOverflow();
        // The explicit upper-bound check above makes both narrowing casts safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        reserve0 = uint112(balance0);
        // forge-lint: disable-next-line(unsafe-typecast)
        reserve1 = uint112(balance1);
        emit Sync(reserve0, reserve1);
    }
}
