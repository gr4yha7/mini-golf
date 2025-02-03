// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title MiniGolf Game Core Contract
/// @notice Manages game state and core gameplay mechanics
contract MiniGolf is Ownable, ReentrancyGuard {
    enum GameStatus { WAITING, IN_PROGRESS, COMPLETED }

    struct GameState {
        address[] players;
        uint8 currentTurn;
        GameStatus status;
        uint256[] scores;
        bytes32 courseHash;
        bytes32 lastShotCommitment;
        uint256 startTime;
        uint256 lastShotTime;
        uint256 maxShots;
        uint256[] shotsRemaining;
        bool[] hasFinished;
    }

    mapping(bytes32 => GameState) public games;
    mapping(address => bytes32[]) public playerGames;

    uint256 public constant MAX_TURN_TIME = 30 seconds;
    uint256 public constant DEFAULT_MAX_SHOTS = 6;

    event GameCreated(
        bytes32 indexed gameId,
        address[] players,
        bytes32 courseHash
    );

    event ShotSubmitted(
        bytes32 indexed gameId,
        address indexed player,
        bytes32 commitment,
        uint256 shotsRemaining
    );

    event GameCompleted(
        bytes32 indexed gameId,
        address[] players,
        uint256[] finalScores,
        address winner
    );

    modifier onlyGamePlayer(bytes32 gameId) {
        bool isPlayer = false;
        for (uint i = 0; i < games[gameId].players.length; i++) {
            if (games[gameId].players[i] == msg.sender) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Not a player in this game");
        _;
    }

    modifier gameInProgress(bytes32 gameId) {
        require(games[gameId].status == GameStatus.IN_PROGRESS, "Game not in progress");
        require(block.timestamp - games[gameId].lastShotTime <= MAX_TURN_TIME, "Turn time expired");
        _;
    }

    function createGame(address[] calldata players, bytes32 courseHash) external returns (bytes32) {
        require(players.length > 0 && players.length <= 4, "Invalid number of players");
        
        bytes32 gameId = keccak256(abi.encodePacked(
            block.timestamp,
            players,
            courseHash
        ));

        require(games[gameId].players.length == 0, "Game already exists");

        uint256[] memory scores = new uint256[](players.length);
        uint256[] memory shotsRemaining = new uint256[](players.length);
        bool[] memory hasFinished = new bool[](players.length);
        
        for (uint i = 0; i < players.length; i++) {
            shotsRemaining[i] = DEFAULT_MAX_SHOTS;
            hasFinished[i] = false;
        }

        games[gameId] = GameState({
            players: players,
            currentTurn: 0,
            status: GameStatus.IN_PROGRESS,
            scores: scores,
            courseHash: courseHash,
            lastShotCommitment: bytes32(0),
            startTime: block.timestamp,
            lastShotTime: block.timestamp,
            maxShots: DEFAULT_MAX_SHOTS,
            shotsRemaining: shotsRemaining,
            hasFinished: hasFinished
        });

        for (uint i = 0; i < players.length; i++) {
            playerGames[players[i]].push(gameId);
        }

        emit GameCreated(gameId, players, courseHash);
        return gameId;
    }

    function submitShot(bytes32 gameId, bytes32 commitment) 
        external 
        onlyGamePlayer(gameId)
        gameInProgress(gameId)
        nonReentrant 
    {
        GameState storage game = games[gameId];
        require(game.players[game.currentTurn] == msg.sender, "Not your turn");
        require(game.shotsRemaining[game.currentTurn] > 0, "No shots remaining");
        require(!game.hasFinished[game.currentTurn], "Player already finished");

        game.lastShotCommitment = commitment;
        game.shotsRemaining[game.currentTurn]--;
        game.scores[game.currentTurn]++;
        game.lastShotTime = block.timestamp;

        // Find next player who hasn't finished
        uint8 nextTurn = game.currentTurn;
        bool foundNext = false;
        for (uint8 i = 1; i <= game.players.length; i++) {
            nextTurn = (game.currentTurn + i) % uint8(game.players.length);
            if (!game.hasFinished[nextTurn] && game.shotsRemaining[nextTurn] > 0) {
                foundNext = true;
                break;
            }
        }
        
        game.currentTurn = nextTurn;
        
        if (!foundNext) {
            _completeGame(gameId);
        }

        emit ShotSubmitted(gameId, msg.sender, commitment, game.shotsRemaining[game.currentTurn]);
    }

    function markPlayerFinished(bytes32 gameId) 
        external 
        onlyGamePlayer(gameId)
        gameInProgress(gameId) 
    {
        GameState storage game = games[gameId];
        require(game.players[game.currentTurn] == msg.sender, "Not your turn");
        game.hasFinished[game.currentTurn] = true;
    }

    function _completeGame(bytes32 gameId) internal {
        GameState storage game = games[gameId];
        game.status = GameStatus.COMPLETED;
        
        // Find winner (lowest score)
        uint256 minScore = type(uint256).max;
        address winner;
        for (uint i = 0; i < game.players.length; i++) {
            if (game.scores[i] < minScore) {
                minScore = game.scores[i];
                winner = game.players[i];
            }
        }
        
        emit GameCompleted(gameId, game.players, game.scores, winner);
    }

    function getPlayerGames(address player) external view returns (bytes32[] memory) {
        return playerGames[player];
    }

    // Emergency functions
    function forceCompleteGame(bytes32 gameId) external onlyOwner {
        require(games[gameId].status != GameStatus.COMPLETED, "Game already completed");
        games[gameId].status = GameStatus.COMPLETED;
        emit GameCompleted(gameId, games[gameId].players, games[gameId].scores, address(0));
    }
} 