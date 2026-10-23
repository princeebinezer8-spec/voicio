import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTargetWord } from '../src/targetWordManager.js';
import { getWordByName, findOrCreateVocabularyWord, DifficultyLevel } from '../src/data/vocabulary.js';

describe('Voicio Dynamic Target Word Recognition and Switching', () => {
  const curious = getWordByName('Curious')!;
  const eloquent = getWordByName('Eloquent')!;
  const meticulous = getWordByName('Meticulous')!;
  const resilient = getWordByName('Resilient')!;
  const pragmatic = getWordByName('Pragmatic')!;
  const thorough = getWordByName('Thorough')!;

  test('Sequence 1: "Practise eloquent" -> tutor discusses eloquent', () => {
    const res = resolveTargetWord('Practise eloquent', curious, 'Intermediate');
    assert.equal(res.type, 'SWITCH_WORD');
    assert.equal(res.activeWord.word.toLowerCase(), 'eloquent');
    assert.equal(res.previousWord?.word.toLowerCase(), 'curious');
  });

  test('Sequence 2: "Now practise meticulous" -> tutor switches to meticulous', () => {
    const res = resolveTargetWord('Now practise meticulous', eloquent, 'Advanced');
    assert.equal(res.type, 'SWITCH_WORD');
    assert.equal(res.activeWord.word.toLowerCase(), 'meticulous');
    assert.equal(res.previousWord?.word.toLowerCase(), 'eloquent');
  });

  test('Sequence 3: "What does resilient mean?" -> tutor discusses resilient', () => {
    const res = resolveTargetWord('What does resilient mean?', meticulous, 'Intermediate');
    assert.equal(res.type, 'SWITCH_WORD');
    assert.equal(res.activeWord.word.toLowerCase(), 'resilient');
  });

  test('Sequence 4: "Give me another example of meticulous" -> tutor remains on meticulous', () => {
    const res = resolveTargetWord('Give me another example of meticulous', meticulous, 'Advanced');
    assert.equal(res.type, 'FOLLOW_UP');
    assert.equal(res.activeWord.word.toLowerCase(), 'meticulous');
  });

  test('Sequence 5: "Compare meticulous and thorough" -> tutor discusses both accurately', () => {
    const res = resolveTargetWord('Compare meticulous and thorough', meticulous, 'Intermediate');
    assert.equal(res.type, 'COMPARE_WORDS');
    assert.equal(res.activeWord.word.toLowerCase(), 'meticulous');
    assert.ok(res.comparisonWord);
    assert.equal(res.comparisonWord.word.toLowerCase(), 'thorough');
  });

  test('Sequence 6: "Now let\'s switch to pragmatic" -> tutor switches to pragmatic', () => {
    const res = resolveTargetWord("Now let's switch to pragmatic", meticulous, 'Intermediate');
    assert.equal(res.type, 'SWITCH_WORD');
    assert.equal(res.activeWord.word.toLowerCase(), 'pragmatic');
    assert.equal(res.previousWord?.word.toLowerCase(), 'meticulous');
  });

  test('Sequence 7: Follow-up after switching -> tutor continues with the new target', () => {
    // Student asks a general follow-up about the new word
    const res = resolveTargetWord('Can you give me a sentence with it?', pragmatic, 'Intermediate');
    assert.equal(res.type, 'FOLLOW_UP');
    assert.equal(res.activeWord.word.toLowerCase(), 'pragmatic');

    // Student asks for pronunciation
    const resPronounce = resolveTargetWord('How do I pronounce it?', pragmatic, 'Intermediate');
    assert.equal(resPronounce.type, 'FOLLOW_UP');
    assert.equal(resPronounce.activeWord.word.toLowerCase(), 'pragmatic');
  });

  test('Sequence 8: An unclear utterance -> asks for clarification instead of reverting to an old word', () => {
    // User says "let's switch to another word" without naming one
    const resSwitchGeneral = resolveTargetWord("let's discuss another word", pragmatic, 'Intermediate');
    assert.equal(resSwitchGeneral.type, 'CLARIFICATION');
    assert.equal(resSwitchGeneral.activeWord.word.toLowerCase(), 'pragmatic');
    assert.ok(resSwitchGeneral.clarificationQuestion);
    assert.ok(resSwitchGeneral.clarificationQuestion.includes('Which word'));

    // Empty or noise utterance
    const resNoise = resolveTargetWord('   ', pragmatic, 'Intermediate');
    assert.equal(resNoise.type, 'CLARIFICATION');
    assert.equal(resNoise.activeWord.word.toLowerCase(), 'pragmatic');
  });

  test('Sequence 9: A new word spoken through microphone -> target updates correctly', () => {
    // Spoken input from Web Speech API: "Teach me courage"
    const resSpoken = resolveTargetWord('Teach me courage', curious, 'Beginner');
    assert.equal(resSpoken.type, 'SWITCH_WORD');
    assert.equal(resSpoken.activeWord.word.toLowerCase(), 'courage');
    assert.equal(resSpoken.activeWord.level, 'Beginner');

    // Spoken input with inflections or punctuation
    const resSpokenPunct = resolveTargetWord('What does serendipity mean?', resilient, 'Advanced');
    assert.equal(resSpokenPunct.type, 'SWITCH_WORD');
    assert.equal(resSpokenPunct.activeWord.word.toLowerCase(), 'serendipity');
  });

  test('Sequence 10: Multiple consecutive target switches -> no stale target or response is reused', () => {
    let currentWord = curious;

    // Turn 1: Switch to Resilient
    const turn1 = resolveTargetWord('Switch to resilient', currentWord, 'Intermediate');
    assert.equal(turn1.activeWord.word.toLowerCase(), 'resilient');
    currentWord = turn1.activeWord;

    // Turn 2: Switch to Meticulous
    const turn2 = resolveTargetWord('Now practise meticulous', currentWord, 'Intermediate');
    assert.equal(turn2.activeWord.word.toLowerCase(), 'meticulous');
    currentWord = turn2.activeWord;

    // Turn 3: Follow-up on Meticulous
    const turn3 = resolveTargetWord('How do I use it at work?', currentWord, 'Intermediate');
    assert.equal(turn3.activeWord.word.toLowerCase(), 'meticulous');
    assert.equal(turn3.type, 'FOLLOW_UP');
    currentWord = turn3.activeWord;

    // Turn 4: Switch to Pragmatic
    const turn4 = resolveTargetWord("Now let's switch to pragmatic", currentWord, 'Intermediate');
    assert.equal(turn4.activeWord.word.toLowerCase(), 'pragmatic');
    currentWord = turn4.activeWord;

    // Turn 5: Switch to Eloquent
    const turn5 = resolveTargetWord('Practise eloquent', currentWord, 'Advanced');
    assert.equal(turn5.activeWord.word.toLowerCase(), 'eloquent');
  });

  test('Handles dynamic words not in pre-curated dictionary gracefully', () => {
    const res = resolveTargetWord('What does ubiquitous mean?', curious, 'Advanced');
    assert.equal(res.type, 'SWITCH_WORD');
    assert.equal(res.activeWord.word, 'Ubiquitous');
    assert.ok(res.activeWord.id.includes('dynamic-ubiquitous'));
  });
});
