// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ViolationAudit {
    event ViolationAnchored(
        uint256 indexed id,
        bytes32 violationHash,
        uint256 timestamp,
        address indexed sender
    );

    struct Record {
        bytes32 violationHash;
        uint256 timestamp;
        address sender;
    }

    Record[] public records;

    function anchorViolation(bytes32 _hash) external {
        records.push(
            Record({
                violationHash: _hash,
                timestamp: block.timestamp,
                sender: msg.sender
            })
        );

        emit ViolationAnchored(
            records.length - 1,
            _hash,
            block.timestamp,
            msg.sender
        );
    }

    function getCount() external view returns (uint256) {
        return records.length;
    }
}
