# Ammora DEX

[English](README.md) | [简体中文](README.zh-CN.md)

Ammora 是一个面向 Base Sepolia 测试网的恒定乘积自动做市商。该仓库是一套完整的作品集项目，包含创建交易对、提供流动性和兑换 ERC-20 资产所需的协议、测试与前端交互层。

> **安全提示：** Ammora 尚未经过专业安全审计，不应部署到主网，也不得用于任何有实际价值的资产。

## 仓库结构

```text
ammora-dex/
├── apps/web/                 React、Vite、Reown AppKit、Wagmi 和 Viem 前端
├── contracts/                Solidity 合约、Foundry 测试与部署脚本
├── packages/contract-config/ 共享的网络配置与合约地址
└── .github/workflows/        构建、测试与安全检查
```

## 协议范围

- 类似 Uniswap V2 的 `x * y = k` 恒定乘积资金池
- 无需许可的交易对创建
- 以 LP 份额表示按比例拥有的资金池权益
- 由流动性提供者获得的 0.30% 兑换手续费
- 初版 Router 支持精确输入的单跳兑换
- 滑点保护与交易截止时间保护
- 带领取频率限制的 aETH 和 aUSD 测试币水龙头
- Foundry 单元测试、模糊测试和不变量测试
- React 界面展示实时兑换、流动性和钱包仓位状态
- 专业 DEX 数据面板，包含资金池指标、可搜索的代币选择器、交易设置、路径预览，以及带 BaseScan 链接的钱包真实链上记录
- 独立的资金池、资产和交易记录工作区，并适配桌面与移动端
- 支持英文与简体中文界面，并记住用户的语言选择
- 在多个 Base Sepolia RPC 节点间自动重试和切换

数据面板会从 Base Sepolia 部署区块（`44638802`）直接读取 Pair 的
`Swap`、`Mint` 和 `Burn` 事件，在浏览器中计算真实的滚动 24 小时交易量、
0.30% 手续费和年化 LP APR 预估。钱包记录也会根据 Pair 与测试币事件还原，
不需要服务器、数据库或第三方索引服务。

首个版本暂不支持转账扣费代币、Rebase 代币、闪电兑换、多跳路由和主网部署。

## 技术栈

- Solidity 0.8.36、Foundry 1.7、OpenZeppelin Contracts 5.6
- React 18.3、TypeScript 5.9、Vite 7
- Reown AppKit、Wagmi 3、Viem 2、TanStack Query 5
- pnpm Workspace、SCSS、GitHub Actions

## 本地开发

环境要求：Node.js 24 LTS、pnpm 11 和 Foundry。

```bash
cp .env.example .env.local
pnpm install
pnpm check
pnpm dev
```

只运行合约测试：

```bash
pnpm contract:test
```

前端从仓库根目录的 `.env.local` 读取部署配置。五个合约地址用于启用实时资金池读取；Reown Project ID 则单独用于启用钱包连接和链上交易。

## Base Sepolia 部署

请使用一个专门用于 Base Sepolia 且已准备测试币的部署钱包。推荐使用加密的 Foundry Keystore，这样私钥不会进入项目文件或 Shell 历史记录。

```bash
cast wallet import ammora-deployer
export DEPLOYER_ADDRESS=$(cast wallet address --account ammora-deployer)
pnpm contract:deploy:base-sepolia --account ammora-deployer --sender "$DEPLOYER_ADDRESS"
```

部署命令会从已被 Git 忽略的根目录 `.env.local` 读取
`BASE_SEPOLIA_RPC_URL` 和 `BASESCAN_API_KEY`，检查必需配置，并将 BaseScan Key
明确传给 Foundry 的 Etherscan 验证器；如果 Shell 中已设置同名变量，则优先使用 Shell 值。

`PRIVATE_KEY` 仍可作为自动化测试网部署时的本地备用方案。不要把私钥粘贴到聊天中、提交到 Git，或写入任何以 `VITE_` 开头的变量。

部署脚本会按顺序完成全部初始化：部署 Factory、Router、aETH、aUSD，创建交易对并加入初始流动性。部署完成后，将日志输出的五个地址复制到 `.env.local`，然后再次运行 `pnpm check`。

## 部署模式

合约已经部署并验证到 Base Sepolia，静态前端部署到 Vercel。合约地址通过环境变量和共享的 `@ammora/contract-config` 包传入，因此不需要单独购买应用服务器或数据库。

## 当前状态

作品集测试网范围内的功能实现已经完成。本地端到端验证覆盖合约部署、测试币领取、兑换、添加流动性和移除流动性。Base Sepolia 部署已经上线，源码也已在 BaseScan 验证：

- Factory：[`0xF152...c52c`](https://sepolia.basescan.org/address/0xF152af7227C16C3D0C06a52d0DAD088B743Fc52c#code)
- Router：[`0xE3a1...E3E`](https://sepolia.basescan.org/address/0xE3a139469EBCE01E733718Be6faEA5b050CfdE3E#code)
- Pair：[`0x22a9...Ed44`](https://sepolia.basescan.org/address/0x22a9b9bEa81Ff0D23a2844A82AFEd5732c18Ed44#code)
- aETH：[`0xc144...AD33`](https://sepolia.basescan.org/address/0xc14423d1075815938d088738E824C9FcdC98AD33#code)
- aUSD：[`0x3202...0FD3`](https://sepolia.basescan.org/address/0x32029b9294D0ce36Ef1c3398dED7Bb28F04C0FD3#code)
- 正式站点：[ammora-dex.vercel.app](https://ammora-dex.vercel.app)
