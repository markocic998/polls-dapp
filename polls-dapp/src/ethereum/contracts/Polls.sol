// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./SimplePoll.sol";

contract Polls {
    SimplePoll[] public polls;
    address[] public creators;
    mapping(address => SharedStructs.Creator) public ratings;
    mapping(address => mapping(address => mapping (address => bool))) public hasRated;

    modifier canRate(address _poll) {
        require(canSenderRate(_poll), "Can not rate.");
        _;
    }
    
    function canSenderRate(address _poll) private view returns(bool) {
        if (SimplePoll(_poll).creator() == msg.sender || !ratings[SimplePoll(_poll).creator()].active || 
            !SimplePoll(_poll).hasVoted(msg.sender) || !SimplePoll(_poll).isDeadlineExpired()) {
            return false;
        }
        return !hasRated[SimplePoll(_poll).creator()][_poll][msg.sender];
    }

    function createPrivatePoll(string memory subject, string memory descr, string[] memory proposalNames, uint duration) external {
        PrivatePoll privatePoll = new PrivatePoll(msg.sender, subject, descr, proposalNames, duration);
        polls.push(privatePoll);
        tryAddCreator(msg.sender);
    }

    function createPublicPoll(string memory subject, string memory descr, string[] memory proposalNames, uint duration) external {
        PublicPoll publicPoll = new PublicPoll(msg.sender, subject, descr, proposalNames, duration);
        polls.push(publicPoll);
        tryAddCreator(msg.sender);
    }

    function tryAddCreator(address _creator) private {
        if (!ratings[_creator].active) {
            ratings[_creator].active = true;
            creators.push(_creator);
        }
    }

    function getActivePolls() external view returns(SimplePoll[] memory) {
        SimplePoll[] memory _activePolls = new SimplePoll[](polls.length);
        for (uint i = 0; i < polls.length; i++) {
            if (!polls[i].isDeadlineExpired()) {
                _activePolls[i] = polls[i];
            }
        }
        return _activePolls;
    }

    function getNonActivePollResults() external view returns(SharedStructs.Result[] memory) {
        SharedStructs.Result[] memory _nonActivePollResults = new SharedStructs.Result[](polls.length);
        for (uint i = 0; i < polls.length; i++) {
            if (polls[i].isDeadlineExpired()) {
                _nonActivePollResults[i] = SharedStructs.Result({
                    poll: polls[i],
                    proposals: polls[i].getResults()
                });
            }
        }
        return _nonActivePollResults;
    }

    function rate(address _poll, uint8 _mark) external canRate(_poll) {
        require(_mark > 0 && _mark < 6);
        hasRated[SimplePoll(_poll).creator()][_poll][msg.sender] = true;
        ratings[SimplePoll(_poll).creator()].totalRate += _mark;
        ratings[SimplePoll(_poll).creator()].rateNumber++;
    }
}