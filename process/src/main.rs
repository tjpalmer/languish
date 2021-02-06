use std::{
    collections::HashMap,
    env,
    fs::File,
    io::{self, BufRead},
};

#[derive(Debug, Eq, Hash, PartialEq)]
struct Key {
    name: String,
    year: i32,
    quarter: i32,
}

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    let mut file = io::BufReader::new(File::open(&args[1])?);
    let mut line = String::new();
    let mut line_count = 0;
    let mut counts = HashMap::new();
    loop {
        if file.read_line(&mut line)? == 0 {
            break;
        }
        if line_count > 0 {
            // Past the header line.
            process_line(&line, &mut counts);
        }
        line.clear();
        line_count += 1;
        if line_count >= 10 {
            break;
        }
    }
    Ok(())
}

fn parse_int(parts: &mut std::str::Split<&str>) -> i32 {
    let text = parts.next().unwrap().trim();
    text.parse::<i32>().unwrap()
}

fn process_line(line: &String, counts: &mut HashMap<Key, i32>) {
    let mut parts = line.split(",");
    let tags = parts.next().unwrap().split("|");
    let year = parse_int(&mut parts);
    let quarter = parse_int(&mut parts);
    let count = parse_int(&mut parts);
    for tag in tags {
        let key = Key {name: tag.into(), year, quarter};
        // dbg!(key);
    }
}
