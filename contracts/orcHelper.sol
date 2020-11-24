pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./Oracle.sol";


contract orcHelper is Ownable {

	struct Info {
		address aggregatorAddress;
		address oracleAddress;
	}

	mapping(address => string) public TickerSymbols;

	mapping(string => Info) public PairInfo;

	function oracleAddresses(address _strikeAssetAddress, address _underlyingAssetAddress) public view returns (address) {
		return PairInfo[string(abi.encodePacked(TickerSymbols[_strikeAssetAddress], '/', TickerSymbols[_underlyingAssetAddress]))].oracleAddress;
	}

	function deploy(address _strikeAssetAddress, address _underlyingAssetAddress) public {
		require(_underlyingAssetAddress != _strikeAssetAddress, "underlying asset must not be the same as strike asset");
		Info memory info = PairInfo[string(abi.encodePacked(TickerSymbols[_strikeAssetAddress], '/', TickerSymbols[_underlyingAssetAddress]))];
		require(info.aggregatorAddress != address(0), "chainlink aggregator must exist to create options chain");
		require(info.oracleAddress == address(0), "cannot deploy oracle that already exists");
		info.oracleAddress = address(new Oracle(info.aggregatorAddress));
	}

	function addTickers(address[] memory _assetAddresses, string[] memory _tickerSymbols) public onlyOwner {
		uint length = _assetAddresses.length;
		require(length == _tickerSymbols.length);
		for (uint i = 0; i < length; i++) {
			require(bytes(TickerSymbols[_assetAddresses[i]]).length == 0);
			TickerSymbols[_assetAddresses[i]] = _tickerSymbols[i];
		}
	}

	function addAggregators(string[] memory _pairTicker, address[] memory _aggregators) public onlyOwner {
		uint length = _pairTicker.length;
		require(length == _aggregators.length);
		for (uint i = 0; i < length; i++) {
			require(bytes(_pairTicker[i])[0] != "/");
			require(bytes(_pairTicker[i])[_pairTicker.length-1] != "/");
			PairInfo[_pairTicker[i]].aggregatorAddress = _aggregators[i];
		}
	}

}