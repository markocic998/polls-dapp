const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3'); 

const web3 = new Web3(ganache.provider());

const Polls = require('../build/Polls.json');
const PublicPoll = require('../build/PublicPoll.json');
const PrivatePoll = require('../build/PrivatePoll.json');

let accounts;
let pollsSmartContract;
let publicPollSmartContract;
let privatePollSmartContract;
//let shortActivePollSmartContract;

let pollAddresses;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    pollsSmartContract = await new web3.eth.Contract(Polls.abi).deploy({ data: Polls.evm.bytecode.object }).send({from: accounts[0], gas: 30000000});

    await pollsSmartContract.methods.createPublicPoll(
        "test subject",
        "test description",
        ["a", "b", "c"],
        300
    ).send({from: accounts[0], gas: 3000000});

    await pollsSmartContract.methods.createPrivatePoll(
        "private subject",
        "private description",
        ["op1", "op2"],
        360
    ).send({from: accounts[1], gas: 3000000});

    // await pollsSmartContract.methods.createPublicPoll(
    //     "shortActive subject",
    //     "shortActive description",
    //     ["a", "b"],
    //     1
    // ).send({from: accounts[0], gas: 3000000});

    pollAddresses = await pollsSmartContract.methods.getActivePolls().call({from: accounts[0]});

    publicPollSmartContract = new web3.eth.Contract(PublicPoll.abi, pollAddresses[0]);
    privatePollSmartContract = new web3.eth.Contract(PrivatePoll.abi, pollAddresses[1]);

    //shortActivePollSmartContract = new web3.eth.Contract(PublicPoll.abi, pollAddresses[2]);
});

describe('Polls testing', function() {
    it('get all accounts', () => {
        assert.ok(accounts.length > 0);
    });

    it('deploys a main contract', () => {
        assert.ok(pollsSmartContract.options.address);
    });

    it('are creators properly set', async () => {
        const creators0 = await pollsSmartContract.methods.creators(0).call({from: accounts[0]});
        const creators1 = await pollsSmartContract.methods.creators(1).call({from: accounts[0]});

        assert.equal(creators0, accounts[0]);
        assert.equal(creators1, accounts[1]);
    });

    it('gets active polls', async () => {
        const activePolls = await pollsSmartContract.methods.getActivePolls().call({from: accounts[0]});

        assert.ok(activePolls[0]);
        assert.ok(activePolls[1]);
        //assert.ok(activePolls[2]);
        assert.equal(activePolls.length, 2); //3
    });

    it('gets the first poll', async () => {
        const publicPoll = await pollsSmartContract.methods.polls(0).call({from: accounts[0]});

        assert.ok(publicPoll);
    });

    // it('gets non-active polls', async () => {
    //     setTimeout(async function() {
    //         const nonActivePolls = await pollsSmartContract.methods.getNonActivePollResults().call();
    //         assert.ok(nonActivePolls);
    //         done();
    //     }, 2000);
    // }).timeout(10000);

    // it('is rating properly recorded', async () => {
    //     await publicPollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
    //     setTimeout(async function() {
    //         await pollsSmartContract.methods.rate(pollAddresses[2], 5).call();
    //         const rating = await pollsSmartContract.methods.ratings(accounts[0]).call();
            
    //         assert.equal(rating.totalRate, 5);
    //         assert.equal(rating.rateNumber, 1);
    //         done();
    //     }, 2000);
    // }).timeout(10000);
});

