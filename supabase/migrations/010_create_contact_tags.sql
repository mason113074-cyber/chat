CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE NOT NULL,
  assigned_by VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON contact_tags FOR ALL USING (auth.uid() = user_id);

ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tag assignments" ON contact_tag_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tag_assignments.contact_id AND contacts.user_id = auth.uid())
);
