pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./Oracle.sol";
import "./interfaces/IFeldmexOracle.sol";
import "./interfaces/IOracleContainer.sol";
import "./interfaces/IAggregatorFacade.sol";

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV2V3Interface.sol";

contract OracleContainer is Ownable, IOracleContainer {

	struct Info {
		address baseAggregatorAddress;
		address oracleAddress;
	}

	mapping(string => Info) public PairInfo;

	function deploy(string memory _phrase) public {
		Info memory info = PairInfo[_phrase];
		require(info.baseAggregatorAddress != address(0), "chainlink aggregator must exist to create options chain");
		require(info.oracleAddress == address(0), "cannot deploy oracle that already exists");
		PairInfo[_phrase].oracleAddress = address(new Oracle(info.baseAggregatorAddress));
	}

	function addAggregators(string[] memory _pairTicker, address[] memory _facades) public onlyOwner {
		uint length = _pairTicker.length;
		require(length == _facades.length);
		for (uint i = 0; i < length; i++) {
			require(bytes(_pairTicker[i])[0] != "/");
			require(bytes(_pairTicker[i])[_pairTicker.length-1] != "/");
			PairInfo[_pairTicker[i]].baseAggregatorAddress = address(IAggregatorFacade(_facades[i]).aggregator());
		}
	}

	function phraseToLatestPrice(string calldata _phrase) external view override returns (uint spot, uint8 decimals) {
		address baseAggregatorAddress = PairInfo[_phrase].baseAggregatorAddress;
		require(baseAggregatorAddress != address(0));
		//we can safely assume that the spot will never be negative and that a conversion to uint will be safe.
		spot = uint(AggregatorV2V3Interface(baseAggregatorAddress).latestAnswer());
		decimals = AggregatorV2V3Interface(baseAggregatorAddress).decimals();
	}

	function phraseToHistoricalPrice(string calldata _phrase, uint _timestamp) external view override returns (uint spot, uint8 decimals) {
		address oracleAddress = PairInfo[_phrase].oracleAddress;
		require(oracleAddress != address(0));
		spot = IFeldmexOracle(oracleAddress).fetchSpotAtTime(_timestamp);
		decimals = IFeldmexOracle(oracleAddress).decimals();
	}

}