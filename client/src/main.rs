use std::env;
use std::fs::File;
use std::io::prelude::*;

fn main() {

    let addresses_path = format!("{}/addresses.json", env::current_dir().unwrap().display());

    let mut addresses_file = File::open(addresses_path).expect("./addresses.json not found");

    // let mut contents = String::new();
    // f.read_to_string(&mut contents)
    //     .expect("something went wrong reading the file");

    // println!("With text:\n{}", contents);
}