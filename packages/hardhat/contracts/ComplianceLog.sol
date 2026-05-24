// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

/// @title ComplianceLog — on-chain ledger for ComplianceCheck MiniApp risk checks
/// @notice Immutable public record of every heuristic risk check performed.
contract ComplianceLog {

    // Fired per check so Celoscan / indexers can track history
    event CheckPerformed(
        address indexed checker, // MiniPay wallet that triggered the check
        address indexed wallet,  // target address evaluated
        uint8 score,             // 0 (low risk) – 100 (high risk)
        uint256 timestamp        // block.timestamp at log time
    );

    // Global counter — readable from the frontend without an indexer
    uint256 public totalChecks;

    /// @notice Record a completed risk check on-chain
    /// @param wallet Target address that was evaluated
    /// @param score  Heuristic risk score; must be 0–100
    function logCheck(address wallet, uint8 score) external {
        // Reject values outside the valid range to keep data consistent
        require(score <= 100, "Score must be 0-100");
        totalChecks++; // increment before emitting so the event reflects the new total
        emit CheckPerformed(msg.sender, wallet, score, block.timestamp);
    }
}
