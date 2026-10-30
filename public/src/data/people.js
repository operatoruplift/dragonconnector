// Builder roles and fictional sample profiles. The samples let people try teammate search and
// messaging before real accounts exist; the app labels every one of them as a sample, and nothing
// sent to them leaves the device.

export const ROLES = [
  { id: 'mobile', label: 'Mobile developer' },
  { id: 'solana', label: 'Solana developer' },
  { id: 'fullstack', label: 'Full-stack developer' },
  { id: 'ai', label: 'AI / ML engineer' },
  { id: 'design', label: 'Product designer' },
  { id: 'product', label: 'Product manager' },
  { id: 'business', label: 'Business & growth' },
  { id: 'data', label: 'Data scientist' },
];

export const LOOKING_FOR = [
  { id: 'team', label: 'Looking for a team' },
  { id: 'members', label: 'Have a team, need members' },
  { id: 'cofounder', label: 'Looking for a co-founder' },
  { id: 'solo', label: 'Building solo for now' },
];

export const LANGUAGES = ['Vietnamese', 'English', 'Korean', 'Japanese', 'Chinese', 'French'];

export const SKILL_SUGGESTIONS = [
  'Rust', 'Anchor', 'TypeScript', 'React', 'React Native', 'Kotlin', 'Android', 'Swift', 'Python', 'LLMs',
  'Prompt design', 'Figma', 'UX research', 'Node.js', 'Next.js', 'PostgreSQL', 'Solana web3.js',
  'Mobile Wallet Adapter', 'Smart-contract security', 'Pitching', 'Go-to-market', 'Community', 'Data analysis',
];

const sample = (id, name, role, skills, tracks, lookingFor, languages, formats, bio) => ({ id, name, role, skills, tracks, lookingFor, languages, formats, bio, sample: true });

export const SAMPLE_PROFILES = [
  sample('linh', 'Linh N.', 'mobile', ['Kotlin', 'Android', 'Jetpack Compose', 'Mobile Wallet Adapter'], ['mobile'], 'team', ['Vietnamese', 'English'], ['A', 'B'], 'Android developer who wants to ship a wallet-native app people actually open twice.'),
  sample('minh', 'Minh T.', 'solana', ['Rust', 'Anchor', 'TypeScript', 'Smart-contract security'], ['mobile', 'ai'], 'cofounder', ['Vietnamese', 'English'], ['A', 'B'], 'Writes Solana programs and reviews them for fun. Looking for a product-minded co-founder.'),
  sample('aiko', 'Aiko S.', 'design', ['Figma', 'UX research', 'Prototyping', 'Design systems'], ['mobile'], 'team', ['English', 'Japanese'], ['A'], 'Product designer focused on first-run experiences and onboarding flows.'),
  sample('bao', 'Bảo P.', 'ai', ['Python', 'LLMs', 'Retrieval', 'FastAPI'], ['ai'], 'team', ['Vietnamese', 'English'], ['A', 'B'], 'Builds retrieval and agent workflows; curious about verifiable AI on-chain.'),
  sample('ha', 'Hà V.', 'fullstack', ['Next.js', 'Node.js', 'PostgreSQL', 'TypeScript'], ['ai', 'university'], 'members', ['Vietnamese', 'English'], ['B'], 'Full-stack developer with a half-formed team that needs a designer and an AI engineer.'),
  sample('quan', 'Quân Đ.', 'fullstack', ['Java', 'React', 'Firebase'], ['university'], 'team', ['Vietnamese'], ['A'], 'Third-year student, first hackathon. Learns fast and loves shipping demos.'),
  sample('sofia', 'Sofia R.', 'product', ['Roadmapping', 'User interviews', 'Pitching'], ['mobile', 'ai'], 'cofounder', ['English', 'French'], ['A', 'B'], 'Former PM at a fintech start-up, exploring consumer crypto on mobile.'),
  sample('thao', 'Thảo L.', 'business', ['Go-to-market', 'Community', 'Partnerships', 'Pitching'], ['mobile'], 'cofounder', ['Vietnamese', 'English'], ['A'], 'Community builder who has run meetups in Da Nang. Wants to find a technical co-founder.'),
  sample('daniel', 'Daniel K.', 'data', ['Python', 'SQL', 'Data analysis', 'On-chain analytics'], ['ai'], 'team', ['English', 'Korean'], ['B'], 'Turns messy on-chain data into dashboards and models that answer real questions.'),
  sample('vy', 'Vy H.', 'mobile', ['React Native', 'Expo', 'TypeScript', 'Solana web3.js'], ['mobile', 'university'], 'members', ['Vietnamese', 'English'], ['A', 'B'], 'React Native developer with a team of two; looking for a Solana developer.'),
  sample('khoa', 'Khoa N.', 'solana', ['Rust', 'Anchor', 'Node.js'], ['mobile'], 'team', ['Vietnamese'], ['A', 'B'], 'Backend and program developer who enjoys making on-chain flows feel instant.'),
  sample('maianh', 'Mai Anh T.', 'design', ['Brand', 'Motion', 'Figma', 'Pitch decks'], ['university', 'ai'], 'team', ['Vietnamese', 'English'], ['A'], 'Designer who makes demos look finished in the last two hours.'),
];
