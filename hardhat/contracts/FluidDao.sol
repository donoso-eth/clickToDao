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

  ISuperfluid public _host; // host
  IConstantFlowAgreementV1 public _cfa; // the stored constant flow agreement class address
  ISuperToken public _acceptedToken; // accepted token

  //  ====== ==== ===  DAO GLOBAL CONFIG ====== ==== ========= ==== === //

  uint256 public PROPOSAL_PERIOD = 7 * 24 * 60 * 60;
  uint256 public MAX_ACTIVE_PROPOSAL = 5;
  int96 public INFLOW_MAX =   3858024691358;
  int96 public INFLOW_ACTIVE = 964506172839;
  int96 public INFLOW_CORE =   428669410150;
  //  ====== ==== === TREASURY  ====== ==== === //
  uint256 public _netFlow;

  //  ====== ==== === Member State Variables ====== = //
  Counters.Counter public _memberIds;

  enum MembershipStatus {
    NOT_SEEN_YET,
    ACTIVE,
    SLEEPING,
    WENT_AWAY,
    CORE
  }

  struct Member {
    int96 votingPower;
    int96 inflow;
    uint256 activePrososals;
    uint256 lastActive;
    MembershipStatus status;
    bool lastVoteBool;
    bytes _ctx;
  }

  struct Vote {
    bool vote;
    bool voted;
  }

  mapping(address => Member) public _members;

  mapping(address => uint256) public _lastPresentedTimeStamp;

  //mapping(address => uint256) public _proposalsByMember;

  //mapping

  uint256 public _totalMembers;

  address[] public _membersArray;

  //  ====== ==== === Proposal State Variables ====== ==== === ====== ==== === //

  Counters.Counter public _proposalIds;



  enum ProposalStatus {
    DRAFT,
    SUBMITTED,
    CANCEL,
    GRANTED,
    REVOKED,
    WORTHIT,
    NOWORTHIT
  }

  struct Proposal {
    address sender;
    string proposalUri;
    ProposalStatus status;
    uint256 timestamp;
    uint256 activeIndex;
    uint256 currentVotes;
    int256 votingResult;
    address[] membersVoted;
  }

  uint256[] public _activeProposalsArray;
  uint256 public _activeProposal;

  mapping(uint256 => Proposal) public _proposals;

  mapping(uint256 => mapping(address => int256)) public _votingByProposal;

  mapping(address => mapping(uint256 => Vote)) public _alreadyVotedbyMember;

  //  ====== ==== === WINING PROPOSALS ====== ==== ========= ==== ========= ==== ===

  uint256[] public _winningProposalsArray;
  uint256 public _winningProposals;

  //  ====== ==== === Events ====== ==== ========= ==== ========= ==== ===

  event MemberCreated(address indexed member, uint256 _id);

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
  function mockAddPermision() external {
    bytes memory _localB = "0x";
   // _addPermission(3858024691358,msg.sender,_localB);
  }

  function mockRevokePermision() external {
    _revokePermission(msg.sender);
  }

  // ============= DAO Modifiers ============= ============= =============  //
  // #region DAO MOdidiers
  modifier onlyMembers() {
 
    MembershipStatus test = isMember(msg.sender);
    //console.log(test);
    require(
      isMember(msg.sender) == MembershipStatus.ACTIVE ||
        isMember(msg.sender) == MembershipStatus.CORE || isMember(msg.sender) == MembershipStatus.SLEEPING,
      "NOT_MEMBER"
    );
    _;
  }

  modifier onlyOneProposalperPeriod() {

    // require(
    //     _lastPresentedTimeStamp[msg.sender] + PROPOSAL_PERIOD >
    //         block.timestamp,
    //     "ALREADY_PRESENTED_THIS_PERIOD"
    // );
    _;
  }

  modifier onlyProposalOwner(uint256 id) {
    require(_proposals[id].sender == msg.sender, "NOT_OWNER_OF_PROPOSAL");
    _;
  }

  modifier onlyActiveProposalsCanBeVotedOrUnvoted(uint256 id) {
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

  modifier onlyProposalsCanBeVotedOnce(uint256 id) {
    // require(
    //   _alreadyVotedbyMember[msg.sender][id].voted == false,
    //   "ALREADY_VOTED"
    // );

    _;
  }

  modifier onlyVotedProposalsCanBeUnVoted(uint256 id) {
    require(
      _alreadyVotedbyMember[msg.sender][id].voted == true,
      "PROPOSAL_NOT_VOTED"
    );

    _;
  }

  modifier onlyFinishedVotingProposals(uint256 id) {
    require(
      _proposals[id].status == ProposalStatus.SUBMITTED,
      "NOT_SUBMITTED_PROPOSAL"
    );
    // require(
    //   _proposals[id].timestamp + PROPOSAL_PERIOD < block.timestamp,
    //   "PROPOSAL_STILL_ACTIVE"
    // );
    _;
  }

  modifier activeProposalsLessThanMax() {
    // require(
    //   _activeProposal.current() < MAX_ACTIVE_PROPOSAL,
    //   "ALREADY_MAX_PROPOSALS_RUNNIN"
    // );

    _;
  }

  // #endregion DAO MOdidiers

  // =============  Dao Governance  ============= ============= =============  //

  /**
   * @notice Returns whether a User is Member of the DAO
   *
   * @param member the member address
   */
  function isMember(address member) public view returns (MembershipStatus) {
    return _members[member].status;
  }

  function _addPermission(int96 _inflow,address sender,bytes calldata _ctx) internal {
    int96 _votingPower = _inflow;
 
    if (_inflow > INFLOW_MAX) {
      _votingPower = INFLOW_MAX;
    }

    if (_members[sender].status == MembershipStatus.NOT_SEEN_YET) {
      _totalMembers++;
      _membersArray.push(sender);
    }
    _netFlow = _netFlow + uint256(uint96(_inflow));
    _members[sender] = Member(
      _votingPower,
      _inflow,
      0,
      0,
      MembershipStatus.SLEEPING,
      false,
      _ctx
    );
    _dispatchFlows();
  }

  function _revokePermission(address sender) internal {
    int96 inflow = _members[sender].inflow;
    _members[sender] = Member(
      0,
      0,
      0,
      block.timestamp,
      MembershipStatus.WENT_AWAY,
      false,
      "0x"
    );
    _netFlow = _netFlow - uint256(uint96(inflow));
    _stopReturningFlow(sender);
    _dispatchFlows();
  }

  function changePeriod(uint256 period) public onlyOwner {
    PROPOSAL_PERIOD = period;
  }

  /**************************************************************************
   * Dao proposals
   *************************************************************************/
  // #region proposals

  function createDraftProposal(string memory _proposalUri) public onlyMembers {
    _proposalIds.increment();
    uint256 id = _proposalIds.current();
    address[] memory addressArray;
    _proposals[id] = Proposal(
      msg.sender,
      _proposalUri,
      ProposalStatus.DRAFT,
      block.timestamp,
      MAX_ACTIVE_PROPOSAL,
      0,
      0,
      addressArray
    );

    //  _proposalsByMember[msg.sender] = id;
  }

  function updateDraftProposal(uint256 _proposalId, string memory _proposalUri)
    public
    onlyMembers
    onlyProposalOwner(_proposalId)
  {
    _proposals[_proposalId].proposalUri = _proposalUri;
  }

  function submitDraftetProposal(
    uint256 _proposalId,
    string memory _proposalUri
  )
    public
    onlyMembers
    onlyProposalOwner(_proposalId)
    activeProposalsLessThanMax
    onlyOneProposalperPeriod
  {
    _lastPresentedTimeStamp[msg.sender] = block.timestamp;
    _proposals[_proposalId].proposalUri = _proposalUri;
    _proposals[_proposalId].status = ProposalStatus.SUBMITTED;
    _activeProposal++;
    _activeProposalsArray.push(_proposalId);
    uint256 indexOfArray = _activeProposalsArray.length - 1;
    _proposals[_proposalId].activeIndex = indexOfArray;
  }

  function submitNewProposal(string memory _proposalUri)
    public
    onlyMembers
    activeProposalsLessThanMax
    onlyOneProposalperPeriod
    returns (uint256)
  {
    _proposalIds.increment();
    uint256 id = _proposalIds.current();
    address[] memory addressArray;

    _activeProposal++;
    _activeProposalsArray.push(id);
    uint256 indexOfArray = _activeProposalsArray.length - 1;

    _proposals[id] = Proposal(
      msg.sender,
      _proposalUri,
      ProposalStatus.SUBMITTED,
      block.timestamp,
      indexOfArray,
      0,
      0,
      addressArray
    );

    return id;
  }

  // function widthDrawProposal(Proposal memory _withdrawProposal)
  //     public
  //     onlyMembers
  // {
  //     _proposalIds.increment();
  //     uint256 id = _proposalIds.current();
  //     _proposals[id] = _withdrawProposal;
  // }

  function vote(uint256 _proposalId, bool _vote)
    public
    onlyMembers
    onlyActiveProposalsCanBeVotedOrUnvoted(_proposalId)
    onlyProposalsCanBeVotedOnce(_proposalId)
  {
    // _members[msg.sender].activePrososals =
    //   _members[msg.sender].activePrososals +
    //   1;
    _alreadyVotedbyMember[msg.sender][_proposalId].voted = true;
    _alreadyVotedbyMember[msg.sender][_proposalId].vote = _vote;
    _proposals[_proposalId].currentVotes++;
    _proposals[_proposalId].membersVoted.push(msg.sender);

    ///check all votings so far
    _updateUserVotingWeights();
  }

  function unVote(uint256 _proposalId)
    public
    onlyMembers
    onlyActiveProposalsCanBeVotedOrUnvoted(_proposalId)
    onlyVotedProposalsCanBeUnVoted(_proposalId)
  {
    _alreadyVotedbyMember[msg.sender][_proposalId].voted = false;
    _votingByProposal[_proposalId][msg.sender] = 0;

    _updateUserVotingWeights();
  }

  function calculateResult(uint256 _proposalId)
    public
    onlyMembers
    onlyFinishedVotingProposals(_proposalId)
  {
    Proposal storage _proposal = _proposals[_proposalId];

    uint256 _totalVotes = _proposal.currentVotes;
    int256 _votingResult = 0;

    for (uint256 j = 0; j < _totalVotes; j++) {
      address voter = _proposal.membersVoted[j];
      _votingResult = _votingResult + _votingByProposal[_proposalId][voter];
    }

    _proposal.votingResult = _votingResult;
   

    if (_votingResult > 0) {
      _proposals[_proposalId].status = ProposalStatus.GRANTED;
      _winningProposals++;
      _winningProposalsArray.push(_proposalId);
      _executeResult(_proposalId);
    } else {
      _proposals[_proposalId].status = ProposalStatus.REVOKED;
    }

    /////STOP WINING STREAMS TILL DISPATCHING

    ///// CLEANING ACTIVES ARRAY
    uint256 currentProposalIndex = _proposals[_proposalId].activeIndex;
    uint256 lastActiveIndex = _activeProposalsArray[
      _activeProposal - 1
    ];
    _activeProposalsArray[currentProposalIndex] = lastActiveIndex;
    _activeProposalsArray.pop();
    _activeProposal--;
    _proposals[_proposalId].activeIndex = MAX_ACTIVE_PROPOSAL;

    /// CHECKING USERS STATUS TO UPDATE STREAMS
    for (uint256 j = 0; j < _totalMembers; j++) {
 
      address _memberAddress = _membersArray[j];
      Member storage checkMember = _members[_membersArray[j]];
      MembershipStatus oldMemberStatus = checkMember.status;
      bool activeLastPeriod = true;
      // if (checkMember.lastActive > block.timestamp - PROPOSAL_PERIOD) {
      //   activeLastPeriod = true;
      // }
  
      /// update MemberFlows
      if (activeLastPeriod == false) {
        if (oldMemberStatus == MembershipStatus.ACTIVE) {
          checkMember.status = MembershipStatus.SLEEPING;
          _updateFlowFromActiveToSleep(checkMember);
          // delete OutcomingFLow
        } else if (oldMemberStatus == MembershipStatus.CORE) {
          checkMember.status = MembershipStatus.ACTIVE;
          //// update flow from 90% to 40%
          _updateFlowFromCoreToActive(checkMember);
        } else {
          //  do nothing
        }
      } else {
        if (
          oldMemberStatus == MembershipStatus.ACTIVE ||
          oldMemberStatus == MembershipStatus.CORE
        ) {
         
          // do nothing
        } else if (oldMemberStatus == MembershipStatus.SLEEPING) {
          checkMember.status = MembershipStatus.ACTIVE;
         
          _updateFlowFromSleepToActive(_memberAddress);
       
          //// launch 40% backstream
        }
      }
    }
  }

  function _executeResult(uint256 _proposalId) internal {
    //// TODO RESULT
    // Proposal storage _toExecuteProposal = _proposals[_proposalId];
  }

  //// HELPERS
  function _updateUserVotingWeights() internal {
    uint256 userActiveProposal = 0;
    for (uint256 j = 0; j < _activeProposal; j++) {
      if (
        _alreadyVotedbyMember[msg.sender][_activeProposalsArray[j]].voted ==
        true
      ) {
        userActiveProposal++;
      }
    }

    uint256 _votingUpdated = uint256(int256(_members[msg.sender].votingPower)) /
      userActiveProposal;

    for (uint256 j = 0; j < _activeProposal; j++) {
      if (
        _alreadyVotedbyMember[msg.sender][_activeProposalsArray[j]].voted ==
        true
      ) {
        int256 _votingDirection = -1;
        if (_alreadyVotedbyMember[msg.sender][_activeProposalsArray[j]].vote) {
          _votingDirection = 1;
        }
        _votingByProposal[_activeProposalsArray[j]][msg.sender] =
          int256(_votingUpdated) *
          _votingDirection;
      }
    }
  }

  function _cleanUserActiveProposals() public {}

  function _updateActiveProposals() public {}

  // #endregion draft proposal

  // ============= SuperApp Flow Manipulation & callbacks ============= ==========
  // region superAPP and FlowManipulation

  function  _updateFlowFromSleepToActive(address _memberAddress)  internal{
    int96 newFlow =  INFLOW_ACTIVE;
    _netFlow = _netFlow - uint256(uint96(_netFlow));
    _createReturningFlow(_memberAddress,newFlow );

   }

  function _updateFlowFromActiveToSleep(Member memory _checkMember) internal {
    int96 _currentBackFlow = (_checkMember.inflow * 400) / 1000;
    _netFlow = _netFlow + uint256(uint96(_currentBackFlow));
    // STOP FLOW TO DO GET FLOW
  }

  function _updateFlowFromCoreToActive(Member memory _checkMember) internal {
    int96 _currentBackFlow = (_checkMember.inflow * 900) / 1000;
    int96 _newBackFlow = (_checkMember.inflow * 400) / 1000;
    int96 _updateFlow = _currentBackFlow - _newBackFlow;
    _netFlow = _netFlow + uint256(uint96(_updateFlow));
    //// TODO reduce FLOW with _netFlow
    _dispatchFlows();
  }

  function _updateFlowFromSleepingToActive(Member memory _checkMember)
    internal
  {
    int96 _newBackFlow = (_checkMember.inflow * 400) / 1000;
    _netFlow = _netFlow - uint256(uint96(_newBackFlow));
    //// TODO iNCREASE FLOW with _newBackFlow)
    _dispatchFlows();
  }

  function _updateFlowFromActivetoCore(Member memory _checkMember) internal {
    int96 _currentBackFlow = (_checkMember.inflow * 400) / 1000;
    int96 _newBackFlow = (_checkMember.inflow * 900) / 1000;
    int96 _updateFlow = _newBackFlow - _currentBackFlow;
    _netFlow = _netFlow - uint256(uint96(_updateFlow));
    //// TODO incfrese FLOW with _updateFlow)
    _dispatchFlows();
  }

  function _updateFlowFromSleepingToCore(Member memory _checkMember) internal {
    int96 _newBackFlow = (_checkMember.inflow * 900) / 1000;
    _netFlow = _netFlow - uint256(uint96(_newBackFlow));
    //// TODO reduce FLOW with _netFlow
  }




  function _dispatchFlows() internal {}

  function _createReturningFlow(address member, int96 inFlowRate) internal {
       
        _host.callAgreement(
                _cfa,
               abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                member,
                inFlowRate,
                new bytes(0) // placeholder
            ),
                "0x"
            );
  }

  function _stopReturningFlow(address member) internal {}

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
    _addPermission(inFlowRate,sender,_ctx);

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

    _revokePermission(sender);
    return _ctx;
  }

  // #endregion SuperApp Flow Manipulation & callbacks

  // =============  SuperApp, Helpers & modifiers ============= =============
  // #region superapp helps

  function _isSameToken(ISuperToken superToken) public view returns (bool) {
    return address(superToken) == address(_acceptedToken);
  }

  function _isCFAv1(address agreementClass) public view returns (bool) {
    return
      ISuperAgreement(agreementClass).agreementType() ==
      keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
  }

  modifier onlyHost() {
    require(msg.sender == address(_host), "RedirectAll: support only one host");
    _;
  }

  modifier onlyExpected(ISuperToken superToken, address agreementClass) {
    require(_isSameToken(superToken), "RedirectAll: not accepted token");
    require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
    _;
  }

  // #endregion SuperAPP
}
