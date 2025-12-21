-- Enable Row Level Security on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_countries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "countries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pipeline_stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;

-- Create policies that allow the postgres role (our backend connection) full access
-- Users table
CREATE POLICY "Allow backend full access to users" ON "users"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- User countries table
CREATE POLICY "Allow backend full access to user_countries" ON "user_countries"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Countries table
CREATE POLICY "Allow backend full access to countries" ON "countries"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Contacts table
CREATE POLICY "Allow backend full access to contacts" ON "contacts"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Pipeline stages table
CREATE POLICY "Allow backend full access to pipeline_stages" ON "pipeline_stages"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Deals table
CREATE POLICY "Allow backend full access to deals" ON "deals"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Activities table
CREATE POLICY "Allow backend full access to activities" ON "activities"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Notes table
CREATE POLICY "Allow backend full access to notes" ON "notes"
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);
