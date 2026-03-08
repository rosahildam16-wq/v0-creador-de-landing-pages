-- ============================================================
-- 043 - Academia Module Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_url TEXT,
    level TEXT DEFAULT 'basico' CHECK (level IN ('basico', 'intermedio', 'avanzado')),
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    is_featured BOOLEAN DEFAULT false,
    community_id TEXT REFERENCES communities(id) ON DELETE SET NULL,
    owner_email TEXT NOT NULL,
    access_type TEXT DEFAULT 'community' CHECK (access_type IN ('free', 'community', 'paid')),
    price DECIMAL(10,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSE MODULES TABLE
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSE LESSONS TABLE
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    video_url TEXT,
    duration_seconds INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    is_free_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LESSON COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_email TEXT NOT NULL,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_email, lesson_id)
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_community_id ON courses(community_id);
CREATE INDEX IF NOT EXISTS idx_courses_owner_email ON courses(owner_email);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_email ON lesson_completions(member_email);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- 6. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_courses_updated_at();

-- 7. RLS POLICIES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (our API uses service role)
CREATE POLICY "Service role full access courses" ON courses
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access course_modules" ON course_modules
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access course_lessons" ON course_lessons
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access lesson_completions" ON lesson_completions
    USING (true) WITH CHECK (true);

-- 8. STORAGE BUCKET for course thumbnails (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-assets',
    'course-assets',
    true,
    2097152,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read policy for course-assets bucket
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read course-assets' AND tablename = 'objects') THEN
    CREATE POLICY "Public read course-assets" ON storage.objects FOR SELECT USING (bucket_id = 'course-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role insert course-assets' AND tablename = 'objects') THEN
    CREATE POLICY "Service role insert course-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-assets');
  END IF;
END $$;

-- 9. VERIFY
SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'courses') AS courses_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'course_modules') AS modules_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'course_lessons') AS lessons_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'lesson_completions') AS completions_table;
