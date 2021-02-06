use serde::Deserialize;
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

struct Context<'a> {
    counts: &'a mut HashMap<Key, i32>,
    keys: &'a HashMap<String, String>,
}

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    let mut file = io::BufReader::new(File::open(&args[1])?);
    let keys = read_keys(&args[2])?;
    let mut line = String::new();
    let mut line_count = 0;
    let mut counts = HashMap::new();
    let context = Context{counts: &mut counts, keys: &keys};
    // Use manual read line loop for speed.
    loop {
        if file.read_line(&mut line)? == 0 {
            break;
        }
        if line_count > 0 {
            // Past the header line.
            process_line(&line, &context);
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

fn process_line(line: &String, context: &Context) {
    let mut parts = line.split(",");
    let tags = parts.next().unwrap().split("|");
    let year = parse_int(&mut parts);
    let quarter = parse_int(&mut parts);
    let count = parse_int(&mut parts);
    for tag in tags {
        let entry = context.keys.get(&tag.to_string());
        if let Some(tag_key) = entry {
            let key = Key {
                name: tag_key.clone(),
                year,
                quarter,
            };
            dbg!(key);
        }
    }
}

#[derive(Debug, Deserialize)]
struct Keys {
    key: String,
    reddit: String,
    stackoverflow: String,
    wikipedia: String,
}

fn read_keys(file: &str) -> io::Result<HashMap<String, String>> {
    let mut reader = csv::Reader::from_reader(File::open(&file)?);
    let mut result = HashMap::new();
    for record in reader.deserialize() {
        let keys: Keys = record?;
        result.insert(keys.stackoverflow, keys.key);
    }
    Ok(result)
}
