const { ethers } = require("ethers");

// Connect to the Soneium RPC endpoint
const RPC_URL = "https://rpc.soneium.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Smart contract address
const contractMap = {
  claimedpoints: "0xD1CAe16ec9eC34CE906F2C425B554042CA04Fa4E",
};

// Completion threshold
const completionThresholds = {
  claimedpoints: 10000, // ✅ FIXED key name
};

// Minimal ABI
const ABI = ["function balanceOf(address) view returns (uint256)"];

module.exports = async (req, res) => {
  const { address } = req.query;

  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  const rawBalances = {};
  const data = {};
  let totalPoints = 0;

  for (const [key, contractAddress] of Object.entries(contractMap)) {
    try {
      const contract = new ethers.Contract(contractAddress, ABI, provider);
      const balanceBN = await contract.balanceOf(address);
      const balance = parseFloat(ethers.formatUnits(balanceBN, 18));

      rawBalances[key] = balance;

      const threshold = completionThresholds[key];
      const completed = typeof threshold === "number" ? balance > threshold : null;

      data[key] = {
        balance,
        completed
      };
    } catch (error) {
      data[key] = {
        balance: null,
        completed: false,
        error: error.message
      };
    }
  }

  const claimedPoints = rawBalances.claimedpoints || 0;
  const totalCalculatedPoints = claimedPoints;

  if (data.claimedpoints) {
    data.claimedpoints.balance = parseFloat(totalCalculatedPoints.toFixed(2));
  }

  // ✅ Add chain info
  let chainId = null;
  let chainName = "unknown";
  try {
    const network = await provider.getNetwork();
    chainId = network.chainId;
    chainName = network.name !== "unknown" ? network.name : "soneium";
  } catch (err) {
    // fallback silently
  }

  res.status(200).json({
    wallet: address,
    chainId,
    chainName,
    data,
    totalPoints: parseFloat(totalCalculatedPoints.toFixed(2))
  });
};
