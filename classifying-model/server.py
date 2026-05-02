from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import json
import re

app = FastAPI()

# Allow specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",
        "moz-extension://*",
        "http://localhost:*",
        "https://www.youtube.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model class
class Model(torch.nn.Module):
    def __init__(self, vocab_size, embed_dim):
        super(Model, self).__init__()
        self.embedding = torch.nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.fc = torch.nn.Linear(embed_dim, 1)

    def forward(self, x):
        embedded = self.embedding(x)
        averaged = embedded.mean(dim=1)
        output = self.fc(averaged)
        return output

# Load model and vocab
print("Loading model...")
state_dict = torch.load("trained_model.pth", map_location='cpu')
vocab_size = state_dict['embedding.weight'].shape[0]
embed_dim = state_dict['embedding.weight'].shape[1]

model = Model(vocab_size, embed_dim)
model.load_state_dict(state_dict)
model.eval()

with open("vocab.json", "r") as f:
    vocab = json.load(f)

print(f"Model loaded! Vocab size: {vocab_size}")

def tokenize(text):
    return re.findall(r"[a-zA-Z]+|\d+", text.lower())

def encode(text, max_len=20):
    tokens = tokenize(text)
    encoded = [vocab.get(token, vocab["<unk>"]) for token in tokens]
    if len(encoded) < max_len:
        encoded += [vocab["<pad>"]] * (max_len - len(encoded))
    else:
        encoded = encoded[:max_len]
    return encoded

class PredictRequest(BaseModel):
    title: str
    description: str = ""

@app.post("/predict")
async def predict(request: PredictRequest):
    text = f"{request.title} {request.description}".strip()
    if not text:
        return {"probability": 0.5}
    
    encoded = encode(text)
    input_tensor = torch.tensor(encoded).unsqueeze(0)
    
    with torch.no_grad():
        output = model(input_tensor)
        probability = torch.sigmoid(output).item()
    
    return {"probability": probability}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)