import torch
import torch.nn as nn
import re

"""
These functions process words into integers in a dictionary
"""
def tokenize(text):
    return re.findall(r"[a-zA-Z]+|\d+", text.lower())

def build_vocab(dataset):
    vocab = {"<pad>": 0, "<unk>": 1}
    for text in dataset:
        for word in tokenize(text):
            if word not in vocab:
                vocab[word] = len(vocab)
    return vocab

def encode(text, vocab, max_len):
    tokens = tokenize(text)
    # Convert tokens to integers using the vocabulary, and pad or truncate to max_len
    encoded = [vocab.get(token, vocab["<unk>"]) for token in tokens]
    if len(encoded) < max_len:
        encoded += [vocab["<pad>"]] * (max_len - len(encoded))
    else:
        encoded = encoded[:max_len]
    return encoded

"""
This is a simple feedforward neural network for text classification
"""
class Model(nn.Module):
    # Initialize the model with an embedding layer and a fully connected layer
    def __init__(self, vocab_size, embed_dim):
        super(Model, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.fc = nn.Linear(embed_dim, 1)

    # Define the forward pass of the model
    def forward(self, x):
        # x is a tensor of shape (batch_size, seq_len)
        embedded = self.embedding(x)  # (batch_size, seq_len, embed_dim)
        # Average the embeddings across the sequence length dimension
        averaged = embedded.mean(dim=1)  # (batch_size, embed_dim)
        output = self.fc(averaged)  # (batch_size, 1)
        return output
    

"""
This is a simple training loop for the model
"""
def train_model(model, dataloader, epochs, optimizer, loss_fn):
    model.train()
    for epoch in range(epochs):
        for inputs, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = loss_fn(outputs.view(-1), labels.float())
            loss.backward()
            optimizer.step()
        print(f"Epoch {epoch}, Loss: {loss.item():.4f}")

""" 
This predicts the output for a given input text
"""
def predict(text, model, vocab):
    model.eval()
    # Encode text
    encoded = encode(text, vocab, max_len=20)
    # Convert to tensor
    input_tensor = torch.tensor(encoded).unsqueeze(0)  # (1, seq_len)
    with torch.no_grad():
        # Forward pass
        output = model(input_tensor)
        # Apply sigmoid
        prediction = torch.sigmoid(output).item()
    return prediction

"""
This evaluates the model on a test dataset and returns the accuracy 
"""
def evaluate(model, dataset, vocab):
    model.eval()
    correct = 0
    total = 0

    for text, label in dataset:
        prediction = predict(text, model, vocab)
        predicted_label = 1 if prediction >= 0.5 else 0

        if predicted_label == label:
            correct += 1
        total += 1

    return correct / total if total > 0 else 0

"""
This function runs all previous functions
"""
import random
def run_experiment():
    # 1. Load raw dataset
    raw_dataset = []
    with open("data.txt", "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().rsplit("\t", 1)
            if len(parts) != 2:
                continue
            text = parts[0]
            label = int(parts[1])
            raw_dataset.append((text, label))

    # 2. Shuffle before splitting
    random.shuffle(raw_dataset)

    split_idx = int(0.8 * len(raw_dataset))
    train_data = raw_dataset[:split_idx]
    test_data = raw_dataset[split_idx:]

    train_texts = [text for text, _ in train_data]

    # 3. Build vocab ONLY on training data (important!)
    vocab = build_vocab(train_texts)

    max_len = 10

    # 4. Encode datasets
    train_encoded = [
        (torch.tensor(encode(text, vocab, max_len)),
         torch.tensor(label))
        for text, label in train_data
    ]

    test_encoded = [
        (torch.tensor(encode(text, vocab, max_len)),
         torch.tensor(label))
        for text, label in test_data
    ]

    train_loader = torch.utils.data.DataLoader(train_encoded, batch_size=2, shuffle=True)

    # 5. Model setup
    model = Model(vocab_size=len(vocab), embed_dim=50)
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # 6. Train
    train_model(model, train_loader, epochs=10, optimizer=optimizer, loss_fn=loss_fn)

    # Save model weights for ONNX export
    torch.save(model.state_dict(), "trained_model.pth")
    print("Model saved to trained_model.pth")

    # 7. Evaluate properly (TEST SET)
    accuracy = evaluate(model, test_data, vocab)
    print(f"Test Accuracy: {accuracy:.2f}")


# Run
if __name__ == "__main__":
    run_experiment()
