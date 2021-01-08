const Oracle = artifacts.require("Oracle");
const dummyAggregator = artifacts.require("dummyAggregator");
const dummyAggregatorFacade = artifacts.require("dummyAggregatorFacade");

const helper = require("../helper/helper.js");

const decimals = "3";

const Ticker0 = "BTC";
const Ticker1 = "USD";
const phrase = Ticker0+"/"+Ticker1;


contract('oracle', function(accounts){

	it('before each', async () => {
		baseAggregatorInstance = await dummyAggregator.new(decimals);

		oracleInstance = await Oracle.new(baseAggregatorInstance.address);

		heights = [await web3.eth.getBlockNumber()];
		timestamps = [(await web3.eth.getBlock(heights[0])).timestamp];

		await helper.advanceTime(2);
	});

	async function setPrice(spot) {
		let rec = await baseAggregatorInstance.addRound(spot);
		let ts = (await web3.eth.getBlock(rec.receipt.blockNumber)).timestamp;
		heights.push(rec.receipt.blockNumber);
		timestamps.push(ts);
	}

	async function heightToPrevTs(height) {
		index = heights.indexOf(height);
		return await indexToSpot(index);
	}

	async function heightToPrevSpot(height) {
		latest = await getBlockNumber();
		height = height > latest ? latest : height;
		ts = (await web3.eth.getBlock(height)).timestamp;
		ts += height > latest ? 100 : 0;
		return await tsToPrevSpot(ts);
	}

	async function tsToPrevSpot(time) {
		return (await oracleInstance.fetchSpotAtTime(time)).toNumber();
	}

	async function indexToSpot(index) {
		return (await baseAggregatorInstance.getAnswer(index)).toNumber();
	}

	//in solidity block.number is always height of the next block, in web3 it is height of prev block
	function getBlockNumber() {
		return web3.eth.getBlockNumber();
	}


	it('sets and fetches spot price', async () => {
		spot = 5
		secondSpot = 7;
		await setPrice(spot);
		blockSetSpot = await getBlockNumber();
		await helper.advanceTime(2);
		res = (await heightToPrevSpot(heights[1]));
		assert.equal(res, spot, "getUint(uint) fetches the latest spot price");
		await setPrice(secondSpot);
		blockSetSecondSpot = await getBlockNumber();
		await helper.advanceTime(2);
		//note that we have not updated the value of height yet
		res = (await heightToPrevSpot(heights[1]));
		assert.equal(res, spot, "getUint(uint) can fetch previous values");
		//we are now feching the price of the blocks after setting the spot a second time
		res = (await heightToPrevSpot(blockSetSecondSpot+5));
		assert.equal(res, secondSpot, "getUint(uint) can fetch the most recent spot");
		res = (await heightToPrevSpot(heights[0]-1));
		assert.equal(res, 0, "getUint(uint) returns 0 when there are no previous spot prices");
		res = await web3.eth.getBlock('latest');
		height = res.number;
		time = res.timestamp;
		result = (await heightToPrevSpot(height));
		res  = await heightToPrevTs(height);
		assert.equal(res <= time, true, "returns the correct timestamp");
		await setPrice(1);
		blockSet1 = await getBlockNumber();
		await helper.advanceTime(2);
		await setPrice(5);
		blockSet5 = await getBlockNumber();
		await helper.advanceTime(2);
		await setPrice(6);
		blockSet6 = await getBlockNumber();
		res = await web3.eth.getBlock('latest');
		diff = res.timestamp-time;
		time = res.timestamp;
		height = res.number;
		res = (await tsToPrevSpot(time));
		assert.equal(res, 6, "correct spot");
		newTime = (await web3.eth.getBlock(blockSet1)).timestamp+1;
		res = (await tsToPrevSpot(newTime));
		assert.equal(res, 1, "correct spot");
		newTime = (await web3.eth.getBlock(blockSet5)).timestamp+1;
		res = (await tsToPrevSpot(newTime));
		assert.equal(res, 5, "correct spot");
		newTime = (await web3.eth.getBlock(blockSetSpot)).timestamp;
		spotTime = newTime;
		res = (await tsToPrevSpot(newTime));
		assert.equal(res, spot, "correct spot");
		newTime = (await web3.eth.getBlock(blockSetSecondSpot)).timestamp;
		res = (await tsToPrevSpot(newTime));
		assert.equal(res, secondSpot, "correct spot");
		res = (await tsToPrevSpot(spotTime-4));
		assert.equal(res, 0, "correct spot");
	});

});