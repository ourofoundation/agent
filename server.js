import express from "express";

import "dotenv/config";
import { handleNewMessage } from "./lib/utils.js";
import { getSupabaseClient, getTokenFromPAT } from "./lib/client.js";

const agent_api_key = process.env.AGENT_API_KEY;

// Create an instance of express
const app = express();

// Define a route. In this case, the root URL '/'.
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// Set the server to listen on port 8005
app.listen(8005, () => {
  console.log("Server running on http://localhost:8005");
});

// TODO: would want to do this on server side
if (agent_api_key) {
  const jwt = await getTokenFromPAT(agent_api_key);
  const supabase = getSupabaseClient(jwt);

  supabase
    .channel("messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        handleNewMessage(jwt, payload);
      }
    )
    .subscribe();
} else throw new Error("No agent API key provided");
