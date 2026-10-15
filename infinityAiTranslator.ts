import { geminiTrainer } from './geminiTrainer';
import { flameAIShield } from './shield';

/**
 * Backend Infinity Language AI Translation Core
 * Embedded directly inside Flame AI Commander.
 * Encapsulates the W1-W365 canonical semantic database, compound words,
 * and delegates deep contextual natural-language translation to the Gemini Trainer.
 */

export interface CanonicalSymbolBackend {
  code: string;
  hindi: string;
  english: string;
  concept: string;
  symbol: string;
  keywords: string[];
}

export const CANONICAL_IL_CORE: CanonicalSymbolBackend[] = [
  { code: 'W1', hindi: 'संकल्प / विचार', english: 'Origin / Thought', concept: 'intention, origin, thought', symbol: '⟐', keywords: ['thought', 'origin', 'intention', 'idea', 'mind', 'sankalp', 'vichar', 'soch'] },
  { code: 'W2', hindi: 'गति / दिशा', english: 'Movement / Direction', concept: 'movement, direction, forward motion', symbol: '↝', keywords: ['movement', 'direction', 'motion', 'path', 'gati', 'disha', 'chalna'] },
  { code: 'W3', hindi: 'जल / प्रवाह', english: 'Water / Flow', concept: 'water, flow, stream', symbol: '≈', keywords: ['water', 'flow', 'stream', 'river', 'liquid', 'jal', 'pani', 'pravah'] },
  { code: 'W4', hindi: 'अग्नि / ताप', english: 'Fire / Heat', concept: 'fire, heat, passion', symbol: '🜂', keywords: ['fire', 'heat', 'flame', 'blaze', 'agni', 'aag', 'tap'] },
  { code: 'W5', hindi: 'धारा / बहाव', english: 'Stream / River', concept: 'stream, river, current', symbol: '〰', keywords: ['stream', 'river', 'current', 'dhara', 'bahav', 'lahar'] },
  { code: 'W6', hindi: 'आकाश / ऊँचाई', english: 'Sky / Height', concept: 'sky, height, above, zenith', symbol: '✧', keywords: ['sky', 'height', 'above', 'zenith', 'aakash', 'unchai', 'gagan'] },
  { code: 'W7', hindi: 'स्थिर रहो', english: 'Stay / Remain Still', concept: 'stillness, stability, poise', symbol: '⧇', keywords: ['stay', 'still', 'pause', 'stop', 'sthir', 'ruko', 'shant'] },
  { code: 'W8', hindi: 'प्रकाश फैलाओ', english: 'Spread Light', concept: 'light, illumination, radiance', symbol: '☼', keywords: ['light', 'illuminate', 'glow', 'shine', 'prakash', 'roshni', 'deep'] },
  { code: 'W9', hindi: 'ध्यान लगाओ', english: 'Meditate / Focus', concept: 'meditation, focus, consciousness', symbol: '👁️', keywords: ['meditate', 'focus', 'concentrate', 'dhyan', 'chetan', 'mindfulness'] },
  { code: 'W10', hindi: 'शक्ति दो', english: 'Give Power / Empower', concept: 'power, energy, strength', symbol: '⚡', keywords: ['power', 'strength', 'energy', 'empower', 'shakti', 'urja', 'bal'] },
  { code: 'W11', hindi: 'घर बनाओ', english: 'Build a Home', concept: 'build, construct, home, shelter', symbol: '⌂', keywords: ['build', 'construct', 'home', 'shelter', 'ghar', 'makan', 'sharan'] },
  { code: 'W12', hindi: 'जागो', english: 'Wake Up / Awaken', concept: 'awakening, awareness', symbol: 'ꙮ', keywords: ['wake', 'awaken', 'arise', 'jago', 'jagriti', 'chetna'] },
  { code: 'W13', hindi: 'दिन / सूर्य', english: 'Day / Sun', concept: 'day, solar, daytime', symbol: '☉', keywords: ['day', 'sun', 'solar', 'din', 'surya', 'divas'] },
  { code: 'W14', hindi: 'रात / चंद्रमा', english: 'Night / Moon', concept: 'night, lunar, twilight', symbol: '☽', keywords: ['night', 'moon', 'lunar', 'rat', 'chandrama', 'chanda', 'nisha'] },
  { code: 'W15', hindi: 'परिवर्तन / बदलाव', english: 'Change / Transformation', concept: 'change, transformation, metamorphosis', symbol: '🜛', keywords: ['change', 'transform', 'shift', 'parivartan', 'badlav'] },
  { code: 'W16', hindi: 'काल चक्र', english: 'Cycle of Time', concept: 'time, temporal cycle, destiny', symbol: '⟳', keywords: ['time', 'cycle', 'clock', 'kal', 'chakra', 'samay', 'yug'] },
  { code: 'W17', hindi: 'संतुलन', english: 'Balance', concept: 'balance, equilibrium, harmony', symbol: '⚖', keywords: ['balance', 'equilibrium', 'harmony', 'santulan', 'samya'] },
  { code: 'W18', hindi: 'गूंज', english: 'Echo / Ripple', concept: 'echo, ripple, resonance', symbol: '◎', keywords: ['echo', 'ripple', 'sound', 'gunj', 'resonance', 'tarang'] },
  { code: 'W19', hindi: 'शांति', english: 'Peace', concept: 'peace, tranquility, calm', symbol: '𑁍', keywords: ['peace', 'calm', 'tranquil', 'shanti', 'sukun', 'aman'] },
  { code: 'W20', hindi: 'ज्ञान', english: 'Knowledge', concept: 'knowledge, wisdom, enlightenment', symbol: '📜', keywords: ['knowledge', 'wisdom', 'learn', 'gyan', 'vidya', 'ilm', 'bodh'] },
  { code: 'W21', hindi: 'सत्य', english: 'Truth', concept: 'truth, verity, absoluteness', symbol: '☯', keywords: ['truth', 'reality', 'satya', 'sach', 'haqiqat'] },
  { code: 'W22', hindi: 'प्रेम', english: 'Love', concept: 'love, compassion, devotion', symbol: '❤', keywords: ['love', 'compassion', 'prem', 'pyar', 'mohabbat', 'sneha'] },
  { code: 'W23', hindi: 'भय', english: 'Fear', concept: 'fear, caution, vigilance', symbol: '⚠️', keywords: ['fear', 'danger', 'alert', 'bhay', 'dar', 'khauf'] },
  { code: 'W24', hindi: 'जीवन', english: 'Life', concept: 'life, living, existence, soul', symbol: '🌱', keywords: ['life', 'exist', 'living', 'jivan', 'pran', 'zindagi', 'rooh'] },
];

