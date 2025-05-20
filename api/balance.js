const { ethers } = require("ethers");

// —– CONFIG —–
const RPC_URL          = "https://rpc.soneium.org";
const CONTRACT_ADDRESS = "0xD1CAe16ec9eC34CE906F2C425B554042CA04Fa4E";
const DECIMALS         = 18;         // ERC-20 decimals

// Build day-thresholds: Day 1 → 10_000, Day 2 → 20_000, …, Day 10 → 100_000
const DAY_THRESHOLDS = Array.from({ length: 10 }, (_, i) => (i + 1) * 10_000);

// Minimal ABI for balanceOf
const ABI = ["function balanceOf(address) view returns (uint256)"];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

module.exports = async (req, res) => {
  const { address } = req.query;

  // 1) Validate input
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid or missing wallet address" });
  }

  try {
    // 2) Fetch balance once
    const raw = await contract.balanceOf(address);
    const balance = parseFloat(ethers.formatUnits(raw, DECIMALS));

    // 3) Check each day's threshold
    //    daysResult will be an object like { day1: true, day2: false, … }
    const daysResult = DAY_THRESHOLDS.reduce((acc, threshold, idx) => {
      const dayKey = `day${idx + 1}`;
      acc[dayKey] = balance >= threshold;
      return acc;
    }, {});

    // 4) Return
    return res.status(200).json({
      address,
      balance,
      days: daysResult
    });
  } catch (error) {
    return res.status(500).json({
      error: "On-chain query failed",
      details: error.message
    });
  }
};
