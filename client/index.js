const fs = require('fs')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const incentiveLayer = new web3.eth.Contract(
  JSON.parse(fs.readFileSync(__dirname + '/../build/contracts/IncentiveLayer.json')).abi,
  JSON.parse(fs.readFileSync(__dirname + '/addresses.json')).incentiveLayer
)

let clientApi = {
  incentiveLayer: incentiveLayer,
  web3: web3,
  newDeposit: (options) => {
    return new Promise((resolve, reject) => {
      incentiveLayer.methods.makeDeposit().send({from: options.from, value: options.value})
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log("Deposit confirmed")
        resolve({
          transactionHash: receipt.events.DepositMade.transactionHash, 
          amount: receipt.events.DepositMade.returnValues.amount
        })
      })
    })
  },
  //creates a new task and returns the taskID
  newTask: (minDeposit, taskData, numBlocks, options) => {
    return new Promise((resolve, reject) => {
      incentiveLayer.methods.createTask(minDeposit, web3.utils.asciiToHex(taskData), numBlocks).send(options)
      .on('transactionHash', (hash) => {
        console.log("Task has been created at tx: " + hash)
      })
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log("Task has been confirmed")
        const result = receipt.events.TaskCreated.returnValues
        resolve(result.taskID)
      })
      .on('error', (err) => {
        reject(err);
      })
    })
  },
  monitorTasks: async (options) => {
    tasks = {}
    const blockNumber = await web3.eth.getBlockNumber()
    return setInterval(() => {
      incentiveLayer.getPastEvents('TaskCreated', {fromBlock: blockNumber, toBlock: 'latest'}, (err, result) => {
        if(result) {
          task = result[0].returnValues
          if(!(task.taskID in tasks)) {
            tasks[task.taskID] = task

            //register for task
            incentiveLayer.methods.registerForTask(task.taskID, web3.utils.soliditySha3(Math.floor(Math.random() * 1000000))).send(options)
            .on('confirmation', (confirmationNumber, receipt) => {
              //solve task and then commit solution
            })
            .on('error', (err) => {
              console.log('Unsuccessfully registered for task: ' + task.taskID)
            })
          }
        }
      })
    }, 1000)
  }
}

module.exports = clientApi