use std::env;
use std::fs::File;
use std::io::{self, BufRead};

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    println!("Hello, {}", args[1]);
    let file = File::open(&args[1])?;
    let lines = io::BufReader::new(file).lines();
    for line_result in lines {
        let line = line_result?;
    }
    Ok(())
}
