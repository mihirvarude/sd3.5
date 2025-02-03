import { useState } from "react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null); // To store the Base64 image
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ws = new WebSocket("ws://localhost:8765");

      ws.onopen = () => {
        ws.send(JSON.stringify({ prompt, seed: Math.floor(Math.random() * 1000000) }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
        } else if (data.image) {
          setImage(`data:image/png;base64,${data.image}`); // Display the image
        }

        setIsLoading(false);
        ws.close();
      };

      ws.onerror = () => {
        setError("WebSocket connection failed.");
        setIsLoading(false);
      };

      ws.onclose = () => {
        if (isLoading) setError("WebSocket connection closed unexpectedly.");
      };
    } catch (err) {
      setError("An error occurred while generating the image.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">AI Image Generator</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="border p-2 rounded w-full max-w-md mb-4"
      />
      <button
        onClick={generateImage}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Image"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {image && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Generated Image:</h2>
          <img src={image} alt="Generated" className="border rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}
