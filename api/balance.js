const { ethers } = require("ethers");

const TOKEN_CONTRACT_ADDRESS = "0xD1CAe16ec9eC34CE906F2C425B554042CA04Fa4E";
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

module.exports = async (req, res) => {
  const wallet = req.query.wallet;
  const RPC_URL = process.env.RPC_URL;

  if (!wallet) {
    return res.status(400).json({ error: "Missing wallet address" });
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, ERC20_ABI, provider);

    const [balanceRaw, decimals, symbol] = await Promise.all([
      contract.balanceOf(wallet),
      contract.decimals(),
      contract.symbol()
    ]);

    const balance = ethers.utils.formatUnits(balanceRaw, decimals);

    res.status(200).json({
      chain: "Soneium Mainnet",
      wallet,
      token: TOKEN_CONTRACT_ADDRESS,
      symbol,
      balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
