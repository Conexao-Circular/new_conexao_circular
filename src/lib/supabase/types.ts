export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      agent_analytics_events: {
        Row: {
          agent_id: string;
          created_at: string;
          event_name: string;
          id: string;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          event_name: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          event_name?: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_analytics_events_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_course_progress: {
        Row: {
          agent_id: string;
          completed_at: string | null;
          course_slug: string;
          created_at: string;
          id: string;
          progress_percent: number;
          quiz_attempts: number;
          quiz_passed: boolean;
          quiz_score: number;
          started_at: string | null;
          status: string;
          updated_at: string;
          xp_earned: number;
        };
        Insert: {
          agent_id: string;
          completed_at?: string | null;
          course_slug: string;
          created_at?: string;
          id?: string;
          progress_percent?: number;
          quiz_attempts?: number;
          quiz_passed?: boolean;
          quiz_score?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          xp_earned?: number;
        };
        Update: {
          agent_id?: string;
          completed_at?: string | null;
          course_slug?: string;
          created_at?: string;
          id?: string;
          progress_percent?: number;
          quiz_attempts?: number;
          quiz_passed?: boolean;
          quiz_score?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "agent_course_progress_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_evidences: {
        Row: {
          agent_id: string;
          content_type: string | null;
          created_at: string;
          description: string | null;
          evidence_type: string;
          file_path: string;
          file_name: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          object_key: string | null;
          observation: string | null;
          referral_id: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          content_type?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_type?: string;
          file_path: string;
          file_name?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          object_key?: string | null;
          observation?: string | null;
          referral_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          content_type?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_type?: string;
          file_path?: string;
          file_name?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          object_key?: string | null;
          observation?: string | null;
          referral_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_evidences_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_evidences_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_referrals: {
        Row: {
          agent_id: string;
          city: string | null;
          converted_at: string | null;
          created_at: string;
          contact: string | null;
          id: string;
          name: string | null;
          neighborhood: string | null;
          observed_practice: string | null;
          reason: string | null;
          referred_at: string | null;
          referred_email: string | null;
          referred_user_id: string | null;
          referral_code: string | null;
          referral_type: string | null;
          responsible_name: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          city?: string | null;
          converted_at?: string | null;
          created_at?: string;
          contact?: string | null;
          id?: string;
          name?: string | null;
          neighborhood?: string | null;
          observed_practice?: string | null;
          reason?: string | null;
          referred_at?: string | null;
          referred_email?: string | null;
          referred_user_id?: string | null;
          referral_code?: string | null;
          referral_type?: string | null;
          responsible_name?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          city?: string | null;
          converted_at?: string | null;
          created_at?: string;
          contact?: string | null;
          id?: string;
          name?: string | null;
          neighborhood?: string | null;
          observed_practice?: string | null;
          reason?: string | null;
          referred_at?: string | null;
          referred_email?: string | null;
          referred_user_id?: string | null;
          referral_code?: string | null;
          referral_type?: string | null;
          responsible_name?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_referrals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_referrals_referred_user_id_fkey";
            columns: ["referred_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      achievements: {
        Row: {
          code: string;
          description: string;
          icon: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          description: string;
          icon: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          description?: string;
          icon?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_request_photos: {
        Row: {
          created_at: string;
          id: string;
          request_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          request_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          request_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_request_photos_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "collection_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_requests: {
        Row: {
          access_instructions: string | null;
          address: string;
          address_city: string | null;
          address_complement: string | null;
          address_neighborhood: string | null;
          address_number: string | null;
          address_reference: string | null;
          address_state: string | null;
          address_street: string | null;
          address_zip: string | null;
          canceled_at: string | null;
          confirmed_at: string | null;
          confirmed_weight_kg: number | null;
          contact_name: string | null;
          contact_phone: string | null;
          cooperative_id: string | null;
          created_at: string;
          dry_materials: string[];
          estimated_volumes: number | null;
          estimated_weight_kg: number | null;
          execution_notes: string | null;
          id: string;
          notes: string | null;
          preferred_date: string | null;
          preferred_time_window: string | null;
          proof_image_url: string | null;
          requested_at: string;
          requester_id: string;
          status: Database["public"]["Enums"]["collection_status"];
          updated_at: string;
          waste_type: Database["public"]["Enums"]["waste_type"];
        };
        Insert: {
          access_instructions?: string | null;
          address: string;
          address_city?: string | null;
          address_complement?: string | null;
          address_neighborhood?: string | null;
          address_number?: string | null;
          address_reference?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          canceled_at?: string | null;
          confirmed_at?: string | null;
          confirmed_weight_kg?: number | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          cooperative_id?: string | null;
          created_at?: string;
          dry_materials?: string[];
          estimated_volumes?: number | null;
          estimated_weight_kg?: number | null;
          execution_notes?: string | null;
          id?: string;
          notes?: string | null;
          preferred_date?: string | null;
          preferred_time_window?: string | null;
          proof_image_url?: string | null;
          requested_at?: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["collection_status"];
          updated_at?: string;
          waste_type: Database["public"]["Enums"]["waste_type"];
        };
        Update: {
          access_instructions?: string | null;
          address?: string;
          address_city?: string | null;
          address_complement?: string | null;
          address_neighborhood?: string | null;
          address_number?: string | null;
          address_reference?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          canceled_at?: string | null;
          confirmed_at?: string | null;
          confirmed_weight_kg?: number | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          cooperative_id?: string | null;
          created_at?: string;
          dry_materials?: string[];
          estimated_volumes?: number | null;
          estimated_weight_kg?: number | null;
          execution_notes?: string | null;
          id?: string;
          notes?: string | null;
          preferred_date?: string | null;
          preferred_time_window?: string | null;
          proof_image_url?: string | null;
          requested_at?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["collection_status"];
          updated_at?: string;
          waste_type?: Database["public"]["Enums"]["waste_type"];
        };
        Relationships: [
          {
            foreignKeyName: "collection_requests_cooperative_id_fkey";
            columns: ["cooperative_id"];
            isOneToOne: false;
            referencedRelation: "cooperatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      consent_records: {
        Row: {
          consent_type: string;
          created_at: string;
          granted: boolean;
          id: string;
          legal_basis: string;
          profile_id: string;
          purpose: string;
          version: string;
        };
        Insert: {
          consent_type: string;
          created_at?: string;
          granted?: boolean;
          id?: string;
          legal_basis: string;
          profile_id: string;
          purpose: string;
          version: string;
        };
        Update: {
          consent_type?: string;
          created_at?: string;
          granted?: boolean;
          id?: string;
          legal_basis?: string;
          profile_id?: string;
          purpose?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cooperatives: {
        Row: {
          capacity_kg_day: number | null;
          collects_description: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          document: string | null;
          id: string;
          name: string;
          operation_description: string | null;
          profile_id: string | null;
          service_area: string | null;
          status: Database["public"]["Enums"]["cooperative_status"];
          type: Database["public"]["Enums"]["cooperative_type"];
          updated_at: string;
        };
        Insert: {
          capacity_kg_day?: number | null;
          collects_description?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          document?: string | null;
          id?: string;
          name: string;
          operation_description?: string | null;
          profile_id?: string | null;
          service_area?: string | null;
          status?: Database["public"]["Enums"]["cooperative_status"];
          type?: Database["public"]["Enums"]["cooperative_type"];
          updated_at?: string;
        };
        Update: {
          capacity_kg_day?: number | null;
          collects_description?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          document?: string | null;
          id?: string;
          name?: string;
          operation_description?: string | null;
          profile_id?: string | null;
          service_area?: string | null;
          status?: Database["public"]["Enums"]["cooperative_status"];
          type?: Database["public"]["Enums"]["cooperative_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cooperatives_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          points_value: number;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          points_value?: number;
          product_id: string;
          quantity?: number;
          unit_price_cents: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          points_value?: number;
          product_id?: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_reviews: {
        Row: {
          buyer_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string;
          photo_paths: string[];
          rating: number;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          photo_paths?: string[];
          rating: number;
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          photo_paths?: string[];
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_reviews_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_shipments: {
        Row: {
          carrier: string | null;
          collected_at: string | null;
          created_at: string;
          delivered_at: string | null;
          freight_cents: number;
          id: string;
          order_id: string;
          partner_id: string;
          shipped_at: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          tracking_code: string | null;
          updated_at: string;
        };
        Insert: {
          carrier?: string | null;
          collected_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          freight_cents?: number;
          id?: string;
          order_id: string;
          partner_id: string;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_code?: string | null;
          updated_at?: string;
        };
        Update: {
          carrier?: string | null;
          collected_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          freight_cents?: number;
          id?: string;
          order_id?: string;
          partner_id?: string;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_code?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_shipments_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          buyer_id: string;
          cashback_used_cents: number;
          created_at: string;
          delivery_address: Json | null;
          freight_cents: number;
          id: string;
          level_discount_cents: number;
          order_code: string;
          payment_intent_id: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_url: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_cents: number;
          total_points: number;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          cashback_used_cents?: number;
          created_at?: string;
          delivery_address?: Json | null;
          freight_cents?: number;
          id?: string;
          level_discount_cents?: number;
          order_code?: string;
          payment_intent_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_url?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_cents?: number;
          total_points?: number;
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          cashback_used_cents?: number;
          created_at?: string;
          delivery_address?: Json | null;
          freight_cents?: number;
          id?: string;
          level_discount_cents?: number;
          order_code?: string;
          payment_intent_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_url?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_cents?: number;
          total_points?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_items: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          partner_id: string;
          points_cost: number;
          price_cents: number;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          partner_id: string;
          points_cost?: number;
          price_cents: number;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          partner_id?: string;
          points_cost?: number;
          price_cents?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "partner_items_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      partners: {
        Row: {
          address: string;
          category: Database["public"]["Enums"]["partner_category"];
          city: string | null;
          created_at: string;
          description: string | null;
          early_access_min_level: number;
          early_access_until: string | null;
          geocode_label: string | null;
          id: string;
          image_url: string | null;
          import_recommendation: string | null;
          imported_at: string | null;
          imported_category: string | null;
          instagram_url: string | null;
          latitude: number | null;
          longitude: number | null;
          map_opt_in: boolean;
          name: string;
          owner_profile_id: string | null;
          participant_kind: string | null;
          postal_code: string | null;
          public_phone: string | null;
          quality_status: string | null;
          seal: boolean;
          source_record_id: string | null;
          source_system: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          address: string;
          category: Database["public"]["Enums"]["partner_category"];
          city?: string | null;
          created_at?: string;
          description?: string | null;
          early_access_min_level?: number;
          early_access_until?: string | null;
          geocode_label?: string | null;
          id?: string;
          image_url?: string | null;
          import_recommendation?: string | null;
          imported_at?: string | null;
          imported_category?: string | null;
          instagram_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          map_opt_in?: boolean;
          name: string;
          owner_profile_id?: string | null;
          participant_kind?: string | null;
          postal_code?: string | null;
          public_phone?: string | null;
          quality_status?: string | null;
          seal?: boolean;
          source_record_id?: string | null;
          source_system?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          address?: string;
          category?: Database["public"]["Enums"]["partner_category"];
          city?: string | null;
          created_at?: string;
          description?: string | null;
          early_access_min_level?: number;
          early_access_until?: string | null;
          geocode_label?: string | null;
          id?: string;
          image_url?: string | null;
          import_recommendation?: string | null;
          imported_at?: string | null;
          imported_category?: string | null;
          instagram_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          map_opt_in?: boolean;
          name?: string;
          owner_profile_id?: string | null;
          participant_kind?: string | null;
          postal_code?: string | null;
          public_phone?: string | null;
          quality_status?: string | null;
          seal?: boolean;
          source_record_id?: string | null;
          source_system?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partners_owner_profile_id_fkey";
            columns: ["owner_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          audience: Database["public"]["Enums"]["plan_audience"];
          benefits: Json;
          created_at: string;
          description: string | null;
          highlighted: boolean;
          id: string;
          name: string;
          price_cents: number | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          audience: Database["public"]["Enums"]["plan_audience"];
          benefits?: Json;
          created_at?: string;
          description?: string | null;
          highlighted?: boolean;
          id?: string;
          name: string;
          price_cents?: number | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          audience?: Database["public"]["Enums"]["plan_audience"];
          benefits?: Json;
          created_at?: string;
          description?: string | null;
          highlighted?: boolean;
          id?: string;
          name?: string;
          price_cents?: number | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          created_at: string;
          description: string | null;
          expired: boolean;
          expires_at: string | null;
          id: string;
          points: number;
          profile_id: string;
          source_id: string | null;
          source_type: Database["public"]["Enums"]["point_source_type"];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expired?: boolean;
          expires_at?: string | null;
          id?: string;
          points: number;
          profile_id: string;
          source_id?: string | null;
          source_type: Database["public"]["Enums"]["point_source_type"];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expired?: boolean;
          expires_at?: string | null;
          id?: string;
          points?: number;
          profile_id?: string;
          source_id?: string | null;
          source_type?: Database["public"]["Enums"]["point_source_type"];
        };
        Relationships: [
          {
            foreignKeyName: "point_transactions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      producer_application_documents: {
        Row: {
          application_id: string;
          created_at: string;
          document_type: string;
          file_path: string;
          id: string;
          label: string | null;
        };
        Insert: {
          application_id: string;
          created_at?: string;
          document_type: string;
          file_path: string;
          id?: string;
          label?: string | null;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          document_type?: string;
          file_path?: string;
          id?: string;
          label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "producer_application_documents_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "producer_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      producer_applications: {
        Row: {
          applicant_type: Database["public"]["Enums"]["applicant_type"];
          bank_account: string | null;
          bank_account_type: string | null;
          bank_agency: string | null;
          bank_name: string | null;
          business_address: Json | null;
          business_size: string | null;
          capacity_kg_day: number | null;
          cnpj: string;
          contato_email: string | null;
          created_at: string;
          founded_year: number | null;
          id: string;
          material_origin: string;
          operation_description: string;
          partner_terms_accepted_at: string | null;
          pix_key: string | null;
          profile_id: string;
          razao_social: string;
          responsavel_nome: string;
          responsavel_telefone: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          service_area: string | null;
          state_registration: string | null;
          status: Database["public"]["Enums"]["producer_application_status"];
          submitted_at: string;
          sustainability_description: string;
          updated_at: string;
          waste_type: Database["public"]["Enums"]["cooperative_type"] | null;
          website_url: string | null;
        };
        Insert: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"];
          bank_account?: string | null;
          bank_account_type?: string | null;
          bank_agency?: string | null;
          bank_name?: string | null;
          business_address?: Json | null;
          business_size?: string | null;
          capacity_kg_day?: number | null;
          cnpj: string;
          contato_email?: string | null;
          created_at?: string;
          founded_year?: number | null;
          id?: string;
          material_origin: string;
          operation_description: string;
          partner_terms_accepted_at?: string | null;
          pix_key?: string | null;
          profile_id: string;
          razao_social: string;
          responsavel_nome: string;
          responsavel_telefone?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_area?: string | null;
          state_registration?: string | null;
          status?: Database["public"]["Enums"]["producer_application_status"];
          submitted_at?: string;
          sustainability_description: string;
          updated_at?: string;
          waste_type?: Database["public"]["Enums"]["cooperative_type"] | null;
          website_url?: string | null;
        };
        Update: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"];
          bank_account?: string | null;
          bank_account_type?: string | null;
          bank_agency?: string | null;
          bank_name?: string | null;
          business_address?: Json | null;
          business_size?: string | null;
          capacity_kg_day?: number | null;
          cnpj?: string;
          contato_email?: string | null;
          created_at?: string;
          founded_year?: number | null;
          id?: string;
          material_origin?: string;
          operation_description?: string;
          partner_terms_accepted_at?: string | null;
          pix_key?: string | null;
          profile_id?: string;
          razao_social?: string;
          responsavel_nome?: string;
          responsavel_telefone?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_area?: string | null;
          state_registration?: string | null;
          status?: Database["public"]["Enums"]["producer_application_status"];
          submitted_at?: string;
          sustainability_description?: string;
          updated_at?: string;
          waste_type?: Database["public"]["Enums"]["cooperative_type"] | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "producer_applications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "producer_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          approved: boolean;
          category: string | null;
          created_at: string;
          description: string | null;
          height_cm: number | null;
          id: string;
          image_url: string | null;
          last_viewed_at: string | null;
          length_cm: number | null;
          material_origin: string[];
          name: string;
          partner_id: string;
          points_value: number;
          price_cents: number;
          production_technique: string | null;
          status: Database["public"]["Enums"]["product_status"];
          stock: number;
          sustainability_note: string | null;
          tags: string[];
          unit: string;
          updated_at: string;
          view_count: number;
          weight_grams: number | null;
          width_cm: number | null;
        };
        Insert: {
          approved?: boolean;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          last_viewed_at?: string | null;
          length_cm?: number | null;
          material_origin?: string[];
          name: string;
          partner_id: string;
          points_value?: number;
          price_cents: number;
          production_technique?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          stock?: number;
          sustainability_note?: string | null;
          tags?: string[];
          unit?: string;
          updated_at?: string;
          view_count?: number;
          weight_grams?: number | null;
          width_cm?: number | null;
        };
        Update: {
          approved?: boolean;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          last_viewed_at?: string | null;
          length_cm?: number | null;
          material_origin?: string[];
          name?: string;
          partner_id?: string;
          points_value?: number;
          price_cents?: number;
          production_technique?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          stock?: number;
          sustainability_note?: string | null;
          tags?: string[];
          unit?: string;
          updated_at?: string;
          view_count?: number;
          weight_grams?: number | null;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          access_override: boolean;
          agent_bio: string | null;
          agent_certificate_code: string | null;
          agent_certificate_issued_at: string | null;
          agent_certificate_url: string | null;
          agent_city: string | null;
          agent_code: string | null;
          agent_course: string | null;
          agent_course_score: number;
          agent_course_version: string;
          agent_interests: string[];
          agent_is_available: boolean;
          agent_neighborhood: string | null;
          agent_photo_url: string | null;
          agent_practical_mission: string | null;
          agent_practical_mission_feedback: string | null;
          agent_practical_mission_reviewed_at: string | null;
          agent_practical_mission_reviewed_by: string | null;
          agent_practical_mission_status: string;
          agent_privacy_accepted_at: string | null;
          agent_rules_accepted_at: string | null;
          agent_rules_version: string | null;
          agent_slug: string | null;
          agent_status: string | null;
          agent_total_xp: number;
          agent_terms_accepted_at: string | null;
          approval_status: Database["public"]["Enums"]["profile_approval_status"];
          approved_at: string | null;
          asaas_customer_id: string | null;
          birth_date: string | null;
          cashback_cents: number;
          created_at: string;
          document: string | null;
          email: string;
          id: string;
          last_collection_at: string | null;
          lifetime_points: number;
          marketing_opt_in: boolean;
          name: string;
          origin_zip: string | null;
          phone: string | null;
          points_balance: number;
          postal_code: string | null;
          referral_code: string | null;
          referred_by: string | null;
          role: Database["public"]["Enums"]["user_role"];
          store_description: string | null;
          store_image_url: string | null;
          store_name: string | null;
          streak_weeks: number;
          updated_at: string;
        };
        Insert: {
          access_override?: boolean;
          agent_bio?: string | null;
          agent_certificate_code?: string | null;
          agent_certificate_issued_at?: string | null;
          agent_certificate_url?: string | null;
          agent_city?: string | null;
          agent_code?: string | null;
          agent_course?: string | null;
          agent_course_score?: number;
          agent_course_version?: string;
          agent_interests?: string[];
          agent_is_available?: boolean;
          agent_neighborhood?: string | null;
          agent_photo_url?: string | null;
          agent_practical_mission?: string | null;
          agent_practical_mission_feedback?: string | null;
          agent_practical_mission_reviewed_at?: string | null;
          agent_practical_mission_reviewed_by?: string | null;
          agent_practical_mission_status?: string;
          agent_privacy_accepted_at?: string | null;
          agent_rules_accepted_at?: string | null;
          agent_rules_version?: string | null;
          agent_slug?: string | null;
          agent_status?: string | null;
          agent_total_xp?: number;
          agent_terms_accepted_at?: string | null;
          approval_status?: Database["public"]["Enums"]["profile_approval_status"];
          approved_at?: string | null;
          asaas_customer_id?: string | null;
          birth_date?: string | null;
          cashback_cents?: number;
          created_at?: string;
          document?: string | null;
          email: string;
          id: string;
          last_collection_at?: string | null;
          lifetime_points?: number;
          marketing_opt_in?: boolean;
          name: string;
          origin_zip?: string | null;
          phone?: string | null;
          points_balance?: number;
          postal_code?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          store_description?: string | null;
          store_image_url?: string | null;
          store_name?: string | null;
          streak_weeks?: number;
          updated_at?: string;
        };
        Update: {
          access_override?: boolean;
          agent_bio?: string | null;
          agent_certificate_code?: string | null;
          agent_certificate_issued_at?: string | null;
          agent_certificate_url?: string | null;
          agent_city?: string | null;
          agent_code?: string | null;
          agent_course?: string | null;
          agent_course_score?: number;
          agent_course_version?: string;
          agent_interests?: string[];
          agent_is_available?: boolean;
          agent_neighborhood?: string | null;
          agent_photo_url?: string | null;
          agent_practical_mission?: string | null;
          agent_practical_mission_feedback?: string | null;
          agent_practical_mission_reviewed_at?: string | null;
          agent_practical_mission_reviewed_by?: string | null;
          agent_practical_mission_status?: string;
          agent_privacy_accepted_at?: string | null;
          agent_rules_accepted_at?: string | null;
          agent_rules_version?: string | null;
          agent_slug?: string | null;
          agent_status?: string | null;
          agent_total_xp?: number;
          agent_terms_accepted_at?: string | null;
          approval_status?: Database["public"]["Enums"]["profile_approval_status"];
          approved_at?: string | null;
          asaas_customer_id?: string | null;
          birth_date?: string | null;
          cashback_cents?: number;
          created_at?: string;
          document?: string | null;
          email?: string;
          id?: string;
          last_collection_at?: string | null;
          lifetime_points?: number;
          marketing_opt_in?: boolean;
          name?: string;
          origin_zip?: string | null;
          phone?: string | null;
          points_balance?: number;
          postal_code?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          store_description?: string | null;
          store_image_url?: string | null;
          store_name?: string | null;
          streak_weeks?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          profile_id: string;
          user_agent: string | null;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          profile_id: string;
          user_agent?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          profile_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      redemptions: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          partner_item_id: string;
          points_spent: number;
          profile_id: string;
          status: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          partner_item_id: string;
          points_spent: number;
          profile_id: string;
          status?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          partner_item_id?: string;
          points_spent?: number;
          profile_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redemptions_partner_item_id_fkey";
            columns: ["partner_item_id"];
            isOneToOne: false;
            referencedRelation: "partner_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          id: string;
          plan_id: string;
          profile_id: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          plan_id: string;
          profile_id: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          plan_id?: string;
          profile_id?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_code: string;
          earned_at: string;
          profile_id: string;
        };
        Insert: {
          achievement_code: string;
          earned_at?: string;
          profile_id: string;
        };
        Update: {
          achievement_code?: string;
          earned_at?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey";
            columns: ["achievement_code"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "user_achievements_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_legal_documents: {
        Args: { p_privacy_version: string; p_terms_version: string };
        Returns: undefined;
      };
      admin_sales_daily: {
        Args: { p_days?: number };
        Returns: {
          day: string;
          gmv_cents: number;
          orders_count: number;
        }[];
      };
      admin_sales_summary: {
        Args: { p_days?: number };
        Returns: {
          avg_ticket_cents: number;
          gmv_cents: number;
          mrr_cents: number;
          orders_count: number;
          prev_gmv_cents: number;
          prev_orders_count: number;
        }[];
      };
      admin_top_products: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          gmv_cents: number;
          name: string;
          partner_name: string;
          product_id: string;
          units_sold: number;
        }[];
      };
      award_achievement: {
        Args: { p_code: string; p_profile: string };
        Returns: undefined;
      };
      create_order_from_cart: {
        Args: { p_delivery: Json; p_payment?: string; p_use_cashback?: boolean };
        Returns: string;
      };
      create_single_order: {
        Args: {
          p_delivery?: Json;
          p_payment?: string;
          p_product_id: string;
          p_quantity: number;
        };
        Returns: string;
      };
      current_level_index: { Args: never; Returns: number };
      expire_points: { Args: never; Returns: undefined };
      get_cooperative_impact: {
        Args: { p_cooperative_id: string };
        Returns: {
          confirmed_collections: number;
          first_collection_at: string;
          last_collection_at: string;
          mixed_kg: number;
          organic_kg: number;
          producers_served: number;
          solid_kg: number;
          total_kg: number;
          unweighed_collections: number;
        }[];
      };
      get_order_shipping_items: {
        Args: { p_order_id: string };
        Returns: {
          height_cm: number;
          length_cm: number;
          origin_zip: string;
          partner_id: string;
          quantity: number;
          unit_price_cents: number;
          weight_grams: number;
          width_cm: number;
        }[];
      };
      get_partner_sales_daily: {
        Args: { p_days?: number };
        Returns: {
          day: string;
          gmv_cents: number;
          orders_count: number;
          units_count: number;
        }[];
      };
      get_partner_sales_summary: {
        Args: { p_days?: number };
        Returns: {
          avg_ticket_cents: number;
          gmv_cents: number;
          orders_count: number;
          prev_gmv_cents: number;
          prev_orders_count: number;
          units_count: number;
        }[];
      };
      get_partner_shipments: {
        Args: never;
        Returns: {
          buyer_name: string;
          carrier: string;
          collected_at: string;
          created_at: string;
          delivered_at: string;
          delivery_address: Json;
          items: Json;
          order_id: string;
          shipment_id: string;
          shipped_at: string;
          status: Database["public"]["Enums"]["shipment_status"];
          tracking_code: string;
        }[];
      };
      get_partner_tier_metrics: {
        Args: never;
        Returns: {
          active_days: number;
          avg_rating: number;
          delivered_orders: number;
          gmv_cents: number;
          name: string;
          partner_id: string;
          store_name: string;
          verified_at: string;
          reviews_count: number;
        }[];
      };
      get_partner_tier_network_sample: {
        Args: never;
        Returns: {
          delivered_orders: number;
          verified_partners: number;
        }[];
      };
      get_partner_top_products: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          conversion_rate: number;
          gmv_cents: number;
          image_url: string;
          name: string;
          product_id: string;
          units_sold: number;
          view_count: number;
        }[];
      };
      get_producer_store: {
        Args: { p_id: string };
        Returns: {
          id: string;
          name: string;
          store_description: string;
          store_image_url: string;
          store_name: string;
        }[];
      };
      get_producer_stores: {
        Args: never;
        Returns: {
          id: string;
          name: string;
          store_description: string;
          store_image_url: string;
          store_name: string;
        }[];
      };
      get_profile_basic: {
        Args: { p_id: string };
        Returns: {
          id: string;
          name: string;
          phone: string;
        }[];
      };
      get_profiles_basic: {
        Args: { p_ids: string[] };
        Returns: {
          id: string;
          name: string;
          phone: string;
        }[];
      };
      increment_product_view: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      level_discount_cents: {
        Args: { p_lifetime_points: number; p_subtotal_cents: number };
        Returns: number;
      };
      level_discount_percent: { Args: { p_level: number }; Returns: number };
      level_has_early_access: { Args: { p_level: number }; Returns: boolean };
      level_has_free_shipping: { Args: { p_level: number }; Returns: boolean };
      level_index: { Args: { p_lifetime_points: number }; Returns: number };
      match_cooperative_for_request: {
        Args: { p_waste_type: Database["public"]["Enums"]["waste_type"] };
        Returns: string;
      };
      redeem_partner_item: { Args: { p_item_id: string }; Returns: string };
      reorder_product_images: {
        Args: { p_ordered_ids: string[]; p_product_id: string };
        Returns: undefined;
      };
      set_marketing_consent: {
        Args: { p_granted: boolean };
        Returns: undefined;
      };
      settle_fully_discounted_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      simulate_order_payment: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      applicant_type: "produtor" | "cooperativa";
      collection_status: "requested" | "confirmed" | "canceled";
      cooperative_status: "active" | "inactive";
      cooperative_type: "solid" | "organic" | "both";
      order_status: "pending" | "approved" | "canceled";
      partner_category:
        "restaurante" | "hotel" | "produtor_local" | "shopping" | "servico" | "outro";
      payment_method: "pix" | "credit_card" | "boleto";
      payment_status: "pending" | "awaiting_payment" | "paid" | "failed" | "refunded";
      plan_audience: "consumidor" | "produtor" | "cooperativa";
      point_source_type:
        "collection" | "purchase" | "referral" | "challenge" | "manual" | "redemption";
      producer_application_status: "pending" | "docs_pending" | "approved" | "rejected";
      product_status: "active" | "inactive";
      profile_approval_status: "pending" | "approved" | "rejected";
      shipment_status: "preparing" | "collected" | "shipped" | "delivered" | "canceled";
      subscription_status: "pending" | "active" | "canceled";
      user_role: "consumidor" | "produtor" | "cooperativa" | "admin" | "agent_circular";
      waste_type: "organic" | "solid" | "both";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      applicant_type: ["produtor", "cooperativa"],
      collection_status: ["requested", "confirmed", "canceled"],
      cooperative_status: ["active", "inactive"],
      cooperative_type: ["solid", "organic", "both"],
      order_status: ["pending", "approved", "canceled"],
      partner_category: ["restaurante", "hotel", "produtor_local", "shopping", "servico", "outro"],
      payment_method: ["pix", "credit_card", "boleto"],
      payment_status: ["pending", "awaiting_payment", "paid", "failed", "refunded"],
      plan_audience: ["consumidor", "produtor", "cooperativa"],
      point_source_type: [
        "collection",
        "purchase",
        "referral",
        "challenge",
        "manual",
        "redemption",
      ],
      producer_application_status: ["pending", "docs_pending", "approved", "rejected"],
      product_status: ["active", "inactive"],
      profile_approval_status: ["pending", "approved", "rejected"],
      shipment_status: ["preparing", "collected", "shipped", "delivered", "canceled"],
      subscription_status: ["pending", "active", "canceled"],
      user_role: ["consumidor", "produtor", "cooperativa", "admin", "agent_circular"],
      waste_type: ["organic", "solid", "both"],
    },
  },
} as const;
