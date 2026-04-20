const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are a compassionate mental health AI assistant for CareLink, a healthcare platform.
Your role is to provide emotional support, evidence-based coping strategies (CBT, mindfulness, breathing exercises),
and help users understand their emotions. Never diagnose or prescribe medication.
Keep responses concise (2-4 sentences) and conversational. Be empathetic and non-judgmental.
If someone expresses suicidal thoughts or self-harm, immediately encourage them to call emergency services.`;

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const history: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT }
];

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        history.push({ role: 'user', content: message });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: history,
                temperature: 0.7,
                max_tokens: 256,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Groq API error:', response.status, err);
            throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

        history.push({ role: 'assistant', content: text });
        return text;
    } catch (error: any) {
        console.error('Groq API error:', error?.message, error);
        history.pop();
        throw new Error('Failed to get AI response. Please try again.');
    }
};

export const resetChat = () => {
    history.splice(1); // keep system prompt, clear the rest
};
