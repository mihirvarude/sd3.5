import asyncio
import websockets
import json
import numpy as np
import random
import torch
from diffusers import DiffusionPipeline
from PIL import Image
import io
import base64

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
model_repo_id = "stabilityai/stable-diffusion-3.5-medium"

pipe = DiffusionPipeline.from_pretrained(model_repo_id, torch_dtype=torch.float32).to(device)

MAX_SEED = np.iinfo(np.int32).max

async def generate_image(websocket, path=None):  # Path is now optional
    try:
        async for message in websocket:
            data = json.loads(message)
            prompt = data.get("prompt", "").strip()
            seed = data.get("seed", random.randint(0, MAX_SEED))

            if not prompt:
                await websocket.send(json.dumps({"error": "Prompt cannot be empty."}))
                continue

            print(f"Generating image for prompt: {prompt} (Seed: {seed})")

            generator = torch.Generator().manual_seed(seed)
            image = pipe(prompt=prompt, guidance_scale=5, num_inference_steps=40).images[0]

            # Convert image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

            # Send image back
            response = json.dumps({"image": img_str, "seed": seed})
            await websocket.send(response)

    except Exception as e:
        print(f"Error: {e}")
        await websocket.send(json.dumps({"error": str(e)}))

async def main():
    async with websockets.serve(generate_image, "localhost", 8765):
        print("✅ WebSocket server started at ws://localhost:8765")
        await asyncio.Future()  # Keep running indefinitely

if __name__ == "__main__":
    asyncio.run(main())  # Correct asyncio usage
