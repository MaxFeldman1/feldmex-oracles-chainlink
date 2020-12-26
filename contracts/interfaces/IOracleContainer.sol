pragma solidity >=0.6.0 <0.7.0;

interface IOracleContainer {
	function tokensToLatestPrice(address _strikeAssetAddress, address _underlyingAssetAddress) external view returns (uint spot, uint8 decimals);
	function phraseToLatestPrice(string calldata _phrase) external view returns (uint spot, uint8 decimals);
	function tokensToHistoricalPrice(address _strikeAssetAddress, address _underlyingAssetAddress, uint _timestamp) external view returns (uint spot, uint8 decimals);
	function phraseToHistoricalPrice(string calldata _phrase, uint _timestamp) external view returns (uint spot, uint8 decimals);
}