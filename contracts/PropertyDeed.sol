// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Local-only record for one fictional Diameter property. It stores an approved
 * valuation and the matching appraisal fingerprint. It is not audited or
 * deployed, holds no funds, and does not represent legal title.
 */
contract PropertyDeed {
    /// Fictional asset from the prototype dataset.
    string public constant PROPERTY_ID = "skyline-hotel-phoenix";
    string public constant PROPERTY_NAME = "Skyline Hotel Phoenix (fictional)";

    /// Current holder of the deed record.
    address public owner;

    /// Approved publisher for valuation records.
    address public publisher;

    /// Last recorded valuation, in whole USD.
    uint256 public valuationUsd;
    /// Effective time for the valuation.
    uint256 public valuationAsOf;
    /// Fingerprint of the signed appraisal PDF.
    bytes32 public appraisalHash;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PublisherChanged(address indexed previousPublisher, address indexed newPublisher);
    event ValuationRecorded(uint256 valuationUsd, uint256 asOf, bytes32 appraisalHash);

    error NotOwner();
    error NotPublisher();
    error ZeroAddress();
    error TimestampInFuture();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPublisher() {
        if (msg.sender != publisher) revert NotPublisher();
        _;
    }

    constructor(address initialPublisher) {
        if (initialPublisher == address(0)) revert ZeroAddress();
        owner = msg.sender;
        publisher = initialPublisher;
    }

    /// Change the record administrator.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// Change the approved publisher.
    function setPublisher(address newPublisher) external onlyOwner {
        if (newPublisher == address(0)) revert ZeroAddress();
        emit PublisherChanged(publisher, newPublisher);
        publisher = newPublisher;
    }

    /// Record an approved value and its source document fingerprint.
    function recordValuation(uint256 newValuationUsd, uint256 asOf, bytes32 newAppraisalHash)
        external
        onlyPublisher
    {
        if (asOf > block.timestamp) revert TimestampInFuture();
        valuationUsd = newValuationUsd;
        valuationAsOf = asOf;
        appraisalHash = newAppraisalHash;
        emit ValuationRecorded(newValuationUsd, asOf, newAppraisalHash);
    }

    /// Report whether the value is older than the caller's allowed window.
    function isValuationStale(uint256 maxAgeSeconds) external view returns (bool) {
        if (valuationAsOf == 0) return true; // never attested
        return block.timestamp - valuationAsOf > maxAgeSeconds;
    }
}
