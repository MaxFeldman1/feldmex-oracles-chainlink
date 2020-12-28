pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./Oracle.sol";
import "./interfaces/IFeldmexOracle.sol";
import "./interfaces/IOracleContainer.sol";

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV2V3Interface.sol";

contract OracleContainer is Ownable, IOracleContainer {

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
		string memory phrase = string(abi.encodePacked(TickerSymbols[_strikeAssetAddress], '/', TickerSymbols[_underlyingAssetAddress]));
		Info memory info = PairInfo[phrase];
		require(info.aggregatorAddress != address(0), "chainlink aggregator must exist to create options chain");
		require(info.oracleAddress == address(0), "cannot deploy oracle that already exists");
		PairInfo[phrase].oracleAddress = address(new Oracle(info.aggregatorAddress));
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

	function tokensToLatestPrice(address _strikeAssetAddress, address _underlyingAssetAddress) external view override returns (uint spot, uint8 decimals) {
		address aggregatorAddress = PairInfo[string(abi.encodePacked(TickerSymbols[_strikeAssetAddress], '/', TickerSymbols[_underlyingAssetAddress]))].aggregatorAddress;
		//when flip == true we need to return 1/price fetched
		bool flip = aggregatorAddress == address(0);
		if (flip) {
			aggregatorAddress = PairInfo[string(abi.encodePacked(TickerSymbols[_underlyingAssetAddress], '/', TickerSymbols[_strikeAssetAddress]))].aggregatorAddress;
			require(aggregatorAddress != address(0));
		}
		//we can safely assume that the spot will never be negative and that a conversion to uint will be safe.
		spot = uint(AggregatorV2V3Interface(aggregatorAddress).latestAnswer());
		decimals = AggregatorV2V3Interface(aggregatorAddress).decimals();
		if (flip) spot = 10**uint(2*decimals) / spot;
	}


	function phraseToLatestPrice(string calldata _phrase) external view override returns (uint spot, uint8 decimals) {
		address aggregatorAddress = PairInfo[_phrase].aggregatorAddress;
		require(aggregatorAddress != address(0));
		//we can safely assume that the spot will never be negative and that a conversion to uint will be safe.
		spot = uint(AggregatorV2V3Interface(aggregatorAddress).latestAnswer());
		decimals = AggregatorV2V3Interface(aggregatorAddress).decimals();		
	}


	function tokensToHistoricalPrice(address _strikeAssetAddress, address _underlyingAssetAddress, uint _timestamp) external view override returns (uint spot, uint8 decimals) {
		address oracleAddress = PairInfo[string(abi.encodePacked(TickerSymbols[_strikeAssetAddress], '/', TickerSymbols[_underlyingAssetAddress]))].oracleAddress;
		//when flip == true we need to return 1/price fetched
		bool flip = oracleAddress == address(0);
		if (flip) {
			oracleAddress = PairInfo[string(abi.encodePacked(TickerSymbols[_underlyingAssetAddress], '/', TickerSymbols[_strikeAssetAddress]))].oracleAddress;
			require(oracleAddress != address(0));
		}
		spot = IFeldmexOracle(oracleAddress).fetchSpotAtTime(_timestamp);
		decimals = IFeldmexOracle(oracleAddress).decimals();
		if (flip) spot = 10**uint(2*decimals) / spot;
	}


	function phraseToHistoricalPrice(string calldata _phrase, uint _timestamp) external view override returns (uint spot, uint8 decimals) {
		address oracleAddress = PairInfo[_phrase].oracleAddress;
		require(oracleAddress != address(0));
		spot = IFeldmexOracle(oracleAddress).fetchSpotAtTime(_timestamp);
		decimals = IFeldmexOracle(oracleAddress).decimals();
	}


}