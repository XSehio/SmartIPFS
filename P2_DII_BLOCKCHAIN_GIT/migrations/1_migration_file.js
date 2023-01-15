var SmartIPFS = artifacts.require("SmartIPFS");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(SmartIPFS);
};