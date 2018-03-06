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
    solutions = []//this will eventually be in the dispute resolution client
    const blockNumber = await web3.eth.getBlockNumber()
    return setInterval(() => {
      incentiveLayer.getPastEvents('TaskCreated', {fromBlock: blockNumber, toBlock: 'latest'}, (err, result) => {
        if (result) {
          //TODO: loop through all results
          task = result[0].returnValues
          if (!(task.taskID in tasks)) {
            tasks[task.taskID] = task

            //TODO: check deposit balance to see if have enough for minDeposit

            //register for task
            incentiveLayer.methods.registerForTask(task.taskID, web3.utils.soliditySha3(Math.floor(Math.random() * 1000000))).send(options)
            .on('confirmation', (confirmationNumber, receipt) => {
              //solve task (call to truebit node)
              let solution = {
                solution: web3.utils.soliditySha3(0x0),
                forcedErrorSolution: web3.utils.soliditySha3(0x12345),
                taskID: taskID,
                solver: options.from
              }

              incentiveLayer.commitSolution(solution.taskID, solution.solution, solution.forcedErrorSolution, {from: options.from})
              .on('confirmation', (confirmationNumber, receipt) => {
                console.log("Solution has been committed to task: " + task.taskID)
                solutions.push(solution)//this should instead be a call to the dispute resolution layer client
              })
              .on('error', (confirmationNumber, receipt) => {
                console.log("Solution was not confirmed")
              })

            })
            .on('error', (err) => {
              console.log('Unsuccessfully registered for task: ' + task.taskID)
            })
          }
        } else if(err) {
          //something bad must've happened
          throw("Task monitoring has failed" + err)
        }
      })
    }, 1000)
  },
  monitorSolutions: async (options) => {
    solutions = {}
    const blockNumber = await web3.eth.getBlockNumber()
    return setInterval(() => {
      incentiveLayer.getPastEvents('SolutionsCommitted', {from: blockNumber, toBlock: 'latest'}, (err, result) => {
        if (result) {
          //TODO: loop through all results
          const result = result[0].returnValues

          const solution = {
            taskID: result.taskID,
            taskData: result.taskData,
            solutionHash0: result.solutionHash0,
            solutionHash1: result.solutionHash1
          }

          //TODO: figure out intent
          // - take taskData send to computation-layer, receive result, compare to solutions, choose incorrect solution
          const intent = 0

          incentiveLayer.methods.commitChallenge(solution.taskID, web3.utils.soliditySha3(intent)).send({from: options.from})
          .on('confirmation', (err, result) => {
            console.log("Solution challenged")

            //wait for revealing time
            new Promise(async (resolve, reject) => {
              //when revealing time
              //reveal intent
            })
          }).on('error', (err, results) => {
            console.log("Unsuccessfully challenged solution for task: " + solution.taskID)
          })


        } else if(err) {
          //something bad must've happened
          throw("Task monitoring has failed" + err)          
        }
      })
    })
  }
}

module.exports = clientApi