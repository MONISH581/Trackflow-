# run_gemma.py
"""Simple script to generate text using the Gemma 4-E4B-it model.

Usage:
  python run_gemma.py "Your prompt here"

The script loads the model with automatic device placement and prints the generated
completion to stdout.
"""

import sys
import json
# pyrefly: ignore [missing-import]
from transformers import AutoProcessor, AutoModelForCausalLM

MODEL_ID = "google/gemma-4-E4B-it"

# Load processor and model
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype="auto",
    device_map="auto",
)

def generate(prompt: str) -> str:
    inputs = processor(prompt, return_tensors="pt")
    generation = model.generate(**inputs, max_new_tokens=256, do_sample=True, temperature=0.7)
    return processor.decode(generation[0], skip_special_tokens=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_gemma.py \"Your prompt\"")
        sys.exit(1)
    prompt_text = " ".join(sys.argv[1:])
    result = generate(prompt_text)
    print(result)
