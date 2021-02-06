use std::env;
use std::fs::File;
use std::io::{self, BufRead};

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    println!("Hello, {}", args[1]);
    let mut file = io::BufReader::new(File::open(&args[1])?);
    let mut line = String::new();
    let mut line_count = 0;
    // Skip the header line.
    file.read_line(&mut line)?;
    loop {
        if file.read_line(&mut line)? == 0 {
            break;
        }
        process_line(&line);
        line.clear();
        line_count += 1;
        if line_count >= 10000 {
            break;
        }
    }
    Ok(())
}

fn process_line(line: &String) {
    line.split(",");
}