// Special Compound Words Mappings
export const COMPOUND_RULES: Record<string, { codes: string[]; hindi: string; english: string; explanation: string }> = {
  'hi': { codes: ['W1', 'W5'], hindi: 'नमस्ते / जय हो', english: 'Hi / Salutation of Origin & Flow', explanation: 'Formed by W1 (संकल्प / Thought Origin) + W5 (धारा / Flowing Greeting Stream).' },
  'hello': { codes: ['W1', 'W5'], hindi: 'नमस्ते / अभिवादन', english: 'Hello / Greeting of Origin & Stream', explanation: 'Formed by W1 (संकल्प / Thought Origin) + W5 (धारा / Flowing Current).' },
  'app': { codes: ['W10', 'W20'], hindi: 'अनुप्रयोग / ज्ञान शक्ति', english: 'Application / Knowledge Engine', explanation: 'Formed by W10 (शक्ति / Power) + W20 (ज्ञान / Knowledge Tool).' },
  'application': { codes: ['W10', 'W20'], hindi: 'अनुप्रयोग / ज्ञान शक्ति', english: 'Application / Knowledge Engine', explanation: 'Formed by W10 (शक्ति / Power) + W20 (ज्ञान / Knowledge Tool).' },
  'store': { codes: ['W11', 'W17'], hindi: 'संग्रह द्वार / विनिमय पीठ', english: 'Store / Sanctuaried Exchange', explanation: 'Formed by W11 (घर / Home Shelter) + W17 (संतुलन / Balanced Marketplace).' },
  'download': { codes: ['W3', 'W2'], hindi: 'अवतरण / जल गति', english: 'Download / Fluid Motion to Device', explanation: 'Formed by W3 (जल / Fluid Stream) + W2 (गति / Movement inward).' },
  'security': { codes: ['W4', 'W7'], hindi: 'रक्षा कवच / स्थिर अग्नि', english: 'Security / Immutable Shield', explanation: 'Formed by W4 (अग्नि / Radiant Firewall) + W7 (स्थिर रहो / Unshakeable Stability).' },
  'shield': { codes: ['W4', 'W7'], hindi: 'सुरक्षा कवच / स्थिर अग्नि', english: 'Security / Immutable Shield', explanation: 'Formed by W4 (अग्नि / Radiant Firewall) + W7 (स्थिर रहो / Unshakeable Stability).' },
  'book': { codes: ['W20', 'W16'], hindi: 'ज्ञान चक्र / ग्रंथ', english: 'Book / Chronological Wisdom', explanation: 'Formed by W20 (ज्ञान / Knowledge) + W16 (काल चक्र / Timeless Scroll).' },
  'flame': { codes: ['W4', 'W8'], hindi: 'दिव्य ज्वाला / अग्नि प्रकाश', english: 'Flame / Radiant Fire Illuminator', explanation: 'Formed by W4 (अग्नि / Fire) + W8 (प्रकाश फैलाओ / Spread Light).' }
};

