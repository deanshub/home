import OpenAI from "openai";
import { getOrThrow } from "./getOrThrow";
import type { FsReadStream } from "openai/_shims/index.mjs";

const openai = new OpenAI({
  apiKey: getOrThrow("OPENAI_API_KEY"),
});

export async function talk({ text }: { text: string }) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: text }],
    model: "gpt-4",
    stream: false,
  });

  return chatCompletion.choices[0].message.content;
}

export async function image({ text }: { text: string }) {
  const img = await openai.images.generate({
    prompt: text,
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });
  return img.data[0].url;
}

export async function alternateImage({ file }: { file: FsReadStream }) {
  const img = await openai.images.createVariation({
    image: file,
    // model: "dall-e-2",
    // model: "dall-e-3",
    // size: "1024x1024",
    // n: 1,
  });
  return img.data[0].url;
}
