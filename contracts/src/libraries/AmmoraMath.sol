// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

library AmmoraMath {
    uint256 internal constant BPS = 10_000;
    uint256 internal constant SWAP_FEE_BPS = 30;

    error InsufficientAmount();
    error InsufficientLiquidity();

    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }

    function sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) return 0;

        uint256 y = x;
        z = 1;
        if (y >= 0x100000000000000000000000000000000) {
            y >>= 128;
            z <<= 64;
        }
        if (y >= 0x10000000000000000) {
            y >>= 64;
            z <<= 32;
        }
        if (y >= 0x100000000) {
            y >>= 32;
            z <<= 16;
        }
        if (y >= 0x10000) {
            y >>= 16;
            z <<= 8;
        }
        if (y >= 0x100) {
            y >>= 8;
            z <<= 4;
        }
        if (y >= 0x10) {
            y >>= 4;
            z <<= 2;
        }
        if (y >= 0x8) z <<= 1;

        unchecked {
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            z = (z + x / z) >> 1;
            uint256 roundedDown = x / z;
            return z < roundedDown ? z : roundedDown;
        }
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB)
        internal
        pure
        returns (uint256 amountB)
    {
        if (amountA == 0) revert InsufficientAmount();
        if (reserveA == 0 || reserveB == 0) revert InsufficientLiquidity();
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert InsufficientAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();

        uint256 amountInWithFee = amountIn * (BPS - SWAP_FEE_BPS);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * BPS + amountInWithFee);
    }
}
