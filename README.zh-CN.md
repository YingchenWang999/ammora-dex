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
- 专业 DEX 数据面板，包含资金池指标、可搜索的代币选择器、交易设置、路径预览，以及带 BaseScan 链接的本次会话交易记录
- 独立的资金池、资产和交易记录工作区，并适配桌面与移动端
- 支持英文与简体中文界面，并记住用户的语言选择

24 小时交易量、手续费和 APR 等依赖历史索引的数据，在接入索引服务前会明确显示为不可用；界面不会虚构分析数据。

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
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export BASESCAN_API_KEY=your_basescan_key
pnpm contract:deploy:base-sepolia -- --account ammora-deployer --sender "$DEPLOYER_ADDRESS"
```

`PRIVATE_KEY` 仍可作为自动化测试网部署时的本地备用方案。不要把私钥粘贴到聊天中、提交到 Git，或写入任何以 `VITE_` 开头的变量。

部署脚本会按顺序完成全部初始化：部署 Factory、Router、aETH、aUSD，创建交易对并加入初始流动性。部署完成后，将日志输出的五个地址复制到 `.env.local`，然后再次运行 `pnpm check`。

## 部署模式

合约将部署并验证到 Base Sepolia，静态前端将部署到 Vercel。合约地址通过环境变量和共享的 `@ammora/contract-config` 包传入，因此不需要单独购买应用服务器或数据库。

## 当前状态

作品集测试网范围内的功能实现已经完成。本地端到端验证覆盖合约部署、测试币领取、兑换、添加流动性和移除流动性。Base Sepolia 公共地址和 Vercel 链接会在部署凭据与外部项目配置完成后补充。
