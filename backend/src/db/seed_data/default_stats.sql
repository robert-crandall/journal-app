-- Default stat groups
INSERT INTO stat_groups (id, name, description, is_default) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Physical', 'Physical attributes like strength, agility, and endurance', true),
  ('22222222-2222-2222-2222-222222222222', 'Mental', 'Mental attributes like intelligence, wisdom, and charisma', true),
  ('33333333-3333-3333-3333-333333333333', 'Social', 'Social attributes like leadership, persuasion, and empathy', true),
  ('44444444-4444-4444-4444-444444444444', 'Personal', 'Personal attributes like discipline, focus, and creativity', true),
  ('55555555-5555-5555-5555-555555555555', 'Skills', 'Specialized skills like cooking, programming, or woodworking', true);

-- Template stats for Physical group
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Strength', 'Physical power and ability to lift heavy objects', 'Warrior, Barbarian, Ranger, Knight'),
  ('11111111-1111-1111-1111-111111111111', 'Endurance', 'Stamina and ability to maintain physical effort over time', 'Ranger, Knight, Rogue, Warrior'),
  ('11111111-1111-1111-1111-111111111111', 'Agility', 'Coordination, balance, and nimbleness', 'Rogue, Ranger, Monk, Bard');

-- Template stats for Mental group
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Intelligence', 'Ability to learn, reason, and solve complex problems', 'Wizard, Sorcerer, Artificer, Alchemist'),
  ('22222222-2222-2222-2222-222222222222', 'Wisdom', 'Perception, intuition, and good judgment', 'Druid, Cleric, Monk, Ranger'),
  ('22222222-2222-2222-2222-222222222222', 'Focus', 'Ability to concentrate on a task without distraction', 'Wizard, Monk, Ranger, Artificer');

-- Template stats for Social group
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Charisma', 'Personal magnetism and ability to influence others', 'Bard, Paladin, Sorcerer, Rogue'),
  ('33333333-3333-3333-3333-333333333333', 'Leadership', 'Ability to guide and inspire others', 'Paladin, Knight, Bard, Cleric'),
  ('33333333-3333-3333-3333-333333333333', 'Empathy', 'Understanding and sharing the feelings of others', 'Cleric, Druid, Bard, Healer');

-- Template stats for Personal group
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Discipline', 'Self-control and ability to stick to routines', 'Monk, Paladin, Knight, Wizard'),
  ('44444444-4444-4444-4444-444444444444', 'Creativity', 'Ability to think of original ideas and solutions', 'Bard, Artificer, Sorcerer, Alchemist'),
  ('44444444-4444-4444-4444-444444444444', 'Perseverance', 'Persistence in the face of difficulty', 'Warrior, Paladin, Knight, Ranger');

-- Template stats for Skills group
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Crafting', 'Creating useful items with your hands', 'Artificer, Alchemist, Rogue, Ranger'),
  ('55555555-5555-5555-5555-555555555555', 'Cooking', 'Preparing delicious and nutritious meals', 'Alchemist, Bard, Druid, Healer'),
  ('55555555-5555-5555-5555-555555555555', 'Survival', 'Finding food, water, and shelter in the wilderness', 'Ranger, Druid, Barbarian, Rogue');

-- Parenting stats
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Parenting', 'Nurturing and guiding your children', 'Knight, Cleric, Healer, Paladin'),
  ('33333333-3333-3333-3333-333333333333', 'Family Bond', 'Connection and quality time with family members', 'Bard, Cleric, Healer, Ranger');

-- Adventure stats
INSERT INTO stat_templates (group_id, name, description, suggested_for_classes) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Exploration', 'Venturing into new places and experiences', 'Ranger, Rogue, Bard, Explorer'),
  ('44444444-4444-4444-4444-444444444444', 'Adventure', 'Seeking exciting and novel experiences', 'Ranger, Barbarian, Bard, Explorer');
