const fs = require('fs')
const IncentiveLayer = artifacts.require("./IncentiveLayer.sol")

module.exports = (deployer) => {
  fs.writeFile(__dirname + '/../client/addresses.json', JSON.stringify({
    incentiveLayer: IncentiveLayer.address
  }), (e) => {if(e) console.error(e) })
}