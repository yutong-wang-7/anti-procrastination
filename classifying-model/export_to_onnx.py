import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='ignore')
import torch
import json
from nn import Model, build_vocab, tokenize

# Load your trained model
state_dict = torch.load("trained_model.pth", map_location='cpu')
vocab_size = state_dict['embedding.weight'].shape[0]
embed_dim = state_dict['embedding.weight'].shape[1]

# Create model and load weights
model = Model(vocab_size, embed_dim)
model.load_state_dict(state_dict)
model.eval()

# Load vocab (you need to save this during training)
# If you don't have vocab.json, create it:
with open("vocab.json", "r") as f:
    vocab = json.load(f)

# Export to ONNX
dummy_input = torch.randint(0, vocab_size, (1, 20))
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    input_names=['input'],
    output_names=['output'],
    opset_version=11
)

print("Exported model.onnx")

import os
size = os.path.getsize("model.onnx")
print(f"model.onnx size: {size:,} bytes ({size/1024/1024:.2f} MB)")