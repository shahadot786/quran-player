export type Moshaf = {
  id: number;
  name: string;
  server: string;
  padded: boolean;
  downloadable: boolean;
  /** Ayah-by-ayah timings exist for every surah, so the text can follow the recitation. */
  synced: boolean;
};

export type Reciter = {
  id: number;
  name: string;
  moshafs: Moshaf[];
};

export type SourceMoshaf = Omit<Moshaf, "synced"> & { surahs: number[] };
export type SourceReciter = { id: number; name: string; moshafs: SourceMoshaf[] };

export type ReciterSummary = {
  id: number;
  name: string;
  moshafCount: number;
};

export type Track = {
  reciterId: number;
  reciterName: string;
  moshafId: number;
  moshafName: string;
  server: string;
  padded: boolean;
  downloadable?: boolean;
  synced?: boolean;
  surah: number;
};

export type Surah = {
  id: number;
  name: string;
  arabicName: string;
  translation: string;
  versesCount: number;
  revelation: "meccan" | "medinan";
  revelationOrder: number;
};
