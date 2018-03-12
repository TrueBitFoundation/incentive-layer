const fs = require('fs')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const incentiveLayer = new web3.eth.Contract(
  JSON.parse(fs.readFileSync(__dirname + '/../build/contracts/IncentiveLayer.json')).abi,
  JSON.parse(fs.readFileSync(__dirname + '/addresses.json')).incentiveLayer
)

module.exports = {

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
            const randomBits = web3.utils.soliditySha3(Math.floor(Math.random() * 1000000))
            //register for task
            incentiveLayer.methods.registerForTask(task.taskID, randomBits).send(options)
            .on('confirmation', (confirmationNumber, receipt) => {
              //solve task (call to truebit node)
              let solution = {
                solution: web3.utils.soliditySha3(0x0),
                forcedErrorSolution: web3.utils.soliditySha3(0x12345),
                taskID: taskID,
                solver: options.from,
                randomBits: randomBits
              }

              incentiveLayer.commitSolution(solution.taskID, solution.solution, solution.forcedErrorSolution, {from: options.from})
              .on('confirmation', (confirmationNumber, receipt) => {
                console.log("Solution has been committed to task: " + task.taskID)
                solutions.push(solution)//this should instead be a call to the dispute resolution layer client
                
                //wait for state change to reveal solution
                new Promise(async (resolve, reject) => {
                  setInterval(() => {
                    incentiveLayer.getPastEvents('TaskStateChange', {filter: {taskID: solution.taskID, state: 4}, from: blockNumber, toBlock: 'latest'}, (err, results) => {
                      if (results) {
                        //hardcoding true for now
                        incentiveLayer.methods.revealSolution(solution.taskID, true, solution.randomBits).send({from: options.from})
                        resolve()
                      } else if(err) {
                        reject(Error("State change monitoring in verifier monitor failed " + err))
                      }
                    })
                  }, 1000)
                })
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

      incentiveLayer.getPastEvents('SolutionsCommitted', {from: blockNumber, toBlock: 'latest'}, (err, results) => {
        if (results && results.length > 0) {
          //TODO: loop through all results
          console.log(results)
          const result = results[0].returnValues

          if(!(result.taskID in solutions)) {

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
              solutions.push(solution)
              new Promise(async (resolve, reject) => {
                setInterval(() => {
                  incentiveLayer.getPastEvents('TaskStateChange', {filter: {taskID: solution.taskID, state: 3}, from: blockNumber, toBlock: 'latest'}, (err, results) => {
                    if (results) {
                      incentiveLayer.methods.revealIntent(solution.taskID, intent).send({from: options.from})
                      resolve()
                    } else if(err) {
                      reject(Error("State change monitoring in verifier monitor failed " + err))
                    }
                  })
                }, 1000)
              })
            }).on('error', (err, results) => {
              console.log("Unsuccessfully challenged solution for task: " + solution.taskID)
            })
          }

        } else if(err) {
          //something bad must've happened
          throw("Solution monitoring has failed" + err)          
        }
      })
    }, 1000)
  }
}