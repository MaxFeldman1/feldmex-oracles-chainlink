const orcHelper = artifacts.require("orcHelper");

var KovanTickerSymbols = {};
const KovanOracleMappings = {
	'BTC/USD': "0x6135b13325bfC4B00278B4abC5e20bbce2D6580e",
	'ETH/USD': "0x9326BFA02ADD2366b30bacB125260Af641031331",
};

/*
	TickerSymbols[address(asset)] => ticker symbol of asset

	OracleMappings[TickerSymbols[address(asset0)] + '/' + TickerSymbols[address(asset1)]] => address(oracle)
*/

module.exports = function(deployer) {
  deployer.deploy(orcHelper);
};
