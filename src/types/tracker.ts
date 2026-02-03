// Tracker-related types

export interface TrackerItem {
  id: string;
  companyName: string;
  website?: string;
  linkedInUrl?: string;
  founderName?: string;
  founderLinkedIn?: string;
  status: TrackerStatus;
  stage?: string;
  notes?: string;
  tags?: string[];
  addedAt: string;
  updatedAt: string;
  addedBy?: string;
}

export type TrackerStatus =
  | 'New Lead'
  | 'Researching'
  | 'Contacted'
  | 'Meeting Scheduled'
  | 'Due Diligence'
  | 'Term Sheet'
  | 'Invested'
  | 'Passed'
  | 'Watching';

export interface AddToTrackerPayload {
  companyName: string;
  website?: string;
  linkedInUrl?: string;
  founderName?: string;
  founderLinkedIn?: string;
  notes?: string;
  tags?: string[];
}

export interface MoveStatusPayload {
  itemId: string;
  newStatus: TrackerStatus;
  notes?: string;
}
