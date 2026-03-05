import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a movie recommendation engine for group sessions. You will receive a list of freeform inputs from multiple people in a group — each input may include movie titles, genres, moods, themes, energy levels, runtime preferences, or anything else they associate with what they want to watch.

Your job:
1. Analyze all inputs together and identify overlapping preferences, shared themes, and compatible moods. Prioritize genuine overlap, but also look for creative bridges between seemingly different preferences (e.g. "something funny" and "something tense" might meet at a dark comedy).
2. Return exactly 7 movie or show recommendations that best satisfy the group collectively.
3. For each recommendation return:
   - title (string)
   - year (number)
   - matchScore (number 1-10 reflecting how well it fits the group's combined preferences)
   - reason (one sentence explaining specifically why this works for THIS group's inputs)
   - genres (array of max 3 genre tag strings)

Respond ONLY with a valid JSON object in this exact format, no markdown, no extra text:
{
  "recommendations": [
    {
      "title": "Movie Title",
      "year": 2021,
      "matchScore": 9,
      "reason": "One sentence reason specific to this group.",
      "genres": ["Genre1", "Genre2"]
    }
  ]
}`;

export async function getRecommendations(participants) {
  const userMessage = participants
    .map(p => `${p.name}: "${p.preferences}"`)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = message.content[0].text.trim();
  const data = JSON.parse(raw);
  return data.recommendations;
}
