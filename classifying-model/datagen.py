import random

productive_templates = [
    "calculus lecture {n} limits introduction",
    "full {topic} course for beginners",
    "how to solve {topic} step by step tutorial",
    "{topic} explained full lecture",
    "university {topic} class recording",
    "cs50 {topic} lecture {n}",
    "machine learning {topic} crash course",
    "deep learning {topic} explained",
    "python {topic} tutorial for beginners",
    "{topic} fundamentals lecture notes",
    "data structures {topic} tutorial",
    "khan academy {topic} lesson {n}",
    "stanford cs229 {topic} lecture",
    "how to implement {topic} in python",
    "research paper explained {topic}",
]

distracting_templates = [
    "funny {topic} compilation 10 hours",
    "tiktok {topic} viral challenge",
    "mrbeast {topic} extreme challenge",
    "epic fails {topic} compilation",
    "youtube shorts {topic} memes",
    "gaming {topic} rage moments",
    "try not to laugh {topic} edition",
    "reacting to {topic} memes",
    "celebrity {topic} drama exposed",
    "instagram reels {topic} edits",
    "netflix {topic} binge review",
    "minecraft {topic} funny moments",
    "fortnite {topic} montage highlights",
    "youtube prank {topic} gone wrong",
]

topics = [
    "python", "calculus", "machine learning", "neural networks",
    "algorithms", "data science", "linear algebra", "statistics",
    "physics", "chemistry", "programming", "web development",
    "pytorch", "tensorflow", "react", "sql"
]

def generate(n=100):
    data = []

    for _ in range(n // 2):
        t = random.choice(productive_templates)
        topic = random.choice(topics)
        n_val = random.randint(1, 20)
        text = t.format(topic=topic, n=n_val)
        data.append((text, 1))

    for _ in range(n // 2):
        t = random.choice(distracting_templates)
        topic = random.choice(topics)
        text = t.format(topic=topic)
        data.append((text, 0))

    random.shuffle(data)
    return data

def save(filename="data.txt", n=100):
    data = generate(n)
    with open(filename, "w") as f:
        for text, label in data:
            f.write(f"{text}\t{label}\n")

if __name__ == "__main__":
    save("data.txt", 200)  # change to 5000, 10000 if you want
    print("Dataset generated!")