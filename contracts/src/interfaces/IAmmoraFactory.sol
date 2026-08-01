// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
pragma solidity 0.8.36;

interface IAmmoraFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 count);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}
