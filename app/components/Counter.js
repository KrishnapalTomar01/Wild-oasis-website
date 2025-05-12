"use client";

import { useState } from "react";

export default function Counter({ users }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>There are {users.length} users</div>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
}