describe('PublicPoll smart contract testing', () => {
    it('deploys a public contract', () => {
        assert.ok(publicPollSmartContract.options.address);
    });

    it('is subject properly set', async () => {
        const subject = await publicPollSmartContract.methods.topic().call({from: accounts[0]});
        assert.equal(subject, "test subject", "Subject is not set properly.");
    });

    it('is description properly set', async () => {
        const description = await publicPollSmartContract.methods.description().call({from: accounts[0]});
        assert.equal(description, "test description");
    });

    it('is creator properly set', async () => {
        const creator = await publicPollSmartContract.methods.creator().call({from: accounts[0]});
        assert.equal(creator, accounts[0]);
    });

    it('is deadline greater than duration', async () => {
        const deadline = await publicPollSmartContract.methods.deadline().call({from: accounts[0]});
        assert.ok(deadline > 300);
    });

    it('are proposals properly set', async () => {
        const firstProposal = await publicPollSmartContract.methods.proposals(0).call({from: accounts[0]});
        const secondProposal = await publicPollSmartContract.methods.proposals(1).call({from: accounts[0]});
        const thirdProposal = await publicPollSmartContract.methods.proposals(2).call({from: accounts[0]});

        assert.equal(firstProposal.name, "a");
        assert.equal(secondProposal.name, "b");
        assert.equal(thirdProposal.name, "c");

        assert.equal(firstProposal.voteCount, 0);
        assert.equal(secondProposal.voteCount, 0);
        assert.equal(thirdProposal.voteCount, 0);
    });

    it('has voter properly voted', async () => {
        const isDeadlineExpired = await publicPollSmartContract.methods.isDeadlineExpired().call({from: accounts[1]});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
        const voter = await publicPollSmartContract.methods.voters(accounts[1]).call({from: accounts[1]});
        const proposal = await publicPollSmartContract.methods.proposals(1).call({from: accounts[1]});

        const hasVoted = await publicPollSmartContract.methods.hasVoted(accounts[1]).call({from: accounts[1]});

        assert.equal(isDeadlineExpired, false);
        assert.ok(voter.voted);
        assert.ok(hasVoted);
        assert.equal(voter.vote, 1, "The vote is poorly recorded.");
        assert.equal(proposal.voteCount, 1);
    });

    it('has count of votes properly calculated', async () => {
        await publicPollSmartContract.methods.vote(2).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[2], gas: 3000000});

        const proposal = await publicPollSmartContract.methods.proposals(2).call({from: accounts[1]});

        assert.equal(proposal.voteCount, 3, "Bad calculation.");
    });

    it('are voting results correct', async () => {
        await publicPollSmartContract.methods.vote(0).send({from: accounts[3], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[5], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[2], gas: 3000000});
        await publicPollSmartContract.methods.vote(0).send({from: accounts[4], gas: 3000000});

        const proposals = await publicPollSmartContract.methods.getResults().call({from: accounts[0]});

        assert.equal(proposals[0].voteCount, 2, "Bad calculation.");
        assert.equal(proposals[1].voteCount, 1, "Bad calculation.");
        assert.equal(proposals[2].voteCount, 3, "Bad calculation.");
    });

    it('is winning proposal name correct', async () => {
        await publicPollSmartContract.methods.vote(0).send({from: accounts[3], gas: 3000000});
        await publicPollSmartContract.methods.vote(0).send({from: accounts[5], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[2], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[4], gas: 3000000});

        const winnerName = await publicPollSmartContract.methods.winnerName().call({from: accounts[0]});

        assert.equal(winnerName, "b");
    });

    it('is winning proposal name in special case (the same number of votes) correct', async () => {
        await publicPollSmartContract.methods.vote(0).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.vote(2).send({from: accounts[2], gas: 3000000});

        const winnerName = await publicPollSmartContract.methods.winnerName().call({from: accounts[0]});

        assert.equal(winnerName, "a");
    });

    it('is basic delegating (receiver has not voted yet) correct', async () => {
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});

        const sender = await publicPollSmartContract.methods.voters(accounts[0]).call({from: accounts[0]});
        const receiver = await publicPollSmartContract.methods.voters(accounts[1]).call({from: accounts[0]});

        assert.ok(sender.voted);
        assert.equal(sender.delegate, accounts[1]);
        assert.equal(receiver.delegatingVotesNumber, 1);
    });

    it('is delegating (receiver has already voted) correct', async () => {
        await publicPollSmartContract.methods.vote(1).send({from: accounts[2], gas: 3000000});
        await publicPollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});
        const proposal = await publicPollSmartContract.methods.proposals(1).call({from: accounts[1]});

        assert.equal(proposal.voteCount, 3);
    });

    it('is transitiv delegating (receiver has not voted yet) correct', async () => {
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.delegate(accounts[2]).send({from: accounts[1], gas: 3000000});

        const voter0 = await publicPollSmartContract.methods.voters(accounts[0]).call({from: accounts[0]});
        const voter1 = await publicPollSmartContract.methods.voters(accounts[1]).call({from: accounts[0]});
        const voter2 = await publicPollSmartContract.methods.voters(accounts[2]).call({from: accounts[0]});

        assert.ok(voter0.voted);
        assert.ok(voter1.voted);
        assert.equal(voter0.delegate, accounts[1]);
        assert.equal(voter1.delegate, accounts[2]);
        assert.equal(voter2.delegatingVotesNumber, 2);
    });

    it('is transitiv delegating (receiver has not voted yet, but vote after delegating) correct', async () => {
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.delegate(accounts[2]).send({from: accounts[1], gas: 3000000});

        await publicPollSmartContract.methods.vote(2).send({from: accounts[2], gas: 3000000});

        const proposal = await publicPollSmartContract.methods.proposals(2).call({from: accounts[2]});

        assert.equal(proposal.voteCount, 3);
    });

    it('is transitiv delegating (receiver has already voted) correct', async () => {
        await publicPollSmartContract.methods.vote(1).send({from: accounts[2], gas: 3000000});

        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});
        await publicPollSmartContract.methods.delegate(accounts[2]).send({from: accounts[1], gas: 3000000});

        const proposal = await publicPollSmartContract.methods.proposals(1).call({from: accounts[1]});

        assert.equal(proposal.voteCount, 3);
    });

    it('is transitiv delegating (receiver voted after first delegating) correct', async () => {
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[0], gas: 3000000});    
        await publicPollSmartContract.methods.vote(0).send({from: accounts[1], gas: 3000000});
        await publicPollSmartContract.methods.delegate(accounts[1]).send({from: accounts[2], gas: 3000000});

        const proposal = await publicPollSmartContract.methods.proposals(0).call({from: accounts[1]});

        assert.equal(proposal.voteCount, 3);
    });
});

