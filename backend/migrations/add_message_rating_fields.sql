-- Migration: Add message rating fields
-- This adds support for thumbs up/down ratings on messages

-- Add rating columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS rating VARCHAR(10) CHECK (rating IN ('up', 'down')),
ADD COLUMN IF NOT EXISTS rating_comment TEXT,
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP;

-- Add index for efficient rating queries
CREATE INDEX IF NOT EXISTS idx_messages_rating ON messages(rating) WHERE rating IS NOT NULL;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_messages_rated_at ON messages(rated_at) WHERE rated_at IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('rating', 'rating_comment', 'rated_at');
