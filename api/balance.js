const { ethers } = require("ethers");

// Connect to the Soneium RPC endpoint
const RPC_URL = "https://rpc.soneium.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Smart contract addresses for different point types
const contractMap = {
  claimedpoints: "0xD1CAe16ec9eC34CE906F2C425B554042CA04Fa4E",
};

// Thresholds to determine if a user has completed a task
const completionThresholds = {
  claimedpoint: 10000,
};

// Minimal ABI to call balanceOf on ERC-20 contracts
const ABI = ["function balanceOf(address) view returns (uint256)"];

// Main API handler function
module.exports = async (req, res) => {
  const { address } = req.query;

// Validate the wallet address
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  const rawBalances = {};  // Stores raw balances without transformation
  const data = {};         // Final formatted data to return
  let totalPoints = 0;     // Will hold the calculated total with multiplier

// Fetch balance from each contract
  for (const [key, contractAddress] of Object.entries(contractMap)) {
    try {
      const contract = new ethers.Contract(contractAddress, ABI, provider);
      const balanceBN = await contract.balanceOf(address); // Get raw balance (BigNumber)
      const balance = parseFloat(ethers.formatUnits(balanceBN, 18)); // Convert to decimal

      rawBalances[key] = balance; // Save for later multiplier math

      const threshold = completionThresholds[key];
      const completed = typeof threshold === "number" ? balance > threshold : null;

      data[key] = {
        balance,      // Original balance
        completed     // Completion status based on threshold
      };
    } catch (error) {
      data[key] = {
        balance: null,
        completed: false,
        error: error.message
      };
    }
  }

  // Apply multiplier
  const claimedPoints = rawBalances.claimedpoints || 0;

  const totalCalculatedPoints = claimedPoints;

  // Override claimedpoints balance to show total
  if (data.claimedpoints) {
    data.claimedpoints.balance = parseFloat(totalCalculatedPoints.toFixed(2));
  }

  res.status(200).json({
    wallet: address,
    data,
    totalPoints: parseFloat(totalCalculatedPoints.toFixed(2))
  });
};