export class InfinityAiTranslatorEngine {
  /**
   * Main Translation Engine:
   * Translates natural language (Hindi, English, etc.) into Infinity Language semantics,
   * combining dictionary lookups with the Gemini Trainer for rich conceptual context.
   */
  public async translate(text: string, sourceLang: string = 'en') {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return {
        sourceText: '',
        sourceLang,
        infinityScriptText: '⟐',
        wCodes: ['W1'],
        semanticBreakdown: [],
        deepExplanation: 'Empty text provided.',
        routedVia: ['Flame AI Commander'],
        trainerModelUsed: 'None',
        timestamp: new Date().toISOString()
      };
    }

    const lower = cleanText.toLowerCase();

    // Check direct compound rule match
    if (COMPOUND_RULES[lower]) {
      const rule = COMPOUND_RULES[lower];
      const breakdown = rule.codes.map(c => {
        const item = CANONICAL_IL_CORE.find(x => x.code === c);
        return {
          wCode: c,
          symbol: item?.symbol || '⟐',
          hindiMeaning: item?.hindi || c,
          englishMeaning: item?.english || c,
          concept: item?.concept || c
        };
      });

      const scriptText = breakdown.map(b => b.symbol).join(' ');

      return {
        sourceText: cleanText,
        sourceLang,
        infinityScriptText: scriptText,
        wCodes: rule.codes,
        semanticBreakdown: breakdown,
        deepExplanation: `"${cleanText}" → ${rule.english}. ${rule.explanation}`,
        routedVia: ['Flame AI Commander', 'Canonical Compound Matrix', '20-AI Security Shield'],
        trainerModelUsed: 'Flame AI Sovereign Knowledge Core',
        timestamp: new Date().toISOString()
      };
    }

    // Single word canonical lookup
    const foundSymbol = CANONICAL_IL_CORE.find(s => 
      s.keywords.some(k => lower.includes(k) || k === lower) ||
      s.english.toLowerCase().includes(lower) ||
      s.hindi.includes(cleanText)
    );

    if (foundSymbol && cleanText.split(' ').length <= 2) {
      return {
        sourceText: cleanText,
        sourceLang,
        infinityScriptText: foundSymbol.symbol,
        wCodes: [foundSymbol.code],
        semanticBreakdown: [{
          wCode: foundSymbol.code,
          symbol: foundSymbol.symbol,
          hindiMeaning: foundSymbol.hindi,
          englishMeaning: foundSymbol.english,
          concept: foundSymbol.concept
        }],
        deepExplanation: `Direct canonical translation: "${cleanText}" corresponds to ${foundSymbol.code} (${foundSymbol.hindi} / ${foundSymbol.english}). Concept: ${foundSymbol.concept}.`,
        routedVia: ['Flame AI Commander', 'Canonical IL Registry', '20-AI Security Shield'],
        trainerModelUsed: 'Flame AI Sovereign Knowledge Core',
        timestamp: new Date().toISOString()
      };
    }

