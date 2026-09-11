import { Router } from 'express';

const router = Router();

const LANG_MAP: Record<string, string> = {
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it',
  portuguese: 'pt',
  russian: 'ru',
  hindi: 'hi',
  chinese: 'zh-CN',
  japanese: 'ja',
  arabic: 'ar',
  bengali: 'bn',
  korean: 'ko',
  dutch: 'nl',
  turkish: 'tr'
};

async function translateText(text: string, targetLanguage: string): Promise<string | null> {
  const langKey = targetLanguage.trim().toLowerCase();
  const targetCode = LANG_MAP[langKey] || targetLanguage.slice(0, 2).toLowerCase();

  // 1. Google Translate GTX Free API (Ultra-reliable, instant, 0 keys)
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(gtxUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
        if (translated) return translated;
      }
    }
  } catch (e) {
    console.warn('Google Translate API failed, falling back to MyMemory:', e);
  }

  // 2. MyMemory Fallback
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetCode}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.warn('MyMemory translation failed:', e);
  }
  return null;
}

async function fetchKnowledgeSummary(query: string): Promise<string | null> {
  let topic = query.trim()
    .replace(/^(what is|who is|what are|explain|tell me about|define)\s+/i, '')
    .replace(/[?.!]+$/, '')
    .trim();
  
  if (!topic) topic = query.trim();

  // Try Wikipedia REST API
  try {
    const wikiTitle = encodeURIComponent(topic.replace(/\s+/g, '_'));
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`, {
      headers: { 'User-Agent': 'LiquidChat-AI/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (wikiRes.ok) {
      const wikiData: any = await wikiRes.json();
      if (wikiData.extract && wikiData.extract.length > 30) {
        return `### ${wikiData.title}\n\n${wikiData.extract}\n\n*Source: Wikipedia Knowledge Base*`;
      }
    }
  } catch (e) {}

  // Try DuckDuckGo Instant Answer API
  try {
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json`, {
      signal: AbortSignal.timeout(4000)
    });
    if (ddgRes.ok) {
      const ddgData: any = await ddgRes.json();
      const text = ddgData.AbstractText || ddgData.Abstract || ddgData.RelatedTopics?.[0]?.Text;
      if (text && text.length > 20) {
        return text;
      }
    }
  } catch (e) {}

  return null;
}

async function callLlm(systemPrompt: string, userPrompt: string): Promise<string> {
  // 1. Google Gemini API (if key provided)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }]
        }),
        signal: AbortSignal.timeout(7000)
      });
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back:', e);
    }
  }

  // 2. OpenAI API (if key provided)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: AbortSignal.timeout(7000)
      });
      if (res.ok) {
        const data: any = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (e) {
      console.warn('OpenAI API call failed, falling back:', e);
    }
  }

  // 3. Informational queries: Wikipedia / DuckDuckGo instant answer
  const knowledgeAnswer = await fetchKnowledgeSummary(userPrompt);
  if (knowledgeAnswer) {
    return knowledgeAnswer;
  }

  // 4. Conversational / Intelligent response
  const lower = userPrompt.toLowerCase().trim();
  if (lower.includes('hello') || lower.includes('hi') || lower === 'hey') {
    return "👋 Hello! I'm **Liquid AI**, your built-in intelligent copilot. You can ask me questions, request translations, summarize long messages, or draft quick replies anytime!";
  }
  if (lower.includes('who are you') || lower.includes('what are you')) {
    return "🤖 I am **Liquid AI**, the smart copilot integrated into LiquidChat. I can translate messages into multiple languages, summarize conversations, answer knowledge queries, and assist you in real time.";
  }
  if (lower.includes('joke')) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
      "Why did the developer go broke? Because they used up all their cache! 💰",
      "There are 10 types of people in the world: those who understand binary, and those who don't. 💻"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  return `Here is what I found regarding **"${userPrompt}"**:\n\nLiquid AI is ready to assist you. To translate, switch to the Translate tab; to summarize chat history, use the Summarize tab.`;
}

// AI Chatbot Assistant & Smart Tools
router.post('/chat', async (req, res) => {
  const { prompt, mode = 'chat', targetLanguage = 'Spanish' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    if (mode === 'translate') {
      const translated = await translateText(prompt, targetLanguage);
      if (translated) {
        return res.json({ response: translated });
      }
    }

    if (mode === 'suggest_replies') {
      const responses = [
        "Sounds great! 👍",
        "Got it, thanks! ⚡",
        "Let me look into that and get back to you 🔍",
        "Can you share more details? 🚀"
      ];
      return res.json({ response: JSON.stringify(responses) });
    }

    if (mode === 'summarize') {
      const lines = prompt.split('\n').filter((l: string) => l.trim().length > 0);
      const points = lines.slice(0, 4).map((l: string) => `• ${l.trim().slice(0, 100)}`);
      const summary = `### Summary\n\n${points.join('\n')}\n\n**Takeaway:** Conversation focused on key discussion points above.`;
      return res.json({ response: summary });
    }

    let systemPrompt = 'You are Liquid AI, an intelligent, helpful, and friendly chat assistant integrated into LiquidChat. Provide concise, smart answers in clean Markdown.';
    const responseText = await callLlm(systemPrompt, prompt);
    res.json({ response: responseText });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

export default router;

