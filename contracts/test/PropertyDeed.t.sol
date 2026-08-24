// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PropertyDeed} from "../PropertyDeed.sol";

interface Vm {
    function warp(uint256 newTimestamp) external;
}

contract ContractActor {
    function attest(PropertyDeed record, uint256 value, uint256 asOf, bytes32 documentHash)
        external
    {
        record.recordValuation(value, asOf, documentHash);
    }

    function tryAttest(PropertyDeed record, uint256 value, uint256 asOf, bytes32 documentHash)
        external
        returns (bool ok)
    {
        (ok,) = address(record).call(
            abi.encodeCall(PropertyDeed.recordValuation, (value, asOf, documentHash))
        );
    }

    function transferRecordOwnership(PropertyDeed record, address newOwner) external {
        record.transferOwnership(newOwner);
    }

    function tryTransferRecordOwnership(PropertyDeed record, address newOwner)
        external
        returns (bool ok)
    {
        (ok,) = address(record).call(abi.encodeCall(PropertyDeed.transferOwnership, (newOwner)));
    }

    function changePublisher(PropertyDeed record, address newPublisher) external {
        record.setPublisher(newPublisher);
    }
}

contract PropertyDeedTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function testZeroPublisherIsRejected() external {
        try new PropertyDeed(address(0)) returns (PropertyDeed) {
            revert("zero publisher accepted");
        } catch {}
    }

    function testStartsWithoutAValuation() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        require(record.owner() == address(this), "wrong owner");
        require(record.publisher() == address(publisher), "wrong publisher");
        require(record.isValuationStale(180 days), "empty record must be stale");
    }

    function testApprovedPublisherCanRecordValuation() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));
        bytes32 appraisal = keccak256("fictional-appraisal-v1");

        publisher.attest(record, 38_400_000, block.timestamp, appraisal);

        require(record.valuationUsd() == 38_400_000, "wrong value");
        require(record.valuationAsOf() == block.timestamp, "wrong date");
        require(record.appraisalHash() == appraisal, "wrong appraisal");
        require(!record.isValuationStale(180 days), "fresh value marked stale");
    }

    function testOtherCallerCannotRecordValuation() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        (bool ok,) = address(record).call(
            abi.encodeCall(PropertyDeed.recordValuation, (38_400_000, block.timestamp, bytes32(0)))
        );

        require(!ok, "unapproved caller recorded value");
    }

    function testValuationBecomesStaleAfterTheAllowedWindow() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));
        uint256 recordedAt = block.timestamp;

        publisher.attest(record, 38_400_000, recordedAt, keccak256("fictional-appraisal-v1"));
        vm.warp(recordedAt + 181 days);

        require(record.isValuationStale(180 days), "expired value marked fresh");
    }

    function testFutureValuationDateIsRejected() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        bool ok = publisher.tryAttest(
            record,
            38_400_000,
            block.timestamp + 1,
            keccak256("fictional-appraisal-v1")
        );

        require(!ok, "future date accepted");
    }

    function testOwnerCanTransferTheRecord() external {
        ContractActor publisher = new ContractActor();
        ContractActor newOwner = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        record.transferOwnership(address(newOwner));

        require(record.owner() == address(newOwner), "ownership not transferred");
    }

    function testOtherCallerCannotTransferTheRecord() external {
        ContractActor publisher = new ContractActor();
        ContractActor other = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        bool ok = other.tryTransferRecordOwnership(record, address(other));

        require(!ok, "non-owner transferred the record");
        require(record.owner() == address(this), "owner changed");
    }

    function testOwnerCanRotateThePublisher() external {
        ContractActor firstPublisher = new ContractActor();
        ContractActor secondPublisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(firstPublisher));

        record.setPublisher(address(secondPublisher));

        require(record.publisher() == address(secondPublisher), "publisher not changed");
        require(
            !firstPublisher.tryAttest(
                record, 38_400_000, block.timestamp, keccak256("old-publisher-appraisal")
            ),
            "old publisher retained access"
        );
        secondPublisher.attest(
            record, 38_400_000, block.timestamp, keccak256("new-publisher-appraisal")
        );
        require(record.valuationUsd() == 38_400_000, "new publisher could not record");
    }

    function testNewOwnerCanRotateThePublisher() external {
        ContractActor firstPublisher = new ContractActor();
        ContractActor newOwner = new ContractActor();
        ContractActor secondPublisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(firstPublisher));

        record.transferOwnership(address(newOwner));
        newOwner.changePublisher(record, address(secondPublisher));

        require(record.publisher() == address(secondPublisher), "new owner could not change publisher");
    }

    function testZeroOwnerAndPublisherAreRejected() external {
        ContractActor publisher = new ContractActor();
        PropertyDeed record = new PropertyDeed(address(publisher));

        (bool ownerOk,) = address(record).call(
            abi.encodeCall(PropertyDeed.transferOwnership, (address(0)))
        );
        (bool publisherOk,) = address(record).call(
            abi.encodeCall(PropertyDeed.setPublisher, (address(0)))
        );

        require(!ownerOk, "zero owner accepted");
        require(!publisherOk, "zero publisher accepted");
    }
}
