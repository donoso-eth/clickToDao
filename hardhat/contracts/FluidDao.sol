//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {ISuperfluid, ISuperAgreement, ISuperToken, ISuperApp, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract FluidDao is SuperAppBase, Ownable {
    using Counters for Counters.Counter;
   
    
    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token

    /**************************************************************************
     * DAO GLOBAL CONFIG
     *************************************************************************/

    uint256 private PROPOSAL_PERIOD = 7 * 24 * 60 * 60;
    uint256 private MAX_ACTIVE_PROPOSAL = 5;


    /**************************************************************************
     * Member State Variables
     *************************************************************************/
     Counters.Counter public _memberIds;

      enum MembershipStatus {
        ACTIVE,
        SLEEPING,
        WENT_AWAY
    }

    struct Member {
        int96 votingPower;
        uint256 activePrososals;
        uint256 lastActive;
        MembershipStatus status;
    }

    mapping(address => Member) private _members;

    mapping(address => uint256) private _lastPresentedTimeStamp;

    mapping(address => uint256) private _proposalsByMember;

    //mapping 

    uint256 private _totalMembers;



    /**************************************************************************
     * Proposal State Variables
     *************************************************************************/
     Counters.Counter public _proposalIds;

    enum ProposalStatus {
        DRAFT,
        SUBMITTED,
        CANCEL,
        GRANTED,
        REVOKED
    }

    struct Proposal {
        address sender;
        string proposalUri;
        ProposalStatus status;
        uint256 currentVotingResult;
        uint256 timestamp;
    }

    mapping(uint256 => Proposal) private _proposals;

    mapping(uint256 => mapping(address => uint256)) private _votingByProposal;

    mapping(address => mapping(uint256 => bool)) _alreadyVotedbyMember;


    /**************************************************************************
     * Events
     *************************************************************************/
    event MemberCreated (address indexed member, uint256 _id, uint );


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
     * DAO Mocks Permissions
     *************************************************************************/
    function addPermision() external {
        _addPermission(435678999);
    }

    function revokePermision() external {
        _revokePermission();
    }

    /**************************************************************************
     * DAO Modifiers
     *************************************************************************/
    // #region DAO MOdidiers
    modifier onlyMembers() {
        require(isMember(msg.sender) != MembershipStatus.WENT_AWAY, "NOT_MEMBER");
        _;
    }

    modifier onlyOneProposalperPeriod() {
        require(
            _lastPresentedTimeStamp[msg.sender] + PROPOSAL_PERIOD >
                block.timestamp,
            "ALREADY_PRESENTED_THIS_WEEK"
        );
        _;
    }

    modifier onlyProposalOwner(uint256 id) {
        require(_proposals[id].sender == msg.sender, "NOT_OWNER_OF_PROPOSAL");
        _;
    }

    modifier onlyActiveProposals(uint256 id) {
        require(
            _proposals[id].status == ProposalStatus.SUBMITTED,
            "NOT_SUBMITTED_PROPOSAL"
        );
        require(
            _proposals[id].timestamp + PROPOSAL_PERIOD > block.timestamp,
            "PROPOSAL_EXPIRED"
        );
        _;
    }

    modifier onlyReadyToVoteProposals(uint256 id) {
        require(
            _proposals[id].status == ProposalStatus.SUBMITTED,
            "NOT_SUBMITTED_PROPOSAL"
        );
        require(
            _proposals[id].timestamp + PROPOSAL_PERIOD < block.timestamp,
            "PROPOSAL_STILL_ACTIVE"
        );
        _;
    }

    // #endregion DAO MOdidiers

    /**************************************************************************
     * Dao Governance
     *************************************************************************/

    /**
     * @notice Returns whether a User is Member of the DAO
     *
     * @param member the member address
     */
    function isMember(address member) public view returns (MembershipStatus) {
        return _members[member].status;
    }

    function _addPermission(int96 _votingPower) internal {
        _members[msg.sender] = Member( _votingPower, 0, block.timestamp,MembershipStatus.ACTIVE);
        _createReturningFlow(msg.sender);
    }

    function _revokePermission() internal {
        _members[msg.sender] = Member( 0, 0, block.timestamp,MembershipStatus.WENT_AWAY);
        _stopReturningFlow((msg.sender));
    }

    function changePeriod(uint256 period) public onlyOwner {
        PROPOSAL_PERIOD = period;
    }

    /**************************************************************************
     * Dao proposals
     *************************************************************************/
    // #region draft proposal

    function createDraftProposal(string memory _proposalUri)
        public
        onlyMembers
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = Proposal(
            msg.sender,
            _proposalUri,
            ProposalStatus.DRAFT,
            0,
            block.timestamp
        );

        _proposalsByMember[msg.sender] = id;
    }

    function updateDraftProposal(
        uint256 _proposalId,
        string memory _proposalUri
    ) public onlyMembers onlyProposalOwner(_proposalId) {
        _proposals[_proposalId] = Proposal(
            msg.sender,
            _proposalUri,
            ProposalStatus.DRAFT,
            0,
            block.timestamp
        );
    }

    function submitDraftetProposal(
        uint256 _proposalId,
        string memory _proposalUri
    )
        public
        onlyMembers
        onlyProposalOwner(_proposalId)
        onlyOneProposalperPeriod
    {
        _lastPresentedTimeStamp[msg.sender] = block.timestamp;
        _proposals[_proposalId].proposalUri = _proposalUri;
        _proposals[_proposalId].status = ProposalStatus.SUBMITTED;
    }

    function submitNewProposal(Proposal memory _newProposal)
        public
        onlyMembers
        onlyOneProposalperPeriod
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _newProposal;
    }

    function widthDrawProposal(Proposal memory _withdrawProposal)
        public
        onlyMembers
    {
        _proposalIds.increment();
        uint256 id = _proposalIds.current();
        _proposals[id] = _withdrawProposal;
    }

    function vote(uint256 _proposalId, bool)
        public
        onlyMembers
        onlyActiveProposals(_proposalId)
    {
        require(
            _alreadyVotedbyMember[msg.sender][_proposalId] == false,
            "PROPOSAL_ALREADY_VOTED"
        );
        _members[msg.sender].activePrososals =
        _members[msg.sender].activePrososals + 1;
        _alreadyVotedbyMember[msg.sender][_proposalId] = true;
        _proposals[_proposalId].currentVotingResult =  _proposals[_proposalId].currentVotingResult + uint256(int256(_members[msg.sender].votingPower));
    }

    function unVote() public onlyMembers {}

    function calculateResult(uint256 _proposalId)
        public
        onlyMembers
        onlyReadyToVoteProposals(_proposalId)
    {
        if (_proposals[_proposalId].currentVotingResult > 0){
                _proposals[_proposalId].status = ProposalStatus.GRANTED;

        } else {
                _proposals[_proposalId].status = ProposalStatus.REVOKED;
        }
    }

    function _executeResult() internal {
        //// TODO RESULT
    }

    function _cleanUserActiveProposals() public {}

    function _updateActiveProposals() public {}

    // #endregion draft proposal

    /**************************************************************************
     * SuperApp Flow Manipulation & callbacks 
     *************************************************************************/

    function _createReturningFlow (address member) internal {

    }

    function _stopReturningFlow(address member) internal {

    }


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
        _addPermission(inFlowRate);

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
        _updateActiveProposals();
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

        _cleanUserActiveProposals();

        _revokePermission();
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
