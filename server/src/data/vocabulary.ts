export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface VocabularyWord {
  id: string;
  word: string;
  level: DifficultyLevel;
  partOfSpeech: string;
  phonetic: string;
  pronunciationGuide: string;
  definition: string;
  simpleExplanation: string;
  exampleSentence: string;
  synonyms: string[];
  antonyms: string[];
  category: string;
  commonMistake?: string;
  quickTip?: string;
}

export const VOCABULARY_LIST: VocabularyWord[] = [
  // BEGINNER
  {
    id: 'beg-1',
    word: 'Curious',
    level: 'Beginner',
    partOfSpeech: 'adjective',
    phonetic: '/ˈkjʊə.ri.əs/',
    pronunciationGuide: 'KYOOR-ee-uhs',
    definition: 'Eager to learn, know, or find out about things.',
    simpleExplanation: 'When you are curious, you really want to discover how something works or learn something new.',
    exampleSentence: 'Children are naturally curious about the world around them.',
    synonyms: ['inquisitive', 'interested', 'eager'],
    antonyms: ['indifferent', 'uninterested', 'bored'],
    category: 'Personality & Learning',
    commonMistake: 'Don’t confuse "curious" with "furious" (which means extremely angry).',
    quickTip: 'You can say "curious about" + noun or "curious to" + verb.'
  },
  {
    id: 'beg-2',
    word: 'Generous',
    level: 'Beginner',
    partOfSpeech: 'adjective',
    phonetic: '/ˈdʒen.ər.əs/',
    pronunciationGuide: 'JEN-er-uhs',
    definition: 'Willing to give money, help, kindness, or time freely.',
    simpleExplanation: 'A generous person loves sharing what they have with others without expecting anything back.',
    exampleSentence: 'She was very generous with her time, helping us prepare for the exam.',
    synonyms: ['giving', 'kind', 'charitable'],
    antonyms: ['selfish', 'stingy', 'mean'],
    category: 'Character & Kindness',
    quickTip: 'Often used as: "generous to someone" or "generous with something".'
  },
  {
    id: 'beg-3',
    word: 'Courage',
    level: 'Beginner',
    partOfSpeech: 'noun',
    phonetic: '/ˈkʌr.ɪdʒ/',
    pronunciationGuide: 'KUR-ij',
    definition: 'The ability to do something that frightens you; bravery.',
    simpleExplanation: 'Courage is not the absence of fear, but doing the right thing even when you feel scared.',
    exampleSentence: 'It took a lot of courage to speak in front of hundreds of people.',
    synonyms: ['bravery', 'valour', 'boldness'],
    antonyms: ['fear', 'cowardice', 'timidity'],
    category: 'Emotions & Strength',
    quickTip: 'Say "have the courage to do something" or "take courage".'
  },
  {
    id: 'beg-4',
    word: 'Patient',
    level: 'Beginner',
    partOfSpeech: 'adjective',
    phonetic: '/ˈpeɪ.ʃənt/',
    pronunciationGuide: 'PAY-shuhnt',
    definition: 'Able to accept or tolerate delay, problems, or suffering without becoming annoyed or anxious.',
    simpleExplanation: 'Being patient means staying calm while waiting or dealing with something difficult.',
    exampleSentence: 'Our teacher was always patient with students who needed extra help.',
    synonyms: ['tolerant', 'calm', 'composed'],
    antonyms: ['impatient', 'hasty', 'restless'],
    category: 'Personality & Temperament',
    quickTip: 'Remember: as a noun, a "patient" is someone receiving medical care.'
  },
  {
    id: 'beg-5',
    word: 'Sincere',
    level: 'Beginner',
    partOfSpeech: 'adjective',
    phonetic: '/sɪnˈsɪər/',
    pronunciationGuide: 'sin-SEER',
    definition: 'Free from pretence or deceit; genuine and honest.',
    simpleExplanation: 'When you are sincere, you truly mean what you say or do from your heart.',
    exampleSentence: 'Please accept my sincere apologies for arriving late.',
    synonyms: ['genuine', 'honest', 'heartfelt'],
    antonyms: ['insincere', 'fake', 'hypocritical'],
    category: 'Communication & Trust',
    quickTip: 'Used often in polite letters: "Sincerely yours" or "sincere advice".'
  },

  // INTERMEDIATE
  {
    id: 'int-1',
    word: 'Resilient',
    level: 'Intermediate',
    partOfSpeech: 'adjective',
    phonetic: '/rɪˈzɪl.jənt/',
    pronunciationGuide: 'ri-ZIL-yuhnt',
    definition: 'Able to recover quickly from difficult conditions, setbacks, or trauma.',
    simpleExplanation: 'If you are resilient, you bounce back when tough things happen instead of giving up.',
    exampleSentence: 'The team remained resilient despite losing the opening three matches.',
    synonyms: ['tough', 'adaptable', 'buoyant', 'robust'],
    antonyms: ['fragile', 'vulnerable', 'weak'],
    category: 'Mindset & Growth',
    commonMistake: 'Don’t confuse "resilient" with "stubborn". Resilient means recovering and adapting, not refusing to change.',
    quickTip: 'Think of a spring: it bends under pressure, then springs back.'
  },
  {
    id: 'int-2',
    word: 'Articulate',
    level: 'Intermediate',
    partOfSpeech: 'adjective / verb',
    phonetic: '/ɑːˈtɪk.jə.lət/ (adj) /ɑːˈtɪk.jə.leɪt/ (verb)',
    pronunciationGuide: 'ar-TIK-yoo-lit (adj) / ar-TIK-yoo-layt (v)',
    definition: 'Expressing ideas clearly and effectively in speech or writing.',
    simpleExplanation: 'An articulate person can put their thoughts into clear, fluent, and convincing words.',
    exampleSentence: 'She gave an articulate presentation that persuaded every board member.',
    synonyms: ['eloquent', 'coherent', 'fluent', 'lucid'],
    antonyms: ['inarticulate', 'hesitant', 'unclear'],
    category: 'Communication & Speech',
    quickTip: 'Pronunciation changes: as an adjective the end is "-lit", as a verb it ends in "-layt".'
  },
  {
    id: 'int-3',
    word: 'Ambiguous',
    level: 'Intermediate',
    partOfSpeech: 'adjective',
    phonetic: '/æmˈbɪɡ.ju.əs/',
    pronunciationGuide: 'am-BIG-yoo-uhs',
    definition: 'Open to more than one interpretation; having a double or unclear meaning.',
    simpleExplanation: 'Something is ambiguous when it can mean two different things and leaves you wondering which one is true.',
    exampleSentence: 'The instructions on the exam were ambiguous, confusing many students.',
    synonyms: ['equivocal', 'vague', 'unclear', 'obscure'],
    antonyms: ['clear', 'unambiguous', 'explicit', 'precise'],
    category: 'Language & Logic',
    quickTip: 'From Latin "ambi-" meaning both or around. Think "two directions".'
  },
  {
    id: 'int-4',
    word: 'Empathy',
    level: 'Intermediate',
    partOfSpeech: 'noun',
    phonetic: '/ˈem.pə.θi/',
    pronunciationGuide: 'EM-puh-thee',
    definition: 'The ability to understand and share the feelings of another person.',
    simpleExplanation: 'Empathy means stepping into someone else’s shoes and feeling what they are going through.',
    exampleSentence: 'A great leader listens with genuine empathy and acts with compassion.',
    synonyms: ['compassion', 'understanding', 'sensitivity'],
    antonyms: ['apathy', 'callousness', 'indifference'],
    category: 'Relationships & Emotion',
    commonMistake: 'Sympathy is feeling sorrow for someone; empathy is truly understanding and sharing their feeling.',
    quickTip: 'Often used with "show empathy" or "treat with empathy".'
  },
  {
    id: 'int-5',
    word: 'Pragmatic',
    level: 'Intermediate',
    partOfSpeech: 'adjective',
    phonetic: '/præɡˈmæt.ɪk/',
    pronunciationGuide: 'prag-MAT-ik',
    definition: 'Dealing with things sensibly and realistically based on practical considerations rather than theoretical ones.',
    simpleExplanation: 'A pragmatic approach focuses on what actually works in reality rather than pure theories or ideals.',
    exampleSentence: 'We need a pragmatic solution that works within our current budget.',
    synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth'],
    antonyms: ['idealistic', 'impractical', 'theoretical'],
    category: 'Decision Making & Strategy',
    quickTip: 'Opposite of "idealistic". Focus on practical results.'
  },

  // ADVANCED
  {
    id: 'adv-1',
    word: 'Eloquent',
    level: 'Advanced',
    partOfSpeech: 'adjective',
    phonetic: '/ˈel.ə.kwənt/',
    pronunciationGuide: 'EL-uh-kwuhnt',
    definition: 'Fluent, persuasive, and beautifully expressive in speaking or writing.',
    simpleExplanation: 'Eloquent speech moves people emotionally through graceful, well-chosen words.',
    exampleSentence: 'His eloquent defence of human rights moved the entire auditorium to a standing ovation.',
    synonyms: ['persuasive', 'poignant', 'expressive', 'silver-tongued'],
    antonyms: ['inarticulate', 'clumsy', 'tongue-tied'],
    category: 'Rhetoric & Oratory',
    quickTip: 'Related noun: "eloquence". Adverb: "eloquently".'
  },
  {
    id: 'adv-2',
    word: 'Serendipity',
    level: 'Advanced',
    partOfSpeech: 'noun',
    phonetic: '/ˌser.ənˈdɪp.ə.ti/',
    pronunciationGuide: 'sehr-uhn-DIP-i-tee',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
    simpleExplanation: 'Finding something wonderful without looking for it — a happy, fortunate accident.',
    exampleSentence: 'Meeting my business partner on that delayed train was pure serendipity.',
    synonyms: ['fortune', 'happy coincidence', 'providence', 'fluke'],
    antonyms: ['misfortune', 'bad luck', 'design', 'calculation'],
    category: 'Philosophy & Life',
    quickTip: 'The adjective form is "serendipitous" (pronounced sehr-uhn-DIP-i-tuhs).'
  },
  {
    id: 'adv-3',
    word: 'Ephemeral',
    level: 'Advanced',
    partOfSpeech: 'adjective',
    phonetic: '/ɪˈfem.ər.əl/',
    pronunciationGuide: 'ih-FEM-er-uhl',
    definition: 'Lasting for a very short time; transitory or fleeting.',
    simpleExplanation: 'Like cherry blossoms or morning dew, something ephemeral disappears quickly.',
    exampleSentence: 'Fame on social media is often ephemeral, vanishing as soon as the next trend emerges.',
    synonyms: ['transitory', 'fleeting', 'short-lived', 'momentary'],
    antonyms: ['permanent', 'enduring', 'eternal', 'perpetual'],
    category: 'Time & Existence',
    quickTip: 'Greek root "ephemeros" meaning "lasting only a day".'
  },
  {
    id: 'adv-4',
    word: 'Quintessential',
    level: 'Advanced',
    partOfSpeech: 'adjective',
    phonetic: '/ˌkwɪn.tɪˈsen.ʃəl/',
    pronunciationGuide: 'kwin-tuh-SEN-shuhl',
    definition: 'Representing the most perfect or typical example of a quality or class.',
    simpleExplanation: 'The absolute classic example of something — nothing illustrates it better.',
    exampleSentence: 'Afternoon tea at the Ritz is the quintessential British tradition.',
    synonyms: ['archetypal', 'exemplary', 'classic', 'paradigmatic'],
    antonyms: ['atypical', 'unrepresentative', 'aberrant'],
    category: 'Description & Excellence',
    quickTip: 'Comes from "quintessence" — the ancient fifth element considered the purest essence.'
  },
  {
    id: 'adv-5',
    word: 'Perspicacious',
    level: 'Advanced',
    partOfSpeech: 'adjective',
    phonetic: '/ˌpɜː.spɪˈkeɪ.ʃəs/',
    pronunciationGuide: 'pur-spih-KAY-shuhs',
    definition: 'Having a ready insight into and understanding of things; mentally acute.',
    simpleExplanation: 'Having sharp eyes and an intelligent mind that notices subtle truths others miss.',
    exampleSentence: 'Thanks to her perspicacious analysis of market trends, the company avoided the crisis.',
    synonyms: ['shrewd', 'discerning', 'astute', 'perceptive'],
    antonyms: ['obtuse', 'unperceptive', 'dull-witted'],
    category: 'Intellect & Insight',
    quickTip: 'Related noun: "perspicacity". Don’t confuse with "perspicuous" (which means clear to understand).'
  }
];

export function getWordsByLevel(level: DifficultyLevel): VocabularyWord[] {
  return VOCABULARY_LIST.filter(w => w.level.toLowerCase() === level.toLowerCase());
}

export function getWordById(id: string): VocabularyWord | undefined {
  return VOCABULARY_LIST.find(w => w.id === id);
}

export function getWordByName(name: string): VocabularyWord | undefined {
  return VOCABULARY_LIST.find(w => w.word.toLowerCase() === name.toLowerCase());
}

export function getRandomWordForLevel(level: DifficultyLevel, excludeIds: string[] = []): VocabularyWord {
  const words = getWordsByLevel(level).filter(w => !excludeIds.includes(w.id));
  if (words.length === 0) {
    const allForLevel = getWordsByLevel(level);
    return allForLevel[Math.floor(Math.random() * allForLevel.length)];
  }
  return words[Math.floor(Math.random() * words.length)];
}
