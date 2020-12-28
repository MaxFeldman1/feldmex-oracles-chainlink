pragma solidity >=0.6.0;

import "../interfaces/IAggregatorFacade.sol";

contract dummyAggregatorFacade is IAggregatorFacade {
	AggregatorV2V3Interface public override aggregator;

	constructor (address _aggregatorAddress) public {
		aggregator = AggregatorV2V3Interface(_aggregatorAddress);
	}
}