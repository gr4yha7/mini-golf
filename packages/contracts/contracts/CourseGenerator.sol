// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

/// @title Mini Golf Course Generator
/// @notice Generates random course layouts using Chainlink VRF
contract CourseGenerator is Ownable, VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    
    mapping(bytes32 => bytes32) public requestToCourse;
    
    event CourseGenerated(bytes32 indexed requestId, bytes32 courseHash);
    
    constructor(
        address vrfCoordinator,
        address linkToken,
        bytes32 _keyHash,
        uint256 _fee
    ) 
        Ownable(msg.sender)
        VRFConsumerBase(vrfCoordinator, linkToken) 
    {
        keyHash = _keyHash;
        fee = _fee;
    }
    
    /// @notice Requests a new random course layout
    function requestCourse() external returns (bytes32) {
        require(LINK.balanceOf(address(this)) >= fee, "Insufficient LINK");
        return requestRandomness(keyHash, fee);
    }
    
    /// @notice Callback function used by VRF Coordinator
    function fulfillRandomness(bytes32 requestId, uint256 randomness) 
        internal 
        override 
    {
        bytes32 courseHash = keccak256(abi.encodePacked(randomness));
        requestToCourse[requestId] = courseHash;
        emit CourseGenerated(requestId, courseHash);
    }
} 