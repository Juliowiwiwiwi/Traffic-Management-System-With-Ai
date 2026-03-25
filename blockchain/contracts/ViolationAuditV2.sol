// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ViolationAuditV2 {

    enum Status {
        CREATED,
        REVIEWED,
        APPROVED,
        PAID,
        DISPUTED
    }

    struct Violation {
        bytes32 violationHash;   // hash of violation data
        bytes32 evidenceHash;    // hash of evidence file
        Status status;
        uint256 timestamp;
        address lastUpdatedBy;
    }

    Violation[] public violations;

    event ViolationCreated(
        uint256 indexed id,
        bytes32 violationHash,
        bytes32 evidenceHash,
        uint256 timestamp
    );

    event StatusUpdated(
        uint256 indexed id,
        Status oldStatus,
        Status newStatus,
        address updatedBy
    );

    //  Register violation + evidence hash
    function registerViolation(
        bytes32 _violationHash,
        bytes32 _evidenceHash
    ) external {

        violations.push(
            Violation({
                violationHash: _violationHash,
                evidenceHash: _evidenceHash,
                status: Status.CREATED,
                timestamp: block.timestamp,
                lastUpdatedBy: msg.sender
            })
        );

        emit ViolationCreated(
            violations.length - 1,
            _violationHash,
            _evidenceHash,
            block.timestamp
        );
    }

    // Update lifecycle status
    function updateStatus(uint256 _id, Status _newStatus) external {
        require(_id < violations.length, "Invalid violation ID");

        Status oldStatus = violations[_id].status;
        violations[_id].status = _newStatus;
        violations[_id].lastUpdatedBy = msg.sender;

        emit StatusUpdated(
            _id,
            oldStatus,
            _newStatus,
            msg.sender
        );
    }

    //  Read-only getters (for backend)
    function getViolation(uint256 _id)
        external
        view
        returns (
            bytes32,
            bytes32,
            Status,
            uint256,
            address
        )
    {
        Violation memory v = violations[_id];
        return (
            v.violationHash,
            v.evidenceHash,
            v.status,
            v.timestamp,
            v.lastUpdatedBy
        );
    }

    function getViolationCount() external view returns (uint256) {
        return violations.length;
    }
}