describe('PrivatePoll smart contract testing', () => {
    it('deploys a private contract', () => {
        assert.ok(privatePollSmartContract.options.address);
    });

    it('are properties properly set', async () => {
        const subject = await privatePollSmartContract.methods.topic().call({from: accounts[0]});
        const description = await privatePollSmartContract.methods.description().call({from: accounts[0]});
        const creator = await privatePollSmartContract.methods.creator().call({from: accounts[0]});
        const deadline = await privatePollSmartContract.methods.deadline().call({from: accounts[0]});
        const firstProposal = await privatePollSmartContract.methods.proposals(0).call({from: accounts[0]});
        const secondProposal = await privatePollSmartContract.methods.proposals(1).call({from: accounts[0]});

        assert.equal(subject, "private subject", "Subject is not set properly.");
        assert.equal(description, "private description");
        assert.equal(creator, accounts[1]);
        assert.ok(deadline > 360);
        assert.equal(firstProposal.name, "op1");
        assert.equal(secondProposal.name, "op2");
        assert.equal(firstProposal.voteCount, 0);
        assert.equal(secondProposal.voteCount, 0);
    });

    it('can voters vote', async () => {
        await privatePollSmartContract.methods.giveRightToVote(accounts[0]).send({from: accounts[1], gas: 3000000});
        const voterCreator = await privatePollSmartContract.methods.voters(accounts[1]).call({from: accounts[0]});
        const voter = await privatePollSmartContract.methods.voters(accounts[0]).call({from: accounts[0]});

        assert.ok(voterCreator.canVote);
        assert.ok(voter.canVote);
    });

    it('has voter properly voted', async () => {
        await privatePollSmartContract.methods.giveRightToVote(accounts[0]).send({from: accounts[1], gas: 3000000});
        await privatePollSmartContract.methods.vote(1).send({from: accounts[0], gas: 3000000});
        const voter = await privatePollSmartContract.methods.voters(accounts[0]).call({from: accounts[0]});

        assert.ok(voter.voted);
        assert.equal(voter.vote, 1);
    });

    it('is vote properly recorded', async () => {
        await privatePollSmartContract.methods.giveRightToVote(accounts[0]).send({from: accounts[1], gas: 3000000});
        await privatePollSmartContract.methods.vote(1).send({from: accounts[0], gas: 3000000});
        const proposal = await privatePollSmartContract.methods.proposals(1).call({from: accounts[0]});
        
        assert.equal(proposal.voteCount, 1);
    });

    it('is winner properly determined', async () => {
        await privatePollSmartContract.methods.giveRightToVote(accounts[0]).send({from: accounts[1], gas: 3000000});
        await privatePollSmartContract.methods.vote(1).send({from: accounts[1], gas: 3000000});
        await privatePollSmartContract.methods.vote(1).send({from: accounts[0], gas: 3000000});
        const proposal = await privatePollSmartContract.methods.proposals(1).call({from: accounts[0]});
        const winnerName = await privatePollSmartContract.methods.winnerName().call({from: accounts[0]});

        assert.equal(proposal.voteCount, 2);
        assert.equal(winnerName, "op2");
    });
});
