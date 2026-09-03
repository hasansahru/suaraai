export type OutputType = "shorts" | "video_panjang";

export type DurationOption =
  | "30s"
  | "45s"
  | "60s"
  | "75s"
  | "90s"
  | "5-15m"
  | "15-30m"
  | "30-60m"
  | "1-2j"
  | "2-4j";

export interface ChannelDna {
  id: string;
  name: string;
  description: string;
  avatar: string;
  accent: string;
}

export interface AnalysisHistoryItem {
  id: string;
  title: string;
  channel_dna: string;
  output_type_id: string;
  created_at: string;
  result: any;
}

export interface ProviderConfig {
  id: string;
  name: string;
  mode: string;
  default_base_url?: string;
  models?: string[] | { id: string; name: string }[];
}
