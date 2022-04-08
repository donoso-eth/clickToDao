//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {ISuperfluid, ISuperAgreement, ISuperToken, ISuperApp, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract FluidDao is SuperAppBase {
    using Counters for Counters.Counter;
    Counters.Counter public _proposalIds;

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
 
    struct Member {
        bool active;
        int96 votingPower;
        uint256 activePrososals;
    }

    mapping(address => Member) private _members;

    mapping(address => uint256) private _lastPresentedTimeStamp;

    mapping(uint256 => Proposal) private _proposals;

    mapping(uint256 => uint256) private _votingByProposal;

    struct Proposal {
        address sender;
        string message;
        string proposalUri;
    }



    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken
    ) {
        require(address(host) != address(0), "host is zero address");
        require(address(cfa) != address(0), "cfa is zero address");
        require(
            address(acceptedToken) != address(0),
            "acceptedToken is zero address"
        );
        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;


        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }

  /**************************************************************************
     * DAO Modifiers
     *************************************************************************/
    modifier onlyMembers() {
        require(isMember(msg.sender), "NOT_MEMBER");
        _;
    }

    modifier onlyOnePoposalperWeek() {
        require(
            _lastPresentedTimeStamp[msg.sender] + 7 * 24 * 60 * 60 >
                block.timestamp,
            "ALREADY_PRESENTED_THIS_WEEK"
        );

        _;
    }

    /**************************************************************************
     * Dao Governance
     *************************************************************************/

    /**
     * @notice Returns whether a User is Member of the DAO
     *
     * @param member the member address
     */
    function isMember(address member) public view returns (bool) {
        return _members[member].active;
    }

    /**************************************************************************
     * Dao proposals
     *************************************************************************/

    function draftProposal(Proposal memory _draftProposal)
        public
        onlyMembers
        onlyOnePoposalperWeek
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _draftProposal;
    }

    function submitDraftetProposal(Proposal memory _updatedProposal)
        public
        onlyMembers
        onlyOnePoposalperWeek
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _updatedProposal;
    }

    function submitNewProposal(Proposal memory _newProposal)
        public
        onlyMembers
        onlyOnePoposalperWeek
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _newProposal;
    }

    function widthDrawProposal(Proposal memory _withdrawProposal)
        public
        onlyMembers
        onlyOnePoposalperWeek
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _withdrawProposal;
    }

    function vote() public onlyMembers {}

    function unVote() public onlyMembers {}

    function cleanUserActiveProposals() public {}

    function updateActiveProposals() public {}

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        (address sender, ) = abi.decode(_agreementData, (address, address));

        (, int96 inFlowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            sender,
            address(this)
        );
        _members[sender] = Member(true, inFlowRate, 0);
        return _ctx;
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, //_cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        (address sender, ) = abi.decode(_agreementData, (address, address));
        (, int96 inFlowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            sender,
            address(this)
        );
        updateActiveProposals();
        _members[sender].votingPower = inFlowRate;
        return _ctx;
    }

    function afterAgreementTerminated(
        ISuperToken, /*superToken*/
        address, /*agreementClass*/
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, /*cbdata*/
        bytes calldata _ctx
    ) external virtual override returns (bytes memory newCtx) {
        (address sender, ) = abi.decode(_agreementData, (address, address));

        cleanUserActiveProposals();
        _members[sender] = Member(false, 0, 0);
        return _ctx;
    }

    /**************************************************************************
     * SuperApp Helpers & modifiers
     *************************************************************************/

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return
            ISuperAgreement(agreementClass).agreementType() ==
            keccak256(
                "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
            );
    }

    modifier onlyHost() {
        require(
            msg.sender == address(_host),
            "RedirectAll: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }
}
