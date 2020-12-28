const OracleContainer = artifacts.require("OracleContainer");
const Oracle = artifacts.require("Oracle");
const dummyAggregator = artifacts.require("dummyAggregator");
const dummyAggregatorFacade = artifacts.require("dummyAggregatorFacade");
const ERC20 = artifacts.require("ERC20");

const defaultAddress = "0x0000000000000000000000000000000000000000";

contract('OracleContainer', async () => {

	it('before each', async () => {
		asset0 = await ERC20.new();
		asset1 = await ERC20.new();
		aggregatorInstance = await dummyAggregator.new("3");
		facadeInstance = await dummyAggregatorFacade.new(aggregatorInstance.address);
		containerInstance = await OracleContainer.new();
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