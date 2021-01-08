const OracleContainer = artifacts.require("OracleContainer");
const Oracle = artifacts.require("Oracle");
const dummyAggregator = artifacts.require("dummyAggregator");
const dummyAggregatorFacade = artifacts.require("dummyAggregatorFacade");
const ERC20 = artifacts.require("ERC20");

const defaultAddress = "0x0000000000000000000000000000000000000000";
const helper = require("../helper/helper.js");
const BN = web3.utils.BN;

const decimals = "3";

contract('OracleContainer', async () => {

	it('before each', async () => {
		asset0 = await ERC20.new();
		asset1 = await ERC20.new();
		/*
			the aggregator addresses listed on the chainlink website are the aggregator facade contract addresses
			which interact with the base aggregator contracts,
			keep this naming convention in mind to prevent confusion
		*/
		baseAggregatorInstance = await dummyAggregator.new(decimals);
		facadeInstance = await dummyAggregatorFacade.new(baseAggregatorInstance.address);
		containerInstance = await OracleContainer.new();

		/*
			preset rounds in aggregators
		*/
		prices = ["10000", "20000", "30000"];
		for (let i = 0; i < prices.length; i++) {
			await baseAggregatorInstance.addRound(prices[i]);
			//advance 100 seconds between rounds
			await helper.advanceTime(100);
		}
		firstTime = await baseAggregatorInstance.getTimestamp(0);
	});

	it('add aggregators', async () => {
		Ticker0 = "BTC";
		Ticker1 = "USD";
		phrase = Ticker0+"/"+Ticker1;
		await containerInstance.addAggregators([phrase], [facadeInstance.address]);
		info = await containerInstance.PairInfo(phrase);
		assert.equal(info.baseAggregatorAddress, baseAggregatorInstance.address, "info.baseAggregatorAddress is correct");
		assert.equal(info.oracleAddress, defaultAddress, "info.oracleAddress should be null");
	});

	it('deploy Oracle', async () => {
		await containerInstance.deploy(phrase);
		info = await containerInstance.PairInfo(phrase);
		assert.equal(info.baseAggregatorAddress, baseAggregatorInstance.address, "info.baseAggregatorAddress is correct");
		assert.notEqual(info.oracleAddress, defaultAddress, "info.oracleAddress should be non null");
		oracleInstance = await Oracle.at(info.oracleAddress);
	});

	it('phrase to latest price', async () => {
		let res = await containerInstance.phraseToLatestPrice(phrase);
		assert.equal(res.spot.toString(), prices[prices.length-1], "correct value of spot returned from phraseToHistoricalPrice()");
		assert.equal(res.decimals.toString(), decimals, "correct value of decimals returned from phraseToHistoricalPrice()");
	});

	it('phrase to historical price', async () => {
		let res = await containerInstance.phraseToHistoricalPrice(phrase, firstTime.toString());
		assert.equal(res.spot.toString(), prices[0], "correct value of spot retuend from phraseToHistoricalPrice()");
		assert.equal(res.decimals.toString(), decimals, "correct value of decimals retuend from phraseToHistoricalPrice()");
	});

});