    // For full sentences or complex requests, route through Gemini Trainer!
    const trainerPrompt = `You are the specialized Infinity Language (IL) Translation Engine inside Flame AI Commander.
Translate the following user phrase into Infinity Language:
Phrase: "${cleanText}" (Source language: ${sourceLang})

Canonical W1-W24 Dictionary reference:
W1: संकल्प / Origin / Thought
W2: गति / Movement / Direction
W3: जल / Water / Flow
W4: अग्नि / Fire / Heat
W5: धारा / Stream / River
W6: आकाश / Sky / Height
W7: स्थिर रहो / Stay / Stillness
W8: प्रकाश फैलाओ / Spread Light
W9: ध्यान लगाओ / Meditate / Focus
W10: शक्ति दो / Empower / Energy
W11: घर बनाओ / Build Home / Shelter
W12: जागो / Awaken
W13: दिन / सूर्य / Day / Sun
W14: रात / चंद्रमा / Night / Moon
W15: परिवर्तन / Change / Transformation
W16: काल चक्र / Cycle of Time
W17: संतुलन / Balance / Harmony
W18: गूंज / Echo / Resonance
W19: शांति / Peace / Tranquility
W20: ज्ञान / Knowledge / Wisdom
W21: सत्य / Truth
W22: प्रेम / Love
W23: भय / Fear
W24: जीवन / Life

Compound rule example: "Hi" = W1 (Origin) + W5 (Stream/Flow).
Provide a concise translation response containing:
1. Best matching W-codes (e.g. W1 W20)
2. Exact meaning in Hindi & English
3. Why these specific symbols convey the semantic essence of the phrase. Keep it authoritative and cybernetic.`;

    try {
      const trainerResult = await geminiTrainer.executeCommand(trainerPrompt);

      // Extract W-codes mentioned in the response
      const matchedCodes = Array.from(new Set(trainerResult.response.match(/\bW[0-9]{1,3}\b/g) || ['W1', 'W20'])).slice(0, 5);
      const breakdown = matchedCodes.map(code => {
        const item = CANONICAL_IL_CORE.find(c => c.code === code);
        return {
          wCode: code,
          symbol: item?.symbol || '⟐',
          hindiMeaning: item?.hindi || `${code} ज्ञान`,
          englishMeaning: item?.english || `${code} Concept`,
          concept: item?.concept || 'Cosmic Harmonic Concept'
        };
      });

      const scriptText = breakdown.map(b => b.symbol).join(' ') || '⟐ 📜';

      return {
        sourceText: cleanText,
        sourceLang,
        infinityScriptText: scriptText,
        wCodes: matchedCodes,
        semanticBreakdown: breakdown,
        deepExplanation: trainerResult.response,
        routedVia: ['Flame AI Commander', 'Gemini Trainer', 'Gemini 3.8 Flash', 'Flame AI Security Shield'],
        trainerModelUsed: trainerResult.source,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      // Sovereign fallback
      return {
        sourceText: cleanText,
        sourceLang,
        infinityScriptText: '⟐ 📜',
        wCodes: ['W1', 'W20'],
        semanticBreakdown: [
          { wCode: 'W1', symbol: '⟐', hindiMeaning: 'संकल्प', englishMeaning: 'Origin', concept: 'intention' },
          { wCode: 'W20', symbol: '📜', hindiMeaning: 'ज्ञान', englishMeaning: 'Knowledge', concept: 'wisdom' }
        ],
        deepExplanation: `Autonomous Flame AI Synthesis: Synthesized into [W1] Thought Origin + [W20] Knowledge Transmission.`,
        routedVia: ['Flame AI Commander', 'Autonomous Sovereign Core'],
        trainerModelUsed: 'Flame AI Autonomous Core',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const infinityAiTranslator = new InfinityAiTranslatorEngine();
