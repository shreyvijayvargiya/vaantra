# Making of Aantraa

**aantraa.site** — AI audio & video translation, caption generator, and viral shorts cutter.

---

## Under the Hood

I run a small YouTube channel. I'm not a full-time content creator, but YouTube is a solid platform to gain traffic for your online work, business, project, or idea.

**Aantraa** is what I built in a week. The main concept is simple:

- **Video translation** into multiple languages
- **Audio translation** — including text-to-audio, with MP3 output for Premiere Pro
- **Long-form to shorts** — convert YouTube long-form video into short clips

At that time, only three features were needed, so website development wasn't the heavy lift. The real work was building APIs, backend infrastructure to integrate AI into video, and dealing with heavy storage.

---

## Breaking the execution into steps: How I made Aantraa

### AI LLM layering and provider

Aantraa is heavily dependent on AI APIs — we need reliable infrastructure for LLM providers.

OpenRouter, Portkey, Vercel AI SDK labs, and individual APIs for Anthropic, Deepseek, and OpenAI are solid options.

I prefer **OpenRouter** for Aantraa for one reason: **multiple model support** — it's easy to pick the cheapest capable model for each job. Easy to integrate, strong community support, free model access, and more.

AI LLM APIs are needed at almost every stage in the backend:

- Understanding video context and creating a script
- Translating the script into target languages
- Recording the script into MP3 or WAV format
- Summarising the video
- Generating captions
- Cutting videos into shorts

### Building APIs and servers

Each layer needs heavy AI context and prompt engineering. **Loop engineering** is the trend here — and it's required for aantraa.

For example, **video translation** works in multiple connected steps:

#### Video translation API breakdown

1. AI understands the video, fed into the LLM via the **ffmpeg** module
2. AI generates a script/caption from the video
3. AI translates the script into the desired language
4. AI generates audio (MP3 or WAV) of the new translation
5. AI glues audio and video together using ffmpeg

Each step depends on the previous one, which makes production debugging hard when something breaks.

**Solution:** Track each process — usage tokens, estimated time, errors, and response metadata.

The same pattern applies to audio translation, viral clip cutter, and caption generator.

### Infrastructure and servers

Local API development is manageable until you ship to production.

| Layer | Choice |
|-------|--------|
| Framework | Hono.js |
| Backend hosting | Vercel Edge or Fly.io |
| DevOps | Docker, simple Git CI/CD |
| Database | Firebase / Supabase |
| Storage | UploadThing |

I found **UploadThing** as a practical alternative to AWS S3 and Firebase/Supabase storage for file uploads. It provides client and server SDKs to upload files quickly (5 MB per chunk on the free plan).

We need storage heavily because every AI layer doesn't keep its own memory — every generated audio/video file must land in storage.

**FFmpeg** is essential for video and audio work, but it has limitations on serverless functions and Vercel Edge. That pushed us toward **Fly.io**, Railway, or Render for heavier media workloads.

---

## Video translation into 90+ languages

Aantraa supports **90+ languages** for video and audio translation.

AI translates scripts, text, on-screen text, and video context well — it needs to understand the video through the script and each frame. **FFmpeg** helps with that pipeline.

The flow:

1. AI generates a script from the source
2. AI translates into the target language
3. AI creates dubbed audio in that language
4. FFmpeg merges audio and video into a new translated file

Each step needs debugging, prompt engineering, and FFmpeg integration.

Finally, the output uploads to storage and returns a URL to the client for download and playback.

---

## Audio to MP3 in multiple languages

Aantraa isn't only video translation. As a creator, I also wanted to turn blog posts or text into audio — podcast-style listening.

The **audio translation** tool covers:

- **Text to audio** — download MP3 or WAV
- **90+ languages** for text and video sources
- **Video to audio** extraction and translation
- **Multiple target languages** in parallel

That makes aantraa a supporting platform: one recording → 90+ language MP3s, ready for one-click sharing.

---

## YouTube videos to shorts

The viral shorts feature converts long-form YouTube video into short clips you can upload directly to your channel.

#### API breakdown

1. AI understands the full video context — summary and script
2. AI breaks the script by timestamp into the desired number of shorts
3. FFmpeg cuts each clip; APIs upload to storage

It sounds simple, but production needs FFmpeg tuning, AI context limits, and file-size guardrails — videos over ~10 MB cost more time and money to process.

---

## Video translation examples

See **10+ translated videos** in Spanish, Hindi, Bengali, Gujarati, Marathi, Tamil, French, English, Japanese, Chinese, and more on our [examples page](https://aantraa.site/examples).

90+ languages make aantraa a universal, global platform.

---

## Conclusion

The **first version is live**. We also offer **APIs for business agencies and startup teams** — reach out via [contact](https://aantraa.site/contact) if you're interested.

**Links**

- Website: [aantraa.site](https://aantraa.site)
- Blog: [aantraa.site/blog](https://aantraa.site/blog)
- Examples: [aantraa.site/examples](https://aantraa.site/examples)
- Pricing: [aantraa.site/#pricing](https://aantraa.site/#pricing)

Try the product and share your feedback — early signups get **1 free minute** of AI translation credit.

Cheers,  
**Shrey**  
Aantraa · [aantraa.site](https://aantraa.site)
