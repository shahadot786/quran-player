import type { GroupStep } from "@/lib/zikir/types";

// Built-in content lives in code so an update never touches what a user saved. Names and meanings are in the message files under "zikir".
// Anything with reviewed: false stays hidden until its text, counts and source have been confirmed.
export type BuiltInItem = { key: string; id: string; arabic: string; target: number; reviewed: boolean; source: string };
export type BuiltInGroup = { key: string; id: string; steps: GroupStep[]; reviewed: boolean; source: string };

export const BUILT_IN_PREFIX = "builtin:";

export const BUILT_IN_ITEMS: BuiltInItem[] = [
  { key: "subhanAllah", id: "builtin:subhanAllah", arabic: "سُبْحَانَ اللَّهِ", target: 33, reviewed: true, source: "Standard dhikr phrase" },
  { key: "alhamdulillah", id: "builtin:alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", target: 33, reviewed: true, source: "Standard dhikr phrase" },
  { key: "allahuAkbar", id: "builtin:allahuAkbar", arabic: "اللَّهُ أَكْبَرُ", target: 34, reviewed: true, source: "Standard dhikr phrase" },
  { key: "laIlahaIllallah", id: "builtin:laIlahaIllallah", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", target: 100, reviewed: true, source: "Standard dhikr phrase" },
  { key: "astaghfirullah", id: "builtin:astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", target: 100, reviewed: true, source: "Standard dhikr phrase" },
  { key: "salawat", id: "builtin:salawat", arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ", target: 100, reviewed: true, source: "Standard salawat wording" },
  { key: "laHawla", id: "builtin:laHawla", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", target: 100, reviewed: true, source: "Standard dhikr phrase" },
  { key: "subhanAllahiWaBihamdihi", id: "builtin:subhanAllahiWaBihamdihi", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", target: 100, reviewed: true, source: "Standard dhikr phrase" },
  { key: "ayatAlKursi", id: "builtin:ayatAlKursi", arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ", target: 1, reviewed: false, source: "Quran 2:255, text from alquran.cloud (quran-uthmani)" },
  { key: "ikhlas", id: "builtin:ikhlas", arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", target: 3, reviewed: false, source: "Quran 112, text from alquran.cloud (quran-uthmani), without the Basmalah" },
  { key: "falaq", id: "builtin:falaq", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", target: 3, reviewed: false, source: "Quran 113, text from alquran.cloud (quran-uthmani), without the Basmalah" },
  { key: "nas", id: "builtin:nas", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ", target: 3, reviewed: false, source: "Quran 114, text from alquran.cloud (quran-uthmani), without the Basmalah" },
  { key: "tahlil", id: "builtin:tahlil", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", target: 10, reviewed: false, source: "To be confirmed against a trusted source" },
  { key: "audhuKalimat", id: "builtin:audhuKalimat", arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", target: 3, reviewed: false, source: "To be confirmed against a trusted source" },
];

export const BUILT_IN_GROUPS: BuiltInGroup[] = [
  {
    key: "afterSalah",
    id: "builtin:afterSalah",
    steps: [{ itemId: "builtin:subhanAllah", target: 33 }, { itemId: "builtin:alhamdulillah", target: 33 }, { itemId: "builtin:allahuAkbar", target: 34 }],
    reviewed: true,
    source: "Widely known 33, 33, 34 count after the prayer",
  },
  {
    key: "istighfarSalawat",
    id: "builtin:istighfarSalawat",
    steps: [{ itemId: "builtin:astaghfirullah", target: 100 }, { itemId: "builtin:salawat", target: 100 }],
    reviewed: true,
    source: "A daily wird, counts chosen by the app",
  },
  {
    key: "morningAdhkar",
    id: "builtin:morningAdhkar",
    steps: [{ itemId: "builtin:ayatAlKursi", target: 1 }, { itemId: "builtin:ikhlas", target: 3 }, { itemId: "builtin:falaq", target: 3 }, { itemId: "builtin:nas", target: 3 }, { itemId: "builtin:subhanAllahiWaBihamdihi", target: 100 }, { itemId: "builtin:astaghfirullah", target: 100 }, { itemId: "builtin:salawat", target: 10 }, { itemId: "builtin:tahlil", target: 10 }],
    reviewed: false,
    source: "Candidate list: every text and count must be confirmed against a trusted source before release",
  },
  {
    key: "eveningAdhkar",
    id: "builtin:eveningAdhkar",
    steps: [{ itemId: "builtin:ayatAlKursi", target: 1 }, { itemId: "builtin:ikhlas", target: 3 }, { itemId: "builtin:falaq", target: 3 }, { itemId: "builtin:nas", target: 3 }, { itemId: "builtin:audhuKalimat", target: 3 }, { itemId: "builtin:subhanAllahiWaBihamdihi", target: 100 }, { itemId: "builtin:astaghfirullah", target: 100 }, { itemId: "builtin:salawat", target: 10 }, { itemId: "builtin:tahlil", target: 10 }],
    reviewed: false,
    source: "Candidate list: every text and count must be confirmed against a trusted source before release",
  },
];

export const isBuiltIn = (id: string) => id.startsWith(BUILT_IN_PREFIX);
export const getBuiltInItem = (id: string) => BUILT_IN_ITEMS.find((item) => item.id === id);
export const getBuiltInGroup = (id: string) => BUILT_IN_GROUPS.find((group) => group.id === id);

export const visibleBuiltInItems = () => BUILT_IN_ITEMS.filter((item) => item.reviewed);
export const visibleBuiltInGroups = () => BUILT_IN_GROUPS.filter((group) => group.reviewed);
