use std::env;
use std::fs::File;
use std::io::{self, BufRead};

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    println!("Hello, {}", args[1]);
    let file = File::open(&args[1])?;
    let lines = io::BufReader::new(file).lines();
    for line_result in lines.skip(1).take(10000) {
        let line = line_result?;
        process_line(&line);
    }
    Ok(())
}

fn process_line(line: &String) {
    line.split(",");
}
