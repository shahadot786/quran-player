import type { GroupStep } from "@/lib/zikir/types";

// Built-in content lives in code so an update never touches what a user saved. Names and meanings are in the message files under "zikir".
// Anything with reviewed: false stays hidden until its text, counts and source have been confirmed.
// "hisn" items come from Hisnul Muslim (the morning and evening remembrance) and are listed under their own heading.
export type BuiltInItem = { key: string; id: string; arabic: string; target: number; reviewed: boolean; source: string; collection?: "hisn" };
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
  { key: "ayatAlKursi", id: "builtin:ayatAlKursi", arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ", target: 1, reviewed: true, source: "Quran 2:255 (text from alquran.cloud, quran-uthmani); Hisnul Muslim 75", collection: "hisn" },
  { key: "ikhlas", id: "builtin:ikhlas", arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", target: 3, reviewed: true, source: "Quran 112; Hisnul Muslim 76", collection: "hisn" },
  { key: "falaq", id: "builtin:falaq", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", target: 3, reviewed: true, source: "Quran 113; Hisnul Muslim 76", collection: "hisn" },
  { key: "nas", id: "builtin:nas", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ", target: 3, reviewed: true, source: "Quran 114; Hisnul Muslim 76", collection: "hisn" },
  { key: "tahlil", id: "builtin:tahlil", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", target: 10, reviewed: true, source: "Hisnul Muslim 92 and 93; Bukhari 6403; Muslim 2691", collection: "hisn" },
  { key: "audhuKalimat", id: "builtin:audhuKalimat", arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", target: 3, reviewed: true, source: "Hisnul Muslim 97; Tirmidhi 3604b", collection: "hisn" },
  { key: "hisn75a", id: "builtin:hisn75a", arabic: "الْحَمْدُ لِلَّهِ وَحْدَهُ، وَالصَّلاَةُ وَالسَّلاَمُ عَلَى مَنْ لاَ نَبِيَّ بَعْدَهُ", target: 1, reviewed: true, source: "Hisnul Muslim 75a, sunnah.com/hisn:75a", collection: "hisn" },
  { key: "hisn77", id: "builtin:hisn77", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", target: 1, reviewed: true, source: "Hisnul Muslim 77, sunnah.com/hisn:77", collection: "hisn" },
  { key: "hisn77e", id: "builtin:hisn77e", arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", target: 1, reviewed: true, source: "Hisnul Muslim 77, sunnah.com/hisn:77. Evening wording derived from the footnotes on the Hisnul Muslim page (they give it in transliteration only).", collection: "hisn" },
  { key: "hisn78", id: "builtin:hisn78", arabic: "اللّهُمَّ بِكَ أَصْبَحْنا وَبِكَ أَمْسَينا وَبِكَ نَحْيا وَبِكَ نَموتُ وَإِلَيْكَ النِّشور", target: 1, reviewed: true, source: "Hisnul Muslim 78, sunnah.com/hisn:78", collection: "hisn" },
  { key: "hisn78e", id: "builtin:hisn78e", arabic: "اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير", target: 1, reviewed: true, source: "Hisnul Muslim 78, sunnah.com/hisn:78", collection: "hisn" },
  { key: "hisn79", id: "builtin:hisn79", arabic: "اللّهمَّ أَنْتَ رَبِّي لا إلهَ إلاّ أَنْتَ خَلَقْتَني وَأَنا عَبْدُك وَأَنا عَلى عَهْدِكَ وَوَعْدِكَ ما اسْتَطَعْت أَعوذُ بِكَ مِنْ شَرِّ ما صَنَعْت أَبوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبوءُ بِذَنْبي فَاغْفِرْ لي فَإِنَّهُ لا يَغْفِرُ الذُّنوبَ إِلاّ أَنْتَ", target: 1, reviewed: true, source: "Hisnul Muslim 79, sunnah.com/hisn:79", collection: "hisn" },
  { key: "hisn80", id: "builtin:hisn80", arabic: "اللّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُك، وَأُشْهِدُ حَمَلَةَ عَرْشِك، وَمَلائِكَتِك، وَجَميعَ خَلْقِك، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسولُك", target: 4, reviewed: true, source: "Hisnul Muslim 80, sunnah.com/hisn:80", collection: "hisn" },
  { key: "hisn80e", id: "builtin:hisn80e", arabic: "اللّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُك، وَأُشْهِدُ حَمَلَةَ عَرْشِك، وَمَلائِكَتِك، وَجَميعَ خَلْقِك، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسولُك", target: 4, reviewed: true, source: "Hisnul Muslim 80, sunnah.com/hisn:80. Evening wording derived from the footnote on the Hisnul Muslim page.", collection: "hisn" },
  { key: "hisn81", id: "builtin:hisn81", arabic: "اللّهُمَّ ما أَصْبَحَ بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك، فَمِنْكَ وَحْدَكَ لا شريكَ لَك، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر", target: 1, reviewed: true, source: "Hisnul Muslim 81, sunnah.com/hisn:81", collection: "hisn" },
  { key: "hisn81e", id: "builtin:hisn81e", arabic: "اللّهُمَّ ما أَمْسَى بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك، فَمِنْكَ وَحْدَكَ لا شريكَ لَك، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر", target: 1, reviewed: true, source: "Hisnul Muslim 81, sunnah.com/hisn:81. Evening wording derived from the footnote on the Hisnul Muslim page.", collection: "hisn" },
  { key: "hisn82", id: "builtin:hisn82", arabic: "اللّهُمَّ عافِني في بَدَني، اللّهُمَّ عافِني في سَمْعي، اللّهُمَّ عافِني في بَصَري، لا إلهَ إلاّ أَنْتَ. اللّهُمَّ إِنّي أَعوذُ بِكَ مِنَ الْكُفر، وَالفَقْر، وَأَعوذُ بِكَ مِنْ عَذابِ القَبْر، لا إلهَ إلاّ أَنْتَ.", target: 3, reviewed: true, source: "Hisnul Muslim 82, sunnah.com/hisn:82", collection: "hisn" },
  { key: "hisn83", id: "builtin:hisn83", arabic: "حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم.", target: 7, reviewed: true, source: "Hisnul Muslim 83, sunnah.com/hisn:83", collection: "hisn" },
  { key: "hisn84", id: "builtin:hisn84", arabic: "اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في الدُّنْيا وَالآخِرَة ، اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في ديني وَدُنْيايَ وَأهْلي وَمالي ، اللّهُمَّ اسْتُرْ عوْراتي وَآمِنْ رَوْعاتي ، اللّهُمَّ احْفَظْني مِن بَينِ يَدَيَّ وَمِن خَلْفي وَعَن يَميني وَعَن شِمالي ، وَمِن فَوْقي ، وَأَعوذُ بِعَظَمَتِكَ أَن أُغْتالَ مِن تَحْتي", target: 1, reviewed: true, source: "Hisnul Muslim 84, sunnah.com/hisn:84", collection: "hisn" },
  { key: "hisn85", id: "builtin:hisn85", arabic: "اللّهُمَّ عالِمَ الغَيْبِ وَالشّهادَةِ فاطِرَ السّماواتِ وَالأرْضِ رَبَّ كلِّ شَيءٍ وَمَليكَه ، أَشْهَدُ أَنْ لا إِلهَ إِلاّ أَنْت ، أَعوذُ بِكَ مِن شَرِّ نَفْسي وَمِن شَرِّ الشَّيْطانِ وَشِرْكِه ، وَأَنْ أَقْتَرِفَ عَلى نَفْسي سوءاً أَوْ أَجُرَّهُ إِلى مُسْلِم", target: 1, reviewed: true, source: "Hisnul Muslim 85, sunnah.com/hisn:85", collection: "hisn" },
  { key: "hisn86", id: "builtin:hisn86", arabic: "بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم .", target: 3, reviewed: true, source: "Hisnul Muslim 86, sunnah.com/hisn:86", collection: "hisn" },
  { key: "hisn87", id: "builtin:hisn87", arabic: "رَضيتُ بِاللهِ رَبَّاً وَبِالإسْلامِ ديناً وَبِمُحَمَّدٍ نَبِيّاً .", target: 3, reviewed: true, source: "Hisnul Muslim 87, sunnah.com/hisn:87", collection: "hisn" },
  { key: "hisn88", id: "builtin:hisn88", arabic: "يا حَيُّ يا قَيّومُ بِرَحْمَتِكَ أَسْتَغيث ، أَصْلِحْ لي شَأْني كُلَّه ، وَلا تَكِلني إِلى نَفْسي طَرْفَةَ عَين", target: 1, reviewed: true, source: "Hisnul Muslim 88, sunnah.com/hisn:88", collection: "hisn" },
  { key: "hisn89", id: "builtin:hisn89", arabic: "أَصْبَحْنا وَأَصْبَحَ المُلكُ للهِ رَبِّ العالَمين ، اللّهُمَّ إِنِّي أسْأَلُكَ خَيْرَ هذا اليَوْم ، فَتْحَهُ ، وَنَصْرَهُ ، وَنورَهُ وَبَرَكَتَهُ ، وَهُداهُ ، وَأَعوذُ بِكَ مِنْ شَرِّ ما فيهِ وَشَرِّ ما بَعْدَه", target: 1, reviewed: true, source: "Hisnul Muslim 89, sunnah.com/hisn:89", collection: "hisn" },
  { key: "hisn89e", id: "builtin:hisn89e", arabic: "أَمْسَيْنا وَأَمْسى المُلكُ للهِ رَبِّ العالَمين ، اللّهُمَّ إِنِّي أسْأَلُكَ خَيْرَ هذهِ اللَّيْلَة ، فَتْحَها ، وَنَصْرَها ، وَنورَها وَبَرَكَتَها ، وَهُداها ، وَأَعوذُ بِكَ مِنْ شَرِّ ما فيها وَشَرِّ ما بَعْدَها", target: 1, reviewed: true, source: "Hisnul Muslim 89, sunnah.com/hisn:89", collection: "hisn" },
  { key: "hisn90", id: "builtin:hisn90", arabic: "أَصْبَحْنا على فِطْرَةِ الإسْلام، وَعَلى كَلِمَةِ الإخْلاص، وَعلى دينِ نَبِيِّنا مُحَمَّدٍ وَعَلى مِلَّةِ أبينا إِبْراهيمَ حَنيفاً مُسْلِماً وَما كانَ مِنَ المُشرِكين", target: 1, reviewed: true, source: "Hisnul Muslim 90, sunnah.com/hisn:90", collection: "hisn" },
  { key: "hisn90e", id: "builtin:hisn90e", arabic: "أَمْسَينا على فِطْرَةِ الإسْلام، وَعَلى كَلِمَةِ الإخْلاص، وَعلى دينِ نَبِيِّنا مُحَمَّدٍ وَعَلى مِلَّةِ أبينا إِبْراهيمَ حَنيفاً مُسْلِماً وَما كانَ مِنَ المُشرِكين", target: 1, reviewed: true, source: "Hisnul Muslim 90, sunnah.com/hisn:90", collection: "hisn" },
  { key: "hisn94", id: "builtin:hisn94", arabic: "سُبْحانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِه ، وَرِضا نَفْسِه ، وَزِنَةَ عَرْشِه ، وَمِدادَ كَلِماتِه .", target: 3, reviewed: true, source: "Hisnul Muslim 94, sunnah.com/hisn:94", collection: "hisn" },
  { key: "hisn95", id: "builtin:hisn95", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً", target: 1, reviewed: true, source: "Hisnul Muslim 95, sunnah.com/hisn:95", collection: "hisn" },
  { key: "hisn96", id: "builtin:hisn96", arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", target: 100, reviewed: true, source: "Hisnul Muslim 96, sunnah.com/hisn:96", collection: "hisn" },
  { key: "hisn98", id: "builtin:hisn98", arabic: "اللَّهُمَّ صَلِّ وَ سَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", target: 10, reviewed: true, source: "Hisnul Muslim 98, sunnah.com/hisn:98", collection: "hisn" },
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
    steps: [{ itemId: "builtin:hisn75a", target: 1 }, { itemId: "builtin:ayatAlKursi", target: 1 }, { itemId: "builtin:ikhlas", target: 3 }, { itemId: "builtin:falaq", target: 3 }, { itemId: "builtin:nas", target: 3 }, { itemId: "builtin:hisn77", target: 1 }, { itemId: "builtin:hisn78", target: 1 }, { itemId: "builtin:hisn79", target: 1 }, { itemId: "builtin:hisn80", target: 4 }, { itemId: "builtin:hisn81", target: 1 }, { itemId: "builtin:hisn82", target: 3 }, { itemId: "builtin:hisn83", target: 7 }, { itemId: "builtin:hisn84", target: 1 }, { itemId: "builtin:hisn85", target: 1 }, { itemId: "builtin:hisn86", target: 3 }, { itemId: "builtin:hisn87", target: 3 }, { itemId: "builtin:hisn88", target: 1 }, { itemId: "builtin:hisn89", target: 1 }, { itemId: "builtin:hisn90", target: 1 }, { itemId: "builtin:subhanAllahiWaBihamdihi", target: 100 }, { itemId: "builtin:tahlil", target: 100 }, { itemId: "builtin:hisn94", target: 3 }, { itemId: "builtin:hisn95", target: 1 }, { itemId: "builtin:hisn96", target: 100 }, { itemId: "builtin:hisn98", target: 10 }],
    reviewed: true,
    source: "Hisnul Muslim 75a to 96 and 98, in the book's order (sunnah.com/hisn)",
  },
  {
    key: "eveningAdhkar",
    id: "builtin:eveningAdhkar",
    steps: [{ itemId: "builtin:hisn75a", target: 1 }, { itemId: "builtin:ayatAlKursi", target: 1 }, { itemId: "builtin:ikhlas", target: 3 }, { itemId: "builtin:falaq", target: 3 }, { itemId: "builtin:nas", target: 3 }, { itemId: "builtin:hisn77e", target: 1 }, { itemId: "builtin:hisn78e", target: 1 }, { itemId: "builtin:hisn79", target: 1 }, { itemId: "builtin:hisn80e", target: 4 }, { itemId: "builtin:hisn81e", target: 1 }, { itemId: "builtin:hisn82", target: 3 }, { itemId: "builtin:hisn83", target: 7 }, { itemId: "builtin:hisn84", target: 1 }, { itemId: "builtin:hisn85", target: 1 }, { itemId: "builtin:hisn86", target: 3 }, { itemId: "builtin:hisn87", target: 3 }, { itemId: "builtin:hisn88", target: 1 }, { itemId: "builtin:hisn89e", target: 1 }, { itemId: "builtin:hisn90e", target: 1 }, { itemId: "builtin:subhanAllahiWaBihamdihi", target: 100 }, { itemId: "builtin:tahlil", target: 10 }, { itemId: "builtin:hisn96", target: 100 }, { itemId: "builtin:audhuKalimat", target: 3 }, { itemId: "builtin:hisn98", target: 10 }],
    reviewed: true,
    source: "Hisnul Muslim 75a to 92, 96 to 98, in the book's order (sunnah.com/hisn)",
  },
];

export const isBuiltIn = (id: string) => id.startsWith(BUILT_IN_PREFIX);
export const getBuiltInItem = (id: string) => BUILT_IN_ITEMS.find((item) => item.id === id);
export const getBuiltInGroup = (id: string) => BUILT_IN_GROUPS.find((group) => group.id === id);

export const visibleBuiltInItems = () => BUILT_IN_ITEMS.filter((item) => item.reviewed);
export const visibleBuiltInGroups = () => BUILT_IN_GROUPS.filter((group) => group.reviewed);
