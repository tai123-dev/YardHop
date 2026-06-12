-- ============================================================
-- YardHop Database Schema
-- Last updated: Week 3
-- Changes: added password_hash to users, added user_id to sales,
--          added RLS policies for all three tables
-- ============================================================


-- ============================================================
-- USERS
-- Populated automatically via handle_new_user trigger when a
-- user signs up through Supabase Auth.
-- password_hash is filled by Tee's POST /auth/signup endpoint.
-- ============================================================
CREATE TABLE public.users (
    id            uuid        NOT NULL PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    email         text        NOT NULL,
    full_name     text,
    password_hash text
);

-- Trigger: auto-populate users when Supabase Auth creates a new account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SALES
-- Posted by sellers. user_id links to the users table.
-- ============================================================
CREATE TABLE public.sales (
    id          bigint      NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    title       text        NOT NULL,
    description text        NOT NULL,
    address     text        NOT NULL,
    city        text        NOT NULL,
    zip         text        NOT NULL,
    date        date        NOT NULL,
    start_time  time        NOT NULL,
    end_time    time        NOT NULL,
    categories  text,
    user_id     uuid        REFERENCES public.users(id) ON DELETE SET NULL
);


-- ============================================================
-- SAVED_SALES
-- Bookmarks — links a user to a sale they saved.
-- ============================================================
CREATE TABLE public.saved_sales (
    id         bigint      NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    sale_id    bigint      NOT NULL REFERENCES public.sales(id)   ON DELETE CASCADE,
    user_id    uuid                 REFERENCES public.users(id)   ON DELETE CASCADE
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_sales ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ── sales ────────────────────────────────────────────────────
CREATE POLICY "Anyone can view sales"
    ON public.sales FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create sales"
    ON public.sales FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Owners can delete their sales"
    ON public.sales FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── saved_sales ──────────────────────────────────────────────
CREATE POLICY "Users can view their own saved sales"
    ON public.saved_sales FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save sales"
    ON public.saved_sales FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved sales"
    ON public.saved_sales FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);