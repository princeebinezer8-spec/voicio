import {
  VocabularyWord,
  DifficultyLevel,
  findOrCreateVocabularyWord,
  getWordByName,
  getRandomWordForLevel,
  VOCABULARY_LIST,
} from './data/vocabulary.js';

export type TargetTransitionType =
  | 'SWITCH_WORD'       // User explicitly introduced or requested a new target word
  | 'COMPARE_WORDS'     // User asked to compare two words
  | 'FOLLOW_UP'         // User is following up or practicing the current target word
  | 'CLARIFICATION'     // User wants to switch or discuss another word, but didn't specify which word
  | 'MAINTAIN_TARGET';  // Default: retain current target word

export interface TargetWordResolution {
  type: TargetTransitionType;
  activeWord: VocabularyWord;
  previousWord?: VocabularyWord;
  comparisonWord?: VocabularyWord;
  clarificationQuestion?: string;
}

const GENERIC_TRANSITION_TARGETS = new Set([
  'another',
  'new',
  'different',
  'next',
  'a',
  'an',
  'the',
  'word',
  'words',
  'something',
  'it',
  'this',
  'that',
]);

const COMMON_STOPWORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'it', 'is', 'are', 'was', 'were', 'be',
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'as', 'into',
  'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'and', 'or', 'but', 'if',
  'so', 'than', 'because', 'while', 'where', 'after', 'though', 'i', 'you',
  'he', 'she', 'we', 'they', 'them', 'their', 'my', 'your', 'his', 'her',
  'our', 'me', 'us', 'him', 'can', 'could', 'would', 'should', 'will',
  'shall', 'may', 'might', 'must', 'do', 'does', 'did', 'have', 'has', 'had',
  'now', 'then', 'here', 'there', 'what', 'how', 'why', 'when', 'who', 'which',
  'tell', 'say', 'speak', 'talk', 'mean', 'meaning', 'use', 'using', 'sentence',
  'example', 'give', 'please', 'help', 'want', 'know', 'let', 'lets', 'learn',
  'practise', 'practice', 'switch', 'another', 'new', 'word', 'words', 'good',
  'hello', 'hi', 'hey', 'yes', 'no', 'ok', 'okay', 'great', 'sure', 'fine',
]);

/**
 * Normalizes an English word token by trimming and stripping trailing punctuation.
 */
function cleanWordToken(token: string): string {
  return token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
}

/**
 * Resolves the active target word for the latest conversation turn.
 * Ensures the user's latest intent is respected without being overwritten by
 * historical conversation words or stale state.
 */
