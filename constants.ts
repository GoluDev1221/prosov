import { Chapter, TierType } from './types';

export const EXAM_DATE = new Date('2026-05-05').getTime();
export const DECAY_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const TIER_CONFIG: Record<TierType, { label: string; baseValue: number; category: 'THEORY' | 'COMBAT' }> = {
  L: { label: 'Lecture', baseValue: 100, category: 'THEORY' },
  RTQ: { label: 'Revision', baseValue: 50, category: 'THEORY' },
  NP: { label: 'NEET PYQ', baseValue: 150, category: 'THEORY' },
  JP: { label: 'JEE PYQ', baseValue: 200, category: 'COMBAT' },
  KS: { label: 'Kattar Sheet', baseValue: 250, category: 'COMBAT' },
  TS: { label: 'Teacher Sheet', baseValue: 300, category: 'COMBAT' },
};

const subjects = {
    P: 'PHYSICS',
    C: 'CHEMISTRY',
    B: 'BIOLOGY'
} as const;

// Comprehensive Reduced Syllabus (NMC/NTA aligned)
const rawChapters: { s: 'P'|'C'|'B', n: string, d: number }[] = [
    // PHYSICS (Class 11)
    { s: 'P', n: 'Units & Measurements', d: 1 },
    { s: 'P', n: 'Motion in Straight Line', d: 2 },
    { s: 'P', n: 'Motion in Plane', d: 2 },
    { s: 'P', n: 'Laws of Motion', d: 3 },
    { s: 'P', n: 'Work, Energy, Power', d: 3 },
    { s: 'P', n: 'Rotational Motion', d: 5 },
    { s: 'P', n: 'Gravitation', d: 3 },
    { s: 'P', n: 'Mechanical Props of Solids', d: 2 },
    { s: 'P', n: 'Mechanical Props of Fluids', d: 3 },
    { s: 'P', n: 'Thermal Properties', d: 2 },
    { s: 'P', n: 'Thermodynamics (Phy)', d: 3 },
    { s: 'P', n: 'Kinetic Theory', d: 2 },
    { s: 'P', n: 'Oscillations', d: 4 },
    { s: 'P', n: 'Waves', d: 4 },
    // PHYSICS (Class 12)
    { s: 'P', n: 'Electric Charges & Fields', d: 4 },
    { s: 'P', n: 'Potential & Capacitance', d: 4 },
    { s: 'P', n: 'Current Electricity', d: 5 },
    { s: 'P', n: 'Moving Charges & Mag', d: 5 },
    { s: 'P', n: 'Magnetism & Matter', d: 2 },
    { s: 'P', n: 'EMI', d: 3 },
    { s: 'P', n: 'Alternating Current', d: 4 },
    { s: 'P', n: 'EM Waves', d: 1 },
    { s: 'P', n: 'Ray Optics', d: 5 },
    { s: 'P', n: 'Wave Optics', d: 4 },
    { s: 'P', n: 'Dual Nature of Radiation', d: 2 },
    { s: 'P', n: 'Atoms', d: 2 },
    { s: 'P', n: 'Nuclei', d: 2 },
    { s: 'P', n: 'Semiconductors', d: 4 },

    // CHEMISTRY (Class 11)
    { s: 'C', n: 'Some Basic Concepts', d: 2 },
    { s: 'C', n: 'Structure of Atom', d: 3 },
    { s: 'C', n: 'Periodicity', d: 2 },
    { s: 'C', n: 'Chemical Bonding', d: 5 },
    { s: 'C', n: 'Thermodynamics (Chem)', d: 4 },
    { s: 'C', n: 'Equilibrium', d: 5 },
    { s: 'C', n: 'Redox Reactions', d: 2 },
    { s: 'C', n: 'p-Block Elements (11)', d: 3 }, // Added
    { s: 'C', n: 'Organic: Basic Principles', d: 4 },
    { s: 'C', n: 'Hydrocarbons', d: 4 },
    // CHEMISTRY (Class 12)
    { s: 'C', n: 'Solutions', d: 3 },
    { s: 'C', n: 'Electrochemistry', d: 4 },
    { s: 'C', n: 'Chemical Kinetics', d: 3 },
    { s: 'C', n: 'd and f Block Elements', d: 3 },
    { s: 'C', n: 'Coordination Compounds', d: 4 },
    { s: 'C', n: 'p-Block Elements (12)', d: 4 }, // Added
    { s: 'C', n: 'Haloalkanes & Haloarenes', d: 3 },
    { s: 'C', n: 'Alcohols, Phenols, Ethers', d: 3 },
    { s: 'C', n: 'Aldehydes, Ketones, Acids', d: 5 },
    { s: 'C', n: 'Amines', d: 3 },
    { s: 'C', n: 'Biomolecules', d: 2 },

    // BIOLOGY (Class 11)
    { s: 'B', n: 'Living World', d: 1 },
    { s: 'B', n: 'Biological Classification', d: 2 },
    { s: 'B', n: 'Plant Kingdom', d: 3 },
    { s: 'B', n: 'Animal Kingdom', d: 4 },
    { s: 'B', n: 'Morphology of Plants', d: 3 },
    { s: 'B', n: 'Anatomy of Plants', d: 3 },
    { s: 'B', n: 'Structural Org in Animals', d: 2 },
    { s: 'B', n: 'Cell: The Unit of Life', d: 3 },
    { s: 'B', n: 'Biomolecules (Bio)', d: 2 },
    { s: 'B', n: 'Cell Cycle & Division', d: 2 },
    { s: 'B', n: 'Photosynthesis', d: 4 },
    { s: 'B', n: 'Respiration in Plants', d: 3 },
    { s: 'B', n: 'Plant Growth & Dev', d: 2 },
    { s: 'B', n: 'Breathing & Exchange', d: 2 },
    { s: 'B', n: 'Body Fluids & Circ', d: 3 },
    { s: 'B', n: 'Excretory Products', d: 3 },
    { s: 'B', n: 'Locomotion & Movement', d: 3 },
    { s: 'B', n: 'Neural Control', d: 4 },
    { s: 'B', n: 'Chemical Coordination', d: 3 },
    // BIOLOGY (Class 12)
    { s: 'B', n: 'Sexual Repro in Plants', d: 3 },
    { s: 'B', n: 'Human Reproduction', d: 4 },
    { s: 'B', n: 'Reproductive Health', d: 1 },
    { s: 'B', n: 'Principles of Inheritance', d: 5 },
    { s: 'B', n: 'Molecular Basis', d: 5 },
    { s: 'B', n: 'Evolution', d: 3 },
    { s: 'B', n: 'Human Health & Disease', d: 4 },
    { s: 'B', n: 'Microbes in Welfare', d: 1 },
    { s: 'B', n: 'Biotech: Principles', d: 3 },
    { s: 'B', n: 'Biotech: Applications', d: 2 },
    { s: 'B', n: 'Organisms & Populations', d: 3 },
    { s: 'B', n: 'Ecosystem', d: 2 },
    { s: 'B', n: 'Biodiversity', d: 2 },
];

