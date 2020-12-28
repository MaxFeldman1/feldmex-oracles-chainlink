const OracleContainer = artifacts.require("OracleContainer");
const Oracle = artifacts.require("Oracle");
const dummyAggregator = artifacts.require("dummyAggregator");
const dummyAggregatorFacade = artifacts.require("dummyAggregatorFacade");
const ERC20 = artifacts.require("ERC20");

const defaultAddress = "0x0000000000000000000000000000000000000000";
const helper = require("../helper/helper.js");

contract('OracleContainer', async () => {

	it('before each', async () => {
		asset0 = await ERC20.new();
		asset1 = await ERC20.new();
		/*
			the aggregator addresses listed on the chainlink website are the aggregator facade contract addresses
			which interact with the base aggregator contracts,
			keep this naming convention in mind to prevent confusion
		*/
		baseAggregatorInstance = await dummyAggregator.new("3");
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
	});

	it('add tickers', async () => {
		Ticker0 = "BTC";
		Ticker1 = "USD";
		await containerInstance.addTickers([asset0.address, asset1.address], [Ticker0, Ticker1]);
		assert.equal(await containerInstance.TickerSymbols(asset0.address), Ticker0, "correct ticker for asset0");
		assert.equal(await containerInstance.TickerSymbols(asset1.address), Ticker1, "correct ticker for asset1");
	});

	it('add aggregators', async () => {
		phrase = Ticker0+"/"+Ticker1;
		await containerInstance.addAggregators([phrase], [facadeInstance.address]);
		info = await containerInstance.PairInfo(phrase);
		assert.equal(info.aggregatorAddress, facadeInstance.address, "info.aggregatorAddress is correct");
		assert.equal(info.oracleAddress, defaultAddress, "info.oracleAddress should be null");
	});

	it('deploy Oracle', async () => {
		await containerInstance.deploy(asset0.address, asset1.address);
		info = await containerInstance.PairInfo(phrase);
		assert.equal(info.aggregatorAddress, facadeInstance.address, "info.aggregatorAddress is correct");
		assert.notEqual(info.oracleAddress, defaultAddress, "info.oracleAddress should be non null");
	});

});