export function resolveTargetWord(
  userMessage: string,
  currentTargetWord?: VocabularyWord,
  level: DifficultyLevel = 'Intermediate'
): TargetWordResolution {
  const defaultWord = currentTargetWord || getRandomWordForLevel(level);
  const trimmed = userMessage.trim();

  if (!trimmed) {
    return {
      type: 'CLARIFICATION',
      activeWord: defaultWord,
      clarificationQuestion: "I didn't quite catch that. Could you repeat what you'd like to practice?",
    };
  }

  const lowerMsg = trimmed.toLowerCase();

  // 1. Check for Comparison Query: "Compare meticulous and thorough"
  const compareMatch =
    lowerMsg.match(/\bcompare\s+([a-zA-Z]+)\s+(?:and|with|to)\s+([a-zA-Z]+)\b/i) ||
    lowerMsg.match(/\b(?:what(?:'s|\s+is)\s+the\s+difference\s+between|how\s+does)\s+([a-zA-Z]+)\s+(?:and|differ\s+from)\s+([a-zA-Z]+)\b/i) ||
    lowerMsg.match(/\b([a-zA-Z]+)\s+(?:versus|vs\.?)\s+([a-zA-Z]+)\b/i);

  if (compareMatch) {
    const rawWord1 = cleanWordToken(compareMatch[1]);
    const rawWord2 = cleanWordToken(compareMatch[2]);

    if (rawWord1 && rawWord2 && !GENERIC_TRANSITION_TARGETS.has(rawWord1) && !GENERIC_TRANSITION_TARGETS.has(rawWord2)) {
      // Determine primary target: if current target is one of them, retain it as activeWord
      const isWord2Current = currentTargetWord && currentTargetWord.word.toLowerCase() === rawWord2;
      const primaryToken = isWord2Current ? rawWord2 : rawWord1;
      const secondaryToken = isWord2Current ? rawWord1 : rawWord2;

      const activeWord = findOrCreateVocabularyWord(primaryToken, level);
      const comparisonWord = findOrCreateVocabularyWord(secondaryToken, level);

      return {
        type: 'COMPARE_WORDS',
        activeWord,
        previousWord: currentTargetWord,
        comparisonWord,
      };
    }
  }

  // 2. Check for Explicit Transition Requests:
  // e.g. "Practise eloquent", "Now practise meticulous", "Now let's switch to pragmatic", "What does resilient mean?"
  const transitionPatterns: RegExp[] = [
    /\b(?:now\s+)?(?:practise|practice)\s+([a-zA-Z]+)\b/i,
    /\b(?:let's|lets)\s+(?:switch\s+to|discuss|practise|practice|move\s+to|learn|focus\s+on)\s+(?:the\s+word\s+)?([a-zA-Z]+)\b/i,
    /\b(?:switch\s+to|change\s+to|move\s+on\s+to|focus\s+on)\s+(?:the\s+word\s+)?([a-zA-Z]+)\b/i,
    /\b(?:what\s+does|what's)\s+([a-zA-Z]+)\s+mean\b/i,
    /\b(?:what(?:'s|\s+is)\s+the\s+meaning\s+of)\s+([a-zA-Z]+)\b/i,
    /\b(?:teach\s+me|explain|define)\s+(?:the\s+word\s+)?([a-zA-Z]+)\b/i,
    /\b(?:how\s+about|what\s+about)\s+(?:the\s+word\s+)?([a-zA-Z]+)\b/i,
    /\b(?:how\s+do\s+you\s+pronounce|how\s+to\s+pronounce)\s+([a-zA-Z]+)\b/i,
  ];

  for (const pattern of transitionPatterns) {
    const match = lowerMsg.match(pattern);
    if (match && match[1]) {
      const candidate = cleanWordToken(match[1]);

      // If user said "let's discuss another word" / "switch to a new word" without naming the word
      if (GENERIC_TRANSITION_TARGETS.has(candidate)) {
        return {
          type: 'CLARIFICATION',
          activeWord: defaultWord,
          clarificationQuestion:
            "I'd love to explore a new word with you! Which word would you like to practice, or should I suggest an exciting one?",
        };
      }

      // If user asked about the current target word (e.g. "Give me another example of meticulous" while on meticulous)
      if (currentTargetWord && candidate === currentTargetWord.word.toLowerCase()) {
        return {
          type: 'FOLLOW_UP',
          activeWord: currentTargetWord,
        };
      }

      // User introduced a new target word!
      const newTarget = findOrCreateVocabularyWord(candidate, level);
      return {
        type: 'SWITCH_WORD',
        activeWord: newTarget,
        previousWord: currentTargetWord,
      };
    }
  }

  // 3. Check if user is asking a general follow-up on current word
  // e.g. "Give me another example", "Can I use it in a sentence?", "Is this correct?", "How do I pronounce it?"
  const isFollowUpPrompt =
    /\b(?:another\s+example|more\s+examples?|give\s+(?:an?\s+)?example|sentence\s+(?:with|using)\s+it|in\s+a\s+sentence|how\s+(?:do\s+i|to)\s+use(?:\s+it)?|use\s+it|pronounce\s+it|synonyms?|antonyms?|quiz\s+me|tell\s+me\s+more)\b/i.test(
      lowerMsg
    ) ||
    (currentTargetWord && lowerMsg.includes(currentTargetWord.word.toLowerCase()));

  if (isFollowUpPrompt && currentTargetWord) {
    return {
      type: 'FOLLOW_UP',
      activeWord: currentTargetWord,
    };
  }

  // 4. Check for known vocabulary words mentioned in the message
  // Filter out stopwords
  const tokens = trimmed.split(/[^a-zA-Z]+/).map(cleanWordToken).filter(Boolean);
  const knownMentions: VocabularyWord[] = [];

  for (const token of tokens) {
    if (COMMON_STOPWORDS.has(token)) continue;
    const found = getWordByName(token);
    if (found && !knownMentions.some((w) => w.id === found.id)) {
      knownMentions.push(found);
    }
  }

  if (knownMentions.length === 1) {
    const mentioned = knownMentions[0];
    if (currentTargetWord && mentioned.id === currentTargetWord.id) {
      return {
        type: 'FOLLOW_UP',
        activeWord: currentTargetWord,
      };
    }
    // Transition to the mentioned known vocabulary word
    return {
      type: 'SWITCH_WORD',
      activeWord: mentioned,
      previousWord: currentTargetWord,
    };
  }

  if (knownMentions.length > 1) {
    // Multiple words mentioned without an explicit compare verb
    // Check if one is current word
    const otherWords = knownMentions.filter((w) => !currentTargetWord || w.id !== currentTargetWord.id);
    if (otherWords.length === 1) {
      return {
        type: 'SWITCH_WORD',
        activeWord: otherWords[0],
        previousWord: currentTargetWord,
      };
    }

    return {
      type: 'CLARIFICATION',
      activeWord: defaultWord,
      clarificationQuestion: `Both "${knownMentions[0].word}" and "${knownMentions[1].word}" are wonderful words! Which one would you like to focus on right now?`,
    };
  }

  // 5. Check if user asked to switch without naming any word
  if (/\b(?:another\s+word|switch\s+words?|change\s+words?|next\s+word|different\s+word)\b/i.test(lowerMsg)) {
    return {
      type: 'CLARIFICATION',
      activeWord: defaultWord,
      clarificationQuestion:
        "I'd love to explore a new word with you! Which word would you like to practice, or should I suggest an exciting one?",
    };
  }

  // 6. Default: Student is responding, practicing, or continuing conversation with current target
  return {
    type: 'MAINTAIN_TARGET',
    activeWord: defaultWord,
  };
}
