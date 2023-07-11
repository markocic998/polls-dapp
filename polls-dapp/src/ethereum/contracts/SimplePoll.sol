// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

library SharedStructs {
    struct Voter {
        bool canVote;
        bool voted;
        uint8 vote;
        uint delegatingVotesNumber;
        address delegate;
    }

    struct Proposal {
        string name;
        uint voteCount;
    }

    struct Creator {
        bool active;
        uint totalRate;
        uint rateNumber;
    }

    struct Result {
        SimplePoll poll;
        Proposal[] proposals;
    }
}

contract Created {
    address public creator;

    constructor(address _creator) {
        creator = _creator;
    }

    modifier isCreator() {
        require(msg.sender == creator, "Only creator has these privileges.");
        _;
    }
}

abstract contract SimplePoll is Created {
    string public topic;
    string public description;
    uint public deadline;
    SharedStructs.Proposal[] public proposals;
    mapping(address => SharedStructs.Voter) public voters;

    modifier hasNoRightToVote(address voter) {
        require(!voters[voter].canVote, "Voter has already right to vote.");
        _;
    }

    modifier isProposalIndexCorrect(uint8 proposalIndex) {
        require(proposalIndex < proposals.length, "This proposal does not exist.");
        _;
    }

    modifier hasDeadlineNotExpired() {
        require(!isDeadlineExpired(), "Deadline has expired.");
        _;
    }

    constructor(address _creator, string memory subject, string memory descr, string[] memory proposalNames, uint duration)
    Created(_creator) {
        topic = subject;
        description = descr;
        deadline = block.timestamp + duration;
        for (uint8 i = 0; i < proposalNames.length; i++) {
            proposals.push(SharedStructs.Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint8 proposalIndex) external virtual;

    function hasVoted(address voter) external view returns(bool) {
        return voters[voter].voted;
    }

    function isDeadlineExpired() public view returns(bool) {
        return block.timestamp > deadline;
    }

    function getResults() external view returns (SharedStructs.Proposal[] memory) {
        return proposals;
    }

    function winnerName() external view returns (string memory) {
        return proposals[determineWinningProposalIndex()].name;
    }

    function determineWinningProposalIndex() private view returns (uint8 index) {
        uint _winningVoteCount = 0;
        for (uint8 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > _winningVoteCount) {
                _winningVoteCount = proposals[i].voteCount;
                index = i;
            }
        }
    }

}

contract PrivatePoll is SimplePoll {
    constructor(address _creator, string memory subject, string memory descr, string[] memory proposalNames, uint duration) 
    SimplePoll(_creator, subject, descr, proposalNames, duration) {
        voters[_creator].canVote = true;
    }

    event GivingRightToVote(uint indexed date, address indexed _from, address indexed _to);

    function giveRightToVote(address voter) external hasDeadlineNotExpired isCreator hasNoRightToVote(voter) {
        voters[voter].canVote = true;
        emit GivingRightToVote(block.timestamp, msg.sender, voter);
    }

    function vote(uint8 proposalIndex) external override hasDeadlineNotExpired isProposalIndexCorrect(proposalIndex) {
        SharedStructs.Voter storage sender = voters[msg.sender];
        require(sender.canVote, "Has no right to vote.");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposalIndex;
        proposals[proposalIndex].voteCount++;
    }
}

contract PublicPoll is SimplePoll {
    constructor(address _creator, string memory subject, string memory descr, string[] memory proposalNames, uint duration) 
    SimplePoll(_creator, subject, descr, proposalNames, duration) {}

    event Delegating(uint indexed date, address indexed _from, address indexed _to);

    function delegate(address to) external hasDeadlineNotExpired {
        SharedStructs.Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        require(to != msg.sender, "Self-delegation is not allowed.");
        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;
            require(to != msg.sender, "Found loop in delegation.");
        }
        sender.voted = true;
        sender.delegate = to;
        SharedStructs.Voter storage delegatedVoter = voters[to];
        if (delegatedVoter.voted) {
            proposals[delegatedVoter.vote].voteCount += (sender.delegatingVotesNumber + 1);
        } else {
            delegatedVoter.delegatingVotesNumber += (sender.delegatingVotesNumber + 1);
        }
        emit Delegating(block.timestamp, msg.sender, to);
    }

    function vote(uint8 proposalIndex) external override hasDeadlineNotExpired isProposalIndexCorrect(proposalIndex) {
        SharedStructs.Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposalIndex;
        proposals[proposalIndex].voteCount += (sender.delegatingVotesNumber + 1);
    }
}