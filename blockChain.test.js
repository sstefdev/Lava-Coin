const Blockchain = require("./blockChain");
const Block = require("./block");
const cryptoHash = require("./cryptoHash");

describe("Blockchain", () => {
  let blockChain, newChain, originalChain;

  beforeEach(() => {
    blockChain = new Blockchain();
    newChain = new Blockchain();

    originalChain = blockChain.chain;
  });

  it("contains a `chain` Array instance", () => {
    expect(blockChain.chain instanceof Array).toBe(true);
  });

  it("starts with the genesis block", () => {
    expect(blockChain.chain[0]).toEqual(Block.genesis());
  });

  it("adds a new block to the chain", () => {
    const newData = "foo bar";
    blockChain.addBlock({ data: newData });

    expect(blockChain.chain[blockChain.chain.length - 1].data).toEqual(newData);
  });

  describe("isValidChain()", () => {
    describe("when the chain does not start with the genesis block", () => {
      it("returns false", () => {
        blockChain.chain[0] = { data: "fake-genesis" };

        expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
      });
    });

    describe("when the chain starts with the genesis block and has multiple blocks", () => {
      beforeEach(() => {
        blockChain.addBlock({ data: "Bears" });
        blockChain.addBlock({ data: "Beats" });
        blockChain.addBlock({ data: "Battlestar Galactica" });
      });

      describe("and a lastHash refrence has changed", () => {
        it("returns false", () => {
          blockChain.chain[2].lastHash = "broken-lastHash";

          expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with an invalid field", () => {
        it("returns false", () => {
          blockChain.chain[2].data = "some-bad-and-evil-data";

          expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with a jumped difficulty", () => {
        it("returns false", () => {
          const lastBlock = blockChain.chain[blockChain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const data = [];
          const difficulty = lastBlock.difficulty - 3;

          const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);

          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nonce,
            difficulty,
            data,
          });

          blockChain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
        });
      });

      describe("and the chain does not contain any invalid blocks", () => {
        it("returns false", () => {
          expect(Blockchain.isValidChain(blockChain.chain)).toBe(true);
        });
      });
    });
  });

  describe("replaceChain()", () => {
    let errorMock, logMock;

    beforeEach(() => {
      errorMock = jest.fn();
      logMock = jest.fn();

      global.console.error = errorMock;
      global.console.log = logMock;
    });

    describe("when the new chain is not longer", () => {
      beforeEach(() => {
        newChain.chain[0] = { new: "chain" };

        blockChain.replaceChain(newChain.chain);
      });

      it("does not replace the chain", () => {
        expect(blockChain.chain).toEqual(originalChain);
      });

      it("logs an error", () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe("when the new chain is longer", () => {
      beforeEach(() => {
        newChain.addBlock({ data: "Bears" });
        newChain.addBlock({ data: "Beats" });
        newChain.addBlock({ data: "Battlestar Galactica" });
      });

      describe("and the chain is invalid", () => {
        beforeEach(() => {
          newChain.chain[2].hash = "some-fake-hash";

          blockChain.replaceChain(newChain.chain);
        });

        it("does not replace the chain", () => {
          expect(blockChain.chain).toEqual(originalChain);
        });

        it("logs an error", () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe("and the chain is valid", () => {
        beforeEach(() => {
          blockChain.replaceChain(newChain.chain);
        });

        it("replaces the chain", () => {
          expect(blockChain.chain).toEqual(newChain.chain);
        });

        it("logs about the chain replacement", () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });
  });
});
