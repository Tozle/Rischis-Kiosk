"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Willkommen im Kiosk</h1>
      <p>Test-Button:</p>
      <button onClick={() => setCount(count + 1)} className="bg-blue-500 text-white px-4 py-2 rounded">
        Geklickt: {count}
      </button>
    </div>
  );
}
