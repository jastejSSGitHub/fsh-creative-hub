export type HubRole = "admin" | "editor" | "viewer";

export type AssetStatus = "pending" | "approved" | "rejected" | "final";
export type AssetType = "image" | "video";
export type VoteReaction = "fire" | "up" | "hmm" | "no";
export type ActivityVerb =
  | "approved"
  | "rejected"
  | "commented"
  | "uploaded"
  | "voted"
  | "final";
export type ActivityTargetType = "asset" | "idea" | "initiative";

export type HubProfile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type HubProject = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  created_at: string;
  trashed_at: string | null;
  updated_at: string;
};

export type HubProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: HubRole;
  created_at: string;
  is_favorite: boolean;
  favorited_at: string | null;
};

export type HubProjectFileType = "review_board" | "canvas" | "text_document";

export type HubProjectFile = {
  id: string;
  project_id: string;
  type: HubProjectFileType;
  name: string;
  config: Record<string, unknown>;
  sort_order: number;
  created_by: string;
  created_at: string;
};

export type HubProjectFileFavorite = {
  id: string;
  user_id: string;
  file_id: string;
  favorited_at: string;
};

export type HubInitiative = {
  id: string;
  project_id: string;
  review_board_id: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type HubAsset = {
  id: string;
  initiative_id: string;
  name: string;
  type: AssetType;
  storage_path: string;
  public_url: string;
  tag: string;
  status: AssetStatus;
  uploaded_by: string;
  sort_order: number;
  variant_of: string | null;
  is_fix_candidate: boolean;
  legacy_approved_by: string | null;
  created_at: string;
};

export type HubComment = {
  id: string;
  asset_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  mentions: string[];
  resolved: boolean;
  created_at: string;
};

export type HubVote = {
  id: string;
  asset_id: string;
  user_id: string;
  reaction: VoteReaction;
  created_at: string;
};

export type HubIdea = {
  id: string;
  initiative_id: string;
  author_id: string;
  body: string;
  color: string;
  created_at: string;
};

export type HubIdeaVote = {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
};

export type HubActivity = {
  id: string;
  project_id: string;
  actor_id: string;
  verb: ActivityVerb;
  target_type: ActivityTargetType;
  target_id: string;
  summary: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      hub_profiles: { Row: HubProfile; Insert: Partial<HubProfile> & Pick<HubProfile, "id" | "email" | "display_name">; Update: Partial<HubProfile> };
      hub_projects: { Row: HubProject; Insert: Partial<HubProject> & Pick<HubProject, "name" | "created_by">; Update: Partial<HubProject> };
      hub_project_members: { Row: HubProjectMember; Insert: Partial<HubProjectMember> & Pick<HubProjectMember, "project_id" | "user_id" | "role">; Update: Partial<HubProjectMember> };
      hub_initiatives: { Row: HubInitiative; Insert: Partial<HubInitiative> & Pick<HubInitiative, "project_id" | "name">; Update: Partial<HubInitiative> };
      hub_project_files: { Row: HubProjectFile; Insert: Partial<HubProjectFile> & Pick<HubProjectFile, "project_id" | "type" | "name" | "created_by">; Update: Partial<HubProjectFile> };
      hub_project_file_favorites: { Row: HubProjectFileFavorite; Insert: Partial<HubProjectFileFavorite> & Pick<HubProjectFileFavorite, "user_id" | "file_id">; Update: Partial<HubProjectFileFavorite> };
      hub_assets: { Row: HubAsset; Insert: Partial<HubAsset> & Pick<HubAsset, "initiative_id" | "name" | "type" | "storage_path" | "public_url" | "uploaded_by">; Update: Partial<HubAsset> };
      hub_comments: { Row: HubComment; Insert: Partial<HubComment> & Pick<HubComment, "asset_id" | "author_id" | "body">; Update: Partial<HubComment> };
      hub_votes: { Row: HubVote; Insert: Partial<HubVote> & Pick<HubVote, "asset_id" | "user_id" | "reaction">; Update: Partial<HubVote> };
      hub_ideas: { Row: HubIdea; Insert: Partial<HubIdea> & Pick<HubIdea, "initiative_id" | "author_id" | "body">; Update: Partial<HubIdea> };
      hub_idea_votes: { Row: HubIdeaVote; Insert: Partial<HubIdeaVote> & Pick<HubIdeaVote, "idea_id" | "user_id">; Update: Partial<HubIdeaVote> };
      hub_activity: { Row: HubActivity; Insert: Partial<HubActivity> & Pick<HubActivity, "project_id" | "actor_id" | "verb" | "target_type" | "target_id" | "summary">; Update: Partial<HubActivity> };
    };
  };
};
