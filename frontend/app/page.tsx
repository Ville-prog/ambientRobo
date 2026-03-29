"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setOutput(data.result);
    } catch {
      setError("Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <h1 className="text-3xl font-light tracking-widest uppercase text-zinc-400">
          ambientRobo
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded p-4 text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500 h-32"
            placeholder="describe a sound..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="self-end px-6 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 text-sm tracking-widest uppercase rounded transition-colors"
          >
            {loading ? "generating..." : "generate"}
        </button>
        </form>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {output && (
          <pre className="bg-zinc-900 border border-zinc-700 rounded p-4 text-zinc-300 text-sm whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </div>
    </main>
  );
}
