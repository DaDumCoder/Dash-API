const { ethers } = require("ethers");

// —– CONFIG —–
const RPC_URL            = "https://rpc.soneium.org";
const TOKEN_CONTRACT     = "0xD1CAe16ec9eC34CE906F2C425B554042CA04Fa4E";
const THRESHOLD_TOKENS   = 10_000;
const TOKEN_DECIMALS     = 18; // most ERC-20s use 18 decimals

// Minimal ERC-20 ABI just for balanceOf:
const ABI = ["function balanceOf(address) view returns (uint256)"];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const token    = new ethers.Contract(TOKEN_CONTRACT, ABI, provider);

module.exports = async function handler(req, res) {
  const { address } = req.query;

  // 1) Validate
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid or missing wallet address" });
  }

  try {
    // 2) Fetch on-chain balance
    const raw = await token.balanceOf(address);
    const balance = parseFloat(ethers.formatUnits(raw, TOKEN_DECIMALS));

    // 3) Check threshold
    const meetsThreshold = balance >= THRESHOLD_TOKENS;

    // 4) Return simple JSON
    return res.status(200).json({
      address,
      balance,              // e.g. 12345.6789
      meetsThreshold        // true or false
    });
  } catch (err) {
    return res.status(500).json({
      error: "On-chain query failed",
      details: err.message
    });
  }
};
