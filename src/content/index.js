import {
  GRAMMAR_BEGINNER, VOCAB_BEGINNER, READING_BEGINNER,
  MISTAKES_BEGINNER, QUIZ_BEGINNER, PEEL_BEGINNER
} from './beginner';

import {
  GRAMMAR_INTERMEDIATE, VOCAB_INTERMEDIATE, READING_INTERMEDIATE,
  MISTAKES_INTERMEDIATE, QUIZ_INTERMEDIATE, PEEL_INTERMEDIATE
} from './intermediate';

import {
  GRAMMAR_ADVANCED, VOCAB_ADVANCED, READING_ADVANCED,
  MISTAKES_ADVANCED, QUIZ_ADVANCED, PEEL_ADVANCED
} from './advanced';

export const CONTENT = {
  Beginner: {
    grammar:    GRAMMAR_BEGINNER,
    vocabulary: VOCAB_BEGINNER,
    reading:    READING_BEGINNER,
    mistakes:   MISTAKES_BEGINNER,
    quiz:       QUIZ_BEGINNER,
    peel:       PEEL_BEGINNER,
  },
  Intermediate: {
    grammar:    GRAMMAR_INTERMEDIATE,
    vocabulary: VOCAB_INTERMEDIATE,
    reading:    READING_INTERMEDIATE,
    mistakes:   MISTAKES_INTERMEDIATE,
    quiz:       QUIZ_INTERMEDIATE,
    peel:       PEEL_INTERMEDIATE,
  },
  Advanced: {
    grammar:    GRAMMAR_ADVANCED,
    vocabulary: VOCAB_ADVANCED,
    reading:    READING_ADVANCED,
    mistakes:   MISTAKES_ADVANCED,
    quiz:       QUIZ_ADVANCED,
    peel:       PEEL_ADVANCED,
  },
};

// ── Rotation sans répétition (suivi Supabase) ──────────────────────────────
const SB  = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";

const sbPost = (path, body, tok) =>
  fetch(`${SB}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": KEY,
      "Authorization": `Bearer ${tok || KEY}`,
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  }).then(r => r.json()).catch(() => null);

const sbGet = (path, tok) =>
  fetch(`${SB}/rest/v1/${path}`, {
    headers: {
      "Content-Type": "application/json",
      "apikey": KEY,
      "Authorization": `Bearer ${tok || KEY}`,
    },
  }).then(r => r.json()).catch(() => []);

/**
 * Retourne un élément non encore vu pour ce module/niveau.
 * Quand tout a été vu → réinitialise et recommence.
 */
export async function getUnseen(userId, tok, level, module) {
  const pool = CONTENT[level]?.[module];
  if (!pool || pool.length === 0) return null;

  try {
    const seen = await sbGet(
      `seen_content?user_id=eq.${userId}&module=eq.${module}&select=content_id`,
      tok
    );
    const seenIds = Array.isArray(seen) ? seen.map(s => s.content_id) : [];

    let unseen = pool.filter(item => !seenIds.includes(item.id));

    // Tout vu → reset
    if (unseen.length === 0) {
      await fetch(`${SB}/rest/v1/seen_content?user_id=eq.${userId}&module=eq.${module}`, {
        method: "DELETE",
        headers: {
          "apikey": KEY,
          "Authorization": `Bearer ${tok || KEY}`,
        },
      });
      unseen = pool;
    }

    // Choisir aléatoirement parmi les non-vus
    const chosen = unseen[Math.floor(Math.random() * unseen.length)];

    // Marquer comme vu
    await sbPost("seen_content", {
      user_id: userId,
      module,
      content_id: chosen.id,
    }, tok);

    return chosen;
  } catch {
    // Fallback : aléatoire simple
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
