export type SystemRole =
  | 'SYSTEM_ADMIN'
  | 'COMPANY_ADMIN'
  | 'PROJECT_MANAGER'
  | 'TEAM_LEAD'
  | 'DEVELOPER'
  | 'QA'
  | 'DESIGNER'
  | 'VIEWER';

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  SYSTEM_ADMIN: 'Системный администратор',
  COMPANY_ADMIN: 'Администратор компании',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_LEAD: 'Team Lead',
  DEVELOPER: 'Разработчик',
  QA: 'QA-инженер',
  DESIGNER: 'Дизайнер',
  VIEWER: 'Наблюдатель',
};

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  systemRole: SystemRole;
  position: string | null;
  department: string | null;
  timezone: string | null;
  language: string | null;
  bio: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface ProjectMember {
  id: string;
  role: ProjectRole;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    issues: number;
    members: number;
  };
}

export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    issues: number;
  };
}

export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC';

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: IssuePriority;
  type: IssueType;
  order: number;
  dueDate: string | null;
  projectId: string;
  reporterId: string;
  reporter: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  assigneeId: string | null;
  assignee: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null;
  startDate: string | null;
  columnId: string;
  column: Pick<Column, 'id' | 'title' | 'color' | 'order'>;
  storyPoints: number | null;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
  };
  comments?: Comment[];
}

export interface Comment {
  id: string;
  body: string;
  issueId: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface CreateColumnDto {
  title: string;
  color?: string;
}

export interface UpdateColumnDto {
  title?: string;
  color?: string;
}

export interface ReorderColumnsDto {
  orders: { id: string; order: number }[];
}

export interface CreateIssueDto {
  title: string;
  description?: string;
  columnId?: string;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  storyPoints?: number | null;
  sprintId?: string | null;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  avatar?: string;
  position?: string;
  department?: string;
  timezone?: string;
  language?: string;
  bio?: string;
}

// ─── Extended Issue types ─────────────────────────────────────────────────────

export interface IssueDetail extends Issue {
  storyPoints: number | null;
  sprintId: string | null;
  sprint?: Sprint | null;
  parentId: string | null;
  parent?: Pick<Issue, 'id' | 'number' | 'title' | 'type'> | null;
  labels: IssueLabel[];
  watchers: Watcher[];
  _count: {
    comments: number;
    checklists?: number;
    timeEntries?: number;
  };
}

// ─── Sprint ───────────────────────────────────────────────────────────────────

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED';

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  capacity: number | null;
  velocity: number | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { issues: number };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
  _count?: { issues: number };
}

export interface IssueLabel {
  label: Label;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  completedAt: string | null;
  assigneeId: string | null;
  assignee: Pick<User, 'id' | 'name' | 'avatar'> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  order: number;
  issueId: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Time Tracking ────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  minutes: number;
  description: string | null;
  date: string;
  issueId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntriesResponse {
  entries: TimeEntry[];
  totalMinutes: number;
}

// ─── Issue Links ──────────────────────────────────────────────────────────────

export type IssueLinkType = 'BLOCKS' | 'RELATES_TO' | 'DUPLICATES' | 'CLONES' | 'SPLIT_FROM' | 'CAUSED_BY';

export interface IssueStub {
  id: string;
  number: number;
  title: string;
  priority: IssuePriority;
  type: IssueType;
}

export interface IssueLink {
  id: string;
  type: IssueLinkType;
  source: IssueStub;
  target: IssueStub;
  createdAt: string;
}

export interface IssueLinksResponse {
  outgoing: IssueLink[];
  incoming: IssueLink[];
}

// ─── Watchers ─────────────────────────────────────────────────────────────────

export interface Watcher {
  issueId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  createdAt: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityAction =
  | 'CREATED' | 'UPDATED' | 'DELETED' | 'RESTORED' | 'COMMENTED'
  | 'MOVED' | 'ASSIGNED' | 'UNASSIGNED' | 'LABELED' | 'UNLABELED'
  | 'LINKED' | 'UNLINKED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED'
  | 'POINTS_CHANGED' | 'DUE_DATE_CHANGED' | 'SPRINT_ADDED' | 'SPRINT_REMOVED'
  | 'CHECKLIST_ADDED' | 'CHECKLIST_COMPLETED' | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REMOVED' | 'WATCHER_ADDED' | 'WATCHER_REMOVED';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  issueId: string | null;
  projectId: string | null;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  issueId: string;
  uploaderId: string;
  uploader: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'ISSUE_ASSIGNED' | 'ISSUE_UNASSIGNED' | 'ISSUE_MENTIONED'
  | 'ISSUE_COMMENTED' | 'ISSUE_STATUS_CHANGED' | 'ISSUE_RESOLVED'
  | 'SPRINT_STARTED' | 'SPRINT_COMPLETED'
  | 'PROJECT_MEMBER_ADDED' | 'PROJECT_MEMBER_REMOVED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  readAt: string | null;
  userId: string;
  actorId: string | null;
  actor: Pick<User, 'id' | 'name' | 'avatar'> | null;
  issueId: string | null;
  issue: Pick<Issue, 'id' | 'number' | 'title'> | null;
  projectId: string | null;
  project: Pick<Project, 'id' | 'name'> | null;
  createdAt: string;
}
