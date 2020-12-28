const OracleContainer = artifacts.require("OracleContainer");
const Oracle = artifacts.require("Oracle");
const dummyAggregator = artifacts.require("dummyAggregator");
const dummyAggregatorFacade = artifacts.require("dummyAggregatorFacade");

var KovanTickerSymbols = {};
const KovanOracleMappings = {
	'BTC/USD': "0x0000000000000000000000000000000000000000",
	'ETH/USD': "0x0000000000000000000000000000000000000000",
};

module.exports = async function(deployer) {
	aggregatorInstance = await deployer.deploy(dummyAggregator, "3");
	aggregatorInstance = await deployer.deploy(dummyAggregator, "3");
	facadeInstance = await deployer.deploy(dummyAggregatorFacade, aggregatorInstance.address);
};
