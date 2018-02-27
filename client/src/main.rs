use std::env;
use std::fs::File;
use std::io::prelude::*;

extern crate serde_json;
use serde_json::{Value, Error};

extern crate ethereum_types;
use ethereum_types::{H160};

extern crate web3;
use web3::contract::{Contract, Options};

use web3::futures::Future;

fn read_json_file(filename: &str) -> Value {
  let file_path = format!("{}{}", env::current_dir().unwrap().display(), filename);
  let mut json_file = File::open(file_path).expect(&format!("{} not found", filename));
  let mut contents = String::new();
  json_file.read_to_string(&mut contents)
      .expect("something went wrong reading the file");
  let v: Value = serde_json::from_str(&contents).unwrap();
  v
}

fn main() {

  let (_eloop, transport) = web3::transports::Http::new("http://localhost:8545").unwrap();
  let web3 = web3::Web3::new(transport);
  let accounts = web3.eth().accounts().wait().unwrap();

  let _balance = web3.eth().balance(accounts[0], None).wait().unwrap();

  let addresses: Value = read_json_file("/addresses.json");

  let incentive_layer_address: H160 = H160::from_slice(addresses["incentiveLayer"].to_string().as_bytes());

  let incentive_layer_abi: &Value = &read_json_file("/../build/contracts/IncentiveLayer.json")["abi"];

  let il = serde_json::to_string(&incentive_layer_abi).unwrap();
  let incentive_layer_contract = Contract::from_json(web3.eth(), incentive_layer_address, il.as_bytes());
  
}