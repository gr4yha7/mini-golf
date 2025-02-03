export const MiniGolfABI = [
  {
    "inputs": [
      { "name": "players", "type": "address[]", "internalType": "address[]" },
      { "name": "courseHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "name": "createGame",
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "gameId", "type": "bytes32", "internalType": "bytes32" },
      { "name": "commitment", "type": "bytes32", "internalType": "bytes32" }
    ],
    "name": "submitShot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "gameId", "type": "bytes32", "internalType": "bytes32" }],
    "name": "markPlayerFinished",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "name": "games",
    "outputs": [
      { "name": "players", "type": "address[]", "internalType": "address[]" },
      { "name": "currentTurn", "type": "uint8", "internalType": "uint8" },
      { "name": "status", "type": "uint8", "internalType": "enum MiniGolf.GameStatus" },
      { "name": "scores", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "courseHash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "lastShotCommitment", "type": "bytes32", "internalType": "bytes32" },
      { "name": "startTime", "type": "uint256", "internalType": "uint256" },
      { "name": "lastShotTime", "type": "uint256", "internalType": "uint256" },
      { "name": "maxShots", "type": "uint256", "internalType": "uint256" },
      { "name": "shotsRemaining", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "hasFinished", "type": "bool[]", "internalType": "bool[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "gameId", "type": "bytes32", "internalType": "bytes32" },
      { "indexed": false, "name": "players", "type": "address[]", "internalType": "address[]" },
      { "indexed": false, "name": "courseHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "gameId", "type": "bytes32", "internalType": "bytes32" },
      { "indexed": true, "name": "player", "type": "address", "internalType": "address" },
      { "indexed": false, "name": "commitment", "type": "bytes32", "internalType": "bytes32" },
      { "indexed": false, "name": "shotsRemaining", "type": "uint256", "internalType": "uint256" }
    ],
    "name": "ShotSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "gameId", "type": "bytes32", "internalType": "bytes32" },
      { "indexed": false, "name": "players", "type": "address[]", "internalType": "address[]" },
      { "indexed": false, "name": "finalScores", "type": "uint256[]", "internalType": "uint256[]" },
      { "indexed": false, "name": "winner", "type": "address", "internalType": "address" }
    ],
    "name": "GameCompleted",
    "type": "event"
  }
] as const; 