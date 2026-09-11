import { Router } from 'express';

const router = Router();

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
        })
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
        })
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

  // 3. High-speed conversational LLM fallback (Zero key required)
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'openai'
      })
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) return text.trim();
    }
  } catch (e) {
    console.warn('Pollinations fallback failed:', e);
  }

  return `I received your request regarding "${userPrompt}". Please let me know how else I can assist!`;
}

// AI Chatbot Assistant & Smart Tools
router.post('/chat', async (req, res) => {
  const { prompt, mode = 'chat', targetLanguage = 'Spanish' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    let systemPrompt = 'You are Liquid AI, an intelligent, helpful, and friendly chat assistant integrated into LiquidChat. Provide concise, smart answers in clean Markdown.';

    if (mode === 'translate') {
      systemPrompt = `You are a professional language translator. Translate the user's text accurately to ${targetLanguage}. Output only the translation without any preamble or conversational filler.`;
    } else if (mode === 'summarize') {
      systemPrompt = `You are an executive summary assistant. Summarize the user's conversation text concisely with bullet points for key topics, decisions, and action items.`;
    } else if (mode === 'suggest_replies') {
      systemPrompt = `You are a smart reply generator for messaging. Provide exactly 4 natural, context-aware quick reply suggestions for the user's message. Output ONLY a valid JSON array of 4 short strings like ["Yes, let's do it! 👍", "I'll check into it ⚡", "Can you send the link?", "Thanks!"] with no markdown formatting.`;
    }

    let responseText = await callLlm(systemPrompt, prompt);

    if (mode === 'suggest_replies') {
      // Ensure JSON array format
      try {
        const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        JSON.parse(clean);
        responseText = clean;
      } catch (e) {
        responseText = JSON.stringify([
          "Sounds good to me! 👍",
          "Got it, thanks! 🚀",
          "Could you tell me more? 🔍",
          "I will get back to you shortly! ⚡"
        ]);
      }
    }

    res.json({ response: responseText });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

export default router;

