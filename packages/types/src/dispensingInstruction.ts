export type FrequencyType = 'once_daily' | 'twice_daily' | 'three_daily' | 'four_daily' | 'as_needed' | 'custom';
export type TimingType = 'before_meal' | 'after_meal' | 'with_meal' | 'morning' | 'night' | 'any';
export type StorageType = 'cool_dry' | 'refrigerate' | 'away_from_light' | 'away_from_children' | 'shake_well';

export interface DispensingInstruction {
  id: string;
  workspace_id: string;
  branch_id: string;
  sale_id: string;
  sale_line_id: string;
  customer_id: string | null;
  dose: string;
  frequency: FrequencyType;
  timing: TimingType | null;
  duration_days: number | null;
  storage: StorageType[];
  note: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
