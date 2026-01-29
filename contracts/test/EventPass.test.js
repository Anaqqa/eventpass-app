const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EventPass", function () {
  let eventPass;
  let owner, buyer1, buyer2, buyer3;
  
  const EARLY_BIRD_PRICE = ethers.parseEther("0.08");
  const STANDARD_PRICE = ethers.parseEther("0.1");
  const PREMIUM_PRICE = ethers.parseEther("0.15");
  const VIP_PRICE = ethers.parseEther("0.25");
  
  const COOLDOWN = 5 * 60; // 5 minutes
  const LOCK = 10 * 60;    // 10 minutes
  
  beforeEach(async function () {
    [owner, buyer1, buyer2, buyer3] = await ethers.getSigners();
    
    const EventPass = await ethers.getContractFactory("EventPass");
    eventPass = await EventPass.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await eventPass.owner()).to.equal(owner.address);
    });

    it("Should initialize ticket prices correctly", async function () {
      expect(await eventPass.ticketPrices(0)).to.equal(EARLY_BIRD_PRICE);
      expect(await eventPass.ticketPrices(1)).to.equal(STANDARD_PRICE);
      expect(await eventPass.ticketPrices(2)).to.equal(PREMIUM_PRICE);
      expect(await eventPass.ticketPrices(3)).to.equal(VIP_PRICE);
    });
  });

  describe("Ticket Purchase", function () {
    it("Should mint a ticket with correct metadata", async function () {
      const tokenURI = "ipfs://QmTest123";
      
      await expect(
        eventPass.connect(buyer1).buyTicket(0, tokenURI, { value: EARLY_BIRD_PRICE })
      )
        .to.emit(eventPass, "TicketPurchased")
        .withArgs(buyer1.address, 1, 0, EARLY_BIRD_PRICE);
      
      expect(await eventPass.ownerOf(1)).to.equal(buyer1.address);
      expect(await eventPass.tokenURI(1)).to.equal(tokenURI);
      expect(await eventPass.balanceOf(buyer1.address)).to.equal(1);
    });

    it("Should reject purchase with insufficient payment", async function () {
      await expect(
        eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
          value: ethers.parseEther("0.05") 
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const overpayment = ethers.parseEther("0.2");
      const balanceBefore = await ethers.provider.getBalance(buyer1.address);
      
      const tx = await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: overpayment 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(buyer1.address);
      const expectedBalance = balanceBefore - EARLY_BIRD_PRICE - gasUsed;
      
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
  });

  describe("Max 4 Tickets Per Wallet", function () {
    it("Should allow buying up to 4 tickets", async function () {
      for (let i = 0; i < 4; i++) {
        await time.increase(COOLDOWN);
        await eventPass.connect(buyer1).buyTicket(0, `ipfs://test${i}`, { 
          value: EARLY_BIRD_PRICE 
        });
      }
      
      expect(await eventPass.balanceOf(buyer1.address)).to.equal(4);
    });

    it("Should reject 5th ticket purchase", async function () {
      for (let i = 0; i < 4; i++) {
        await time.increase(COOLDOWN);
        await eventPass.connect(buyer1).buyTicket(0, `ipfs://test${i}`, { 
          value: EARLY_BIRD_PRICE 
        });
      }
      
      await time.increase(COOLDOWN);
      await expect(
        eventPass.connect(buyer1).buyTicket(0, "ipfs://test5", { 
          value: EARLY_BIRD_PRICE 
        })
      ).to.be.revertedWith("Max 4 tickets per wallet");
    });
  });

  describe("Cooldown Period (5 minutes)", function () {
    it("Should enforce 5-minute cooldown between transactions", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test1", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await expect(
        eventPass.connect(buyer1).buyTicket(0, "ipfs://test2", { 
          value: EARLY_BIRD_PRICE 
        })
      ).to.be.revertedWith("Cooldown period not elapsed");
    });

    it("Should allow transaction after cooldown", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test1", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await time.increase(COOLDOWN);
      
      await expect(
        eventPass.connect(buyer1).buyTicket(0, "ipfs://test2", { 
          value: EARLY_BIRD_PRICE 
        })
      ).to.not.be.reverted;
    });

    it("Should check canTransact view function", async function () {
      expect(await eventPass.canTransact(buyer1.address)).to.be.true;
      
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      expect(await eventPass.canTransact(buyer1.address)).to.be.false;
      
      await time.increase(COOLDOWN);
      
      expect(await eventPass.canTransact(buyer1.address)).to.be.true;
    });
  });

  describe("Lock Period (10 minutes)", function () {
    it("Should prevent listing within 10 minutes of purchase", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await expect(
        eventPass.connect(buyer1).listForResale(1, EARLY_BIRD_PRICE)
      ).to.be.revertedWith("Ticket locked for 10 minutes after purchase");
    });

    it("Should allow listing after 10 minutes", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await time.increase(LOCK);
      
      await expect(
        eventPass.connect(buyer1).listForResale(1, EARLY_BIRD_PRICE)
      ).to.not.be.reverted;
    });

    it("Should check canTransfer view function", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      expect(await eventPass.canTransfer(1)).to.be.false;
      
      await time.increase(LOCK);
      
      expect(await eventPass.canTransfer(1)).to.be.true;
    });
  });

  describe("Resale Market", function () {
    beforeEach(async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      await time.increase(LOCK);
    });

    it("Should list ticket for resale", async function () {
      const resalePrice = ethers.parseEther("0.09");
      
      await expect(
        eventPass.connect(buyer1).listForResale(1, resalePrice)
      )
        .to.emit(eventPass, "TicketListed")
        .withArgs(buyer1.address, 1, resalePrice);
    });

    it("Should reject resale price exceeding 20% markup", async function () {
      const tooHighPrice = ethers.parseEther("0.1"); // 25% markup
      
      await expect(
        eventPass.connect(buyer1).listForResale(1, tooHighPrice)
      ).to.be.revertedWith("Price exceeds 20% markup limit");
    });

    it("Should allow exactly 20% markup", async function () {
      const maxPrice = (EARLY_BIRD_PRICE * 120n) / 100n;
      
      await expect(
        eventPass.connect(buyer1).listForResale(1, maxPrice)
      ).to.not.be.reverted;
    });

    it("Should complete resale transaction", async function () {
      const resalePrice = ethers.parseEther("0.09");
      
      await eventPass.connect(buyer1).listForResale(1, resalePrice);
      
      await time.increase(COOLDOWN);
      
      await expect(
        eventPass.connect(buyer2).buyResale(1, { value: resalePrice })
      )
        .to.emit(eventPass, "TicketResold")
        .withArgs(buyer1.address, buyer2.address, 1, resalePrice);
      
      expect(await eventPass.ownerOf(1)).to.equal(buyer2.address);
    });

    it("Should prevent second resale", async function () {
      const resalePrice = ethers.parseEther("0.09");
      
      // First resale
      await eventPass.connect(buyer1).listForResale(1, resalePrice);
      await time.increase(COOLDOWN);
      await eventPass.connect(buyer2).buyResale(1, { value: resalePrice });
      
      // Try second resale
      await time.increase(LOCK);
      await expect(
        eventPass.connect(buyer2).listForResale(1, resalePrice)
      ).to.be.revertedWith("Ticket already resold once");
    });
  });

  describe("Ticket Validation", function () {
    it("Should validate and burn ticket", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await expect(
        eventPass.connect(buyer1).validateAndBurn(1)
      )
        .to.emit(eventPass, "TicketValidated")
        .withArgs(1, buyer1.address);
      
      await expect(
        eventPass.validateAndBurn(1)
      ).to.be.reverted;
    });

    it("Should reject validation by non-owner", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      await expect(
        eventPass.connect(buyer2).validateAndBurn(1)
      ).to.be.revertedWith("Not ticket owner");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update prices", async function () {
      const newPrice = ethers.parseEther("0.12");
      
      await eventPass.updateTicketPrice(0, newPrice);
      
      expect(await eventPass.ticketPrices(0)).to.equal(newPrice);
    });

    it("Should reject price update from non-owner", async function () {
      await expect(
        eventPass.connect(buyer1).updateTicketPrice(0, ethers.parseEther("0.12"))
      ).to.be.reverted;
    });

    it("Should allow owner to withdraw funds", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      
      const contractBalance = await ethers.provider.getBalance(eventPass.target);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await eventPass.withdraw();
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return ticket price by type", async function () {
      expect(await eventPass.getTicketPrice(0)).to.equal(EARLY_BIRD_PRICE);
      expect(await eventPass.getTicketPrice(1)).to.equal(STANDARD_PRICE);
      expect(await eventPass.getTicketPrice(2)).to.equal(PREMIUM_PRICE);
      expect(await eventPass.getTicketPrice(3)).to.equal(VIP_PRICE);
    });

    it("Should return listing details", async function () {
      await eventPass.connect(buyer1).buyTicket(0, "ipfs://test", { 
        value: EARLY_BIRD_PRICE 
      });
      await time.increase(LOCK);
      
      const resalePrice = ethers.parseEther("0.09");
      await eventPass.connect(buyer1).listForResale(1, resalePrice);
      
      const listing = await eventPass.getListing(1);
      
      expect(listing.tokenId).to.equal(1);
      expect(listing.seller).to.equal(buyer1.address);
      expect(listing.price).to.equal(resalePrice);
      expect(listing.active).to.be.true;
    });
  });
});
