export interface DailyNeedAuthor {
  public_id: string;
  full_name: string;
  avatar_url?: string | null;
}


export interface DailyNeed {
  daily_need_id: number;
  content: string;
  note_date: string;
  created_at: string;
  updated_at: string;
  author: DailyNeedAuthor;
  checkin_created?: boolean;
}

export interface DailyNeedPublic {
  daily_need_id: number;
  content: string;
  note_date: string;
  updated_at: string;
  author?: DailyNeedAuthor | null;
}

export interface DailyNeedSummary {
  today_journal: DailyNeed | null;
  has_journal_today: boolean;
  has_checked_in_today: boolean;
  has_posted_today?: boolean;
  streak_count: number;
}


export interface DailyNeedCreateOrUpdatePayload {
  content: string;
}

export interface DailyNeedListResponse {
  items: DailyNeed[];
}