export const INITIAL_SYLLABUS: Chapter[] = rawChapters.map((ch, idx) => ({
  id: `${ch.s.toLowerCase()}${idx}`,
  subject: subjects[ch.s],
  name: ch.n,
  lastRevised: Date.now(), // fresh start
  isDecayed: false,
  difficulty: ch.d,
  tiers: (Object.keys(TIER_CONFIG) as TierType[]).map(t => ({ id: t, label: TIER_CONFIG[t].label, completed: false, timestamp: null }))
}));

export const POWER_LAWS = [
  "LAW 1: NEITHER LOVE NOR HATE, ONLY DOMINATE.",
  "LAW 3: CONCEAL YOUR INTENTIONS.",
  "LAW 4: ALWAYS SAY LESS THAN NECESSARY.",
  "LAW 5: SO MUCH DEPENDS ON REPUTATION - GUARD IT.",
  "LAW 9: WIN THROUGH ACTIONS, NEVER ARGUMENT.",
  "LAW 10: INFECTION: AVOID THE UNHAPPY AND UNLUCKY.",
  "LAW 11: LEARN TO KEEP PEOPLE DEPENDENT ON YOU.",
  "LAW 13: APPEAL TO SELF-INTEREST, NEVER MERCY.",
  "LAW 15: CRUSH YOUR ENEMY TOTALLY.",
  "LAW 16: USE ABSENCE TO INCREASE RESPECT.",
  "LAW 19: KNOW WHO YOU'RE DEALING WITH.",
  "LAW 23: CONCENTRATE YOUR FORCES.",
  "LAW 25: RE-CREATE YOURSELF.",
  "LAW 28: ENTER ACTION WITH BOLDNESS.",
  "LAW 29: PLAN ALL THE WAY TO THE END.",
  "LAW 30: MAKE YOUR ACCOMPLISHMENTS SEEM EFFORTLESS.",
  "LAW 33: DISCOVER EACH MAN'S THUMBSCREW.",
  "LAW 34: BE ROYAL IN YOUR OWN FASHION.",
  "LAW 35: MASTER THE ART OF TIMING.",
  "LAW 37: CREATE COMPELLING SPECTACLES.",
  "LAW 41: AVOID STEPPING INTO A GREAT MAN'S SHOES.",
  "LAW 45: PREACH CHANGE, BUT NEVER REFORM TOO MUCH.",
  "LAW 47: DO NOT GO PAST THE MARK YOU AIMED FOR.",
  "LAW 48: ASSUME FORMLESSNESS."
];