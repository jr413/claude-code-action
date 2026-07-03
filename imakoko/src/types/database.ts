// Hand-written to match supabase/migrations/0001_init.sql. Regenerate with
// `supabase gen types typescript` once a live project exists, and keep this
// file in sync with the migration in the meantime.

export type KycStatus = "pending" | "verified" | "rejected";
export type Plan = "free" | "premium";
export type PartnerPlan = "none" | "light" | "standard";
export type CheckinStatus = "here" | "heading";
export type JoinRequestStatus = "pending" | "approved" | "declined";
export type ReportStatus = "open" | "resolved";
export type ReportTargetType = "checkin" | "message" | "profile";
export type SubscriptionOwnerType = "user" | "shop";

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["areas"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          bio: string | null;
          interest_tags: string[];
          birth_date: string;
          kyc_status: KycStatus;
          kyc_image_url: string | null;
          plan: Plan;
          stripe_customer_id: string | null;
          strike_count: number;
          is_banned: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          bio?: string | null;
          interest_tags?: string[];
          birth_date: string;
          kyc_status?: KycStatus;
          kyc_image_url?: string | null;
          plan?: Plan;
          stripe_customer_id?: string | null;
          strike_count?: number;
          is_banned?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          area_id: string;
          name: string;
          genre: string | null;
          address: string | null;
          google_place_id: string | null;
          photo_url: string | null;
          partner_plan: PartnerPlan;
          partner_since: string | null;
          stripe_customer_id: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          area_id: string;
          name: string;
          genre?: string | null;
          address?: string | null;
          google_place_id?: string | null;
          photo_url?: string | null;
          partner_plan?: PartnerPlan;
          partner_since?: string | null;
          stripe_customer_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["shops"]["Insert"]>;
        Relationships: [];
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          status: CheckinStatus;
          message: string | null;
          capacity: number;
          expires_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shop_id: string;
          status: CheckinStatus;
          message?: string | null;
          capacity: number;
          expires_at: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkins"]["Insert"]>;
        Relationships: [];
      };
      join_requests: {
        Row: {
          id: string;
          checkin_id: string;
          requester_id: string;
          status: JoinRequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          checkin_id: string;
          requester_id: string;
          status?: JoinRequestStatus;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["join_requests"]["Insert"]
        >;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          join_request_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          join_request_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      meetups: {
        Row: {
          id: string;
          checkin_id: string;
          confirmed_by: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          checkin_id: string;
          confirmed_by?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meetups"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_user_id: string | null;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_user_id?: string | null;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          shop_id: string;
          title: string;
          conditions: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          shop_id: string;
          title: string;
          conditions?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          owner_type: SubscriptionOwnerType;
          owner_id: string;
          stripe_subscription_id: string;
          plan: string;
          status: string;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          owner_type: SubscriptionOwnerType;
          owner_id: string;
          stripe_subscription_id: string;
          plan: string;
          status: string;
          current_period_end?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocks"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
