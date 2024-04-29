import "dotenv/config";
import OpenAI from "openai";
import { getSupabaseClient } from "./client.js";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";

const assistant_id = process.env.ASSISTANT_ID;
const agent_user_id = process.env.OURO_USER_ID;
const openai_api_key = process.env.OPENAI_API_KEY;

function getMessageJsonFromText(text) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            text: text,
            type: "text",
          },
        ],
      },
    ],
  };
}

async function handleNewMessage(jwt, payload) {
  const openai = new OpenAI({
    apiKey: openai_api_key,
  });

  // If the new message is from self, don't do anything
  if (payload.new.user_id === agent_user_id) return;

  // Otherwise, get a response from OpenAI.
  const supabase = getSupabaseClient(jwt);
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select()
    .eq("id", payload.new.conversation_id)
    .single();

  let thread_id = conversation?.metadata?.thread_id;
  // New conversation, create the thread
  if (!thread_id) {
    const thread = await openai.beta.threads.create();
    thread_id = thread.id;

    await supabase
      .from("conversations")
      .update({ metadata: { ...conversation.metadata, thread_id } })
      .eq("id", payload.new.conversation_id);
  }

  const message = await openai.beta.threads.messages.create(thread_id, {
    role: "user",
    content: payload.new.text,
  });

  let run = await openai.beta.threads.runs.createAndPoll(thread_id, {
    assistant_id: assistant_id,
    tool_choice: { type: "file_search" },
    // instructions: ""
  });

  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data[0];
    const responseText = response.content[0].text.value;

    const html = marked.parse(responseText);
    const json = generateJSON(html, [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ]);

    // Add assistant message to the conversation
    const newMessage = {
      user_id: agent_user_id,
      conversation_id: conversation.id,
      text: responseText,
      json: json,
      //   getMessageJsonFromText(responseText),
    };
    const { error: newMessageError } = await supabase
      .from("messages")
      .insert(newMessage);
    if (newMessageError) console.log(newMessageError);
    console.log("Responded with:", responseText);
  } else {
    console.log(run.status);
  }
}

export { getMessageJsonFromText, handleNewMessage };
