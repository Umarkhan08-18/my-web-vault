/**
 * A small, hand-written catalogue of well-known websites.
 *
 * The voice assistant needs somewhere to look when a name is not already in the
 * user's vault. There is no LLM behind this app, so instead of inventing an
 * answer the bot searches this list: every entry is a real site with a real
 * description, grouped by the vault's own categories.
 *
 * `tags` are the extra words people actually type ("logo maker", "seo",
 * "free stock photos") so a fuzzy question still lands somewhere sensible.
 */

export interface CatalogSite {
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  tags: string[];
  /** 0–12: how canonical the site is for its category. Curated, not computed. */
  weight: number;
}

type CatalogEntry = Omit<CatalogSite, 'weight'>;

function site(name: string, url: string, category: string, description: string, tags: string[]): CatalogEntry {
  return {
    name,
    url,
    // match how the rest of the app shows domains: no scheme, no www
    domain: url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''),
    category,
    description,
    tags,
  };
}

const RAW: CatalogEntry[] = [
  // ---------------------------------------------------------------- AI
  site('ChatGPT', 'https://chatgpt.com', 'AI', 'Conversational assistant from OpenAI for writing, coding, analysis and brainstorming.', ['chatbot', 'assistant', 'llm', 'writing', 'openai']),
  site('Claude', 'https://claude.ai', 'AI', 'Anthropic’s assistant, strong at long documents, careful reasoning and rewriting.', ['chatbot', 'assistant', 'llm', 'documents', 'anthropic']),
  site('Gemini', 'https://gemini.google.com', 'AI', 'Google’s multimodal assistant, wired into Search, Gmail and Docs.', ['chatbot', 'assistant', 'google', 'multimodal']),
  site('Perplexity', 'https://www.perplexity.ai', 'AI', 'Answer engine that searches the web and cites every source it uses.', ['search', 'research', 'answers', 'citations']),
  site('Midjourney', 'https://www.midjourney.com', 'AI', 'Image generation with a distinctive, painterly art direction.', ['image generation', 'art', 'illustration', 'design']),
  site('ElevenLabs', 'https://elevenlabs.io', 'AI', 'Text-to-speech and voice cloning with very natural prosody.', ['voice', 'tts', 'audio', 'narration']),
  site('Hugging Face', 'https://huggingface.co', 'AI', 'The hub for open models, datasets and demos — plus Spaces for hosting them.', ['models', 'datasets', 'open source', 'machine learning']),
  site('Runway', 'https://runwayml.com', 'AI', 'Generative video: text-to-video, motion brush and frame-by-frame editing.', ['video', 'generation', 'editing', 'creative']),
  site('Suno', 'https://suno.com', 'AI', 'Turns a text prompt into a finished song, vocals included.', ['music', 'audio', 'generation', 'songs']),

  // ------------------------------------------------------------ Design
  site('Figma', 'https://www.figma.com', 'Design', 'Collaborative interface design in the browser, with shared components and live multiplayer editing.', ['ui', 'ux', 'design', 'prototype', 'interface', 'mockup', 'wireframe']),
  site('Canva', 'https://www.canva.com', 'Design', 'Drag-and-drop graphics for social posts, decks and posters, with thousands of templates.', ['graphics', 'design', 'templates', 'social', 'poster', 'presentation']),
  site('Unsplash', 'https://unsplash.com', 'Design', 'Free high-resolution stock photography released under a permissive licence.', ['photos', 'stock', 'images', 'free']),
  site('Coolors', 'https://coolors.co', 'Design', 'Fast palette generator with contrast checking and export to CSS or Figma.', ['colours', 'palette', 'gradient', 'contrast']),
  site('Framer', 'https://www.framer.com', 'Design', 'Design and publish real websites visually, with production React output.', ['website builder', 'motion', 'portfolio', 'no-code']),
  site('Dribbble', 'https://dribbble.com', 'Design', 'Community showcase for interface and illustration work, plus hiring boards.', ['inspiration', 'portfolio', 'community', 'showcase']),
  site('Behance', 'https://www.behance.net', 'Design', 'Adobe’s portfolio network for graphic, product and motion work.', ['portfolio', 'inspiration', 'showcase', 'adobe']),
  site('Mobbin', 'https://mobbin.com', 'Design', 'Searchable library of real mobile and web app screenshots, filterable by pattern.', ['mobile', 'patterns', 'reference', 'inspiration']),
  site('Spline', 'https://spline.design', 'Design', '3D scenes in the browser that export straight to web components.', ['3d', 'interactive', 'webgl', 'motion', 'animation']),
  site('Fontshare', 'https://www.fontshare.com', 'Design', 'Free fonts from the Indian Type Foundry, licensed for commercial work.', ['fonts', 'typography', 'typeface']),

  // ------------------------------------------------------- Development
  site('GitHub', 'https://github.com', 'Development', 'Code hosting, reviews, issues and Actions — the default home of open source.', ['git', 'code', 'repository', 'open source', 'ci']),
  site('Stack Overflow', 'https://stackoverflow.com', 'Development', 'Vast archive of answered programming questions, still the best error-message lookup.', ['answers', 'questions', 'debugging', 'help']),
  site('MDN Web Docs', 'https://developer.mozilla.org', 'Development', 'The reference documentation for HTML, CSS and JavaScript.', ['docs', 'reference', 'html', 'css', 'javascript']),
  site('Vercel', 'https://vercel.com', 'Development', 'Hosting built for frontend frameworks, with previews on every push.', ['hosting', 'deploy', 'next.js', 'serverless']),
  site('CodePen', 'https://codepen.io', 'Development', 'Live HTML/CSS/JS playground for sharing small experiments and pens.', ['playground', 'snippets', 'prototype', 'frontend']),
  site('npm', 'https://www.npmjs.com', 'Development', 'The JavaScript package registry — find, publish and inspect dependencies.', ['packages', 'javascript', 'registry', 'dependencies']),
  site('DevDocs', 'https://devdocs.io', 'Development', 'Offline-capable, unified documentation search for hundreds of libraries.', ['docs', 'offline', 'reference', 'search']),
  site('Supabase', 'https://supabase.com', 'Development', 'Postgres with auth, storage and realtime APIs, open-source Firebase alternative.', ['database', 'postgres', 'backend', 'auth']),
  site('Railway', 'https://railway.app', 'Development', 'Deploy databases, backends and containers with almost no configuration.', ['hosting', 'deploy', 'database', 'backend']),
  site('Replit', 'https://replit.com', 'Development', 'Cloud IDE with instant run buttons and multiplayer editing.', ['ide', 'online editor', 'collaboration', 'prototype']),

  // ----------------------------------------------------------- Shopify
  site('Shopify', 'https://www.shopify.com', 'Shopify', 'Commerce platform for running a store: products, checkout, payments and shipping.', ['ecommerce', 'store', 'sell', 'dropshipping']),
  site('Printful', 'https://www.printful.com', 'Shopify', 'Print-on-demand fulfilment that plugs straight into a Shopify store.', ['print on demand', 'merch', 'fulfilment', 'dropshipping']),
  site('Printify', 'https://printify.com', 'Shopify', 'Print-on-demand marketplace with a wide catalogue and margin comparison.', ['print on demand', 'merch', 'supplier', 'dropshipping']),
  site('DSers', 'https://www.dsers.com', 'Shopify', 'Bulk order processing and supplier mapping for AliExpress dropshipping.', ['dropshipping', 'orders', 'automation', 'supplier']),
  site('AutoDS', 'https://www.autods.com', 'Shopify', 'Product research and automated price and stock monitoring for dropshippers.', ['dropshipping', 'research', 'automation', 'products']),
  site('Spocket', 'https://www.spocket.co', 'Shopify', 'US and EU suppliers with faster shipping than typical dropshipping sources.', ['supplier', 'dropshipping', 'shipping', 'products']),
  site('Judge.me', 'https://judge.me', 'Shopify', 'Product reviews with photo and video collection, free tier included.', ['reviews', 'social proof', 'ugc', 'testimonials']),
  site('Loox', 'https://loox.io', 'Shopify', 'Photo review app that turns customer photos into referral loops.', ['reviews', 'referral', 'social proof', 'photos']),
  site('PageFly', 'https://apps.shopify.com/pagefly', 'Shopify', 'Drag-and-drop page builder for landing pages inside Shopify.', ['page builder', 'landing page', 'landing', 'no-code']),

  // ------------------------------------------------------ Social Media
  site('X', 'https://x.com', 'Social Media', 'Real-time microblogging; still where tech and news break first.', ['twitter', 'news', 'microblog', 'feed']),
  site('Instagram', 'https://www.instagram.com', 'Social Media', 'Photo, Reel and Story network built around visual storytelling.', ['photos', 'reels', 'stories', 'visual']),
  site('LinkedIn', 'https://www.linkedin.com', 'Social Media', 'Professional network for hiring, B2B reach and long-form posts.', ['jobs', 'networking', 'hiring', 'b2b']),
  site('Reddit', 'https://www.reddit.com', 'Social Media', 'Thousands of topic communities with unusually honest discussion threads.', ['forum', 'community', 'discussion', 'ama']),
  site('YouTube', 'https://www.youtube.com', 'Social Media', 'Video hosting and discovery, from tutorials to long-form documentaries.', ['video', 'tutorials', 'channel', 'watch']),
  site('TikTok', 'https://www.tiktok.com', 'Social Media', 'Short-form video with the most aggressive discovery algorithm online.', ['shorts', 'video', 'reels', 'viral']),
  site('Pinterest', 'https://www.pinterest.com', 'Social Media', 'Visual discovery board — moodboards, recipes, interiors and shopping ideas.', ['moodboard', 'inspiration', 'ideas', 'boards']),
  site('Threads', 'https://www.threads.net', 'Social Media', 'Instagram’s text-first feed for short posts and conversation.', ['microblog', 'text', 'feed', 'meta']),
  site('Bluesky', 'https://bsky.app', 'Social Media', 'Open, decentralised microblogging built on the AT Protocol.', ['microblog', 'open source', 'decentralised', 'feed']),

  // --------------------------------------------------------- Marketing
  site('Mailchimp', 'https://mailchimp.com', 'Marketing', 'Email campaigns, automations and audience segmentation for growing lists.', ['email', 'newsletter', 'automation', 'crm']),
  site('Kit', 'https://kit.com', 'Marketing', 'Creator-focused email platform (formerly ConvertKit) with simple automations.', ['email', 'newsletter', 'creators', 'automation']),
  site('Beehiiv', 'https://www.beehiiv.com', 'Marketing', 'Newsletter platform with built-in growth, referrals and ad network.', ['newsletter', 'email', 'growth', 'monetisation']),
  site('Klaviyo', 'https://www.klaviyo.com', 'Marketing', 'Email and SMS marketing tied to store data, built for ecommerce.', ['email', 'sms', 'ecommerce', 'automation']),
  site('Ahrefs', 'https://ahrefs.com', 'Marketing', 'Backlink and keyword research with one of the largest crawl indexes.', ['seo', 'keywords', 'backlinks', 'research']),
  site('Semrush', 'https://www.semrush.com', 'Marketing', 'All-in-one SEO, PPC and content research suite with competitor gaps.', ['seo', 'ppc', 'ads', 'keywords']),
  site('Buffer', 'https://buffer.com', 'Marketing', 'Schedule and analyse social posts across every major network.', ['scheduling', 'social', 'analytics', 'calendar']),
  site('Later', 'https://later.com', 'Marketing', 'Visual social scheduler with a strong Instagram grid preview.', ['scheduling', 'instagram', 'social', 'calendar']),
  site('HubSpot', 'https://www.hubspot.com', 'Marketing', 'CRM plus marketing, sales and service hubs under one roof.', ['crm', 'sales', 'automation', 'inbound']),

  // ---------------------------------------------------------- Research
  site('Google Scholar', 'https://scholar.google.com', 'Research', 'Search across peer-reviewed papers, theses, patents and citation counts.', ['papers', 'academic', 'citations', 'science']),
  site('arXiv', 'https://arxiv.org', 'Research', 'Preprints in physics, maths, computer science and quantitative biology.', ['preprint', 'papers', 'science', 'cs']),
  site('Semantic Scholar', 'https://www.semanticscholar.org', 'Research', 'AI-indexed literature search with citation graphs and TLDR summaries.', ['papers', 'ai', 'citations', 'search']),
  site('PubMed', 'https://pubmed.ncbi.nlm.nih.gov', 'Research', 'The definitive index of biomedical and life-science literature.', ['medicine', 'biology', 'papers', 'health']),
  site('Wikipedia', 'https://www.wikipedia.org', 'Research', 'Free encyclopaedia; the fastest way to orient yourself on any topic.', ['encyclopaedia', 'reference', 'wiki', 'background']),
  site('Statista', 'https://www.statista.com', 'Research', 'Charts and market statistics with cited sources for decks and reports.', ['statistics', 'data', 'market', 'charts']),
  site('Zotero', 'https://www.zotero.org', 'Research', 'Reference manager that saves sources and formats citations automatically.', ['citations', 'bibliography', 'reference manager', 'notes']),
  site('ResearchGate', 'https://www.researchgate.net', 'Research', 'Academic network for papers, datasets and author Q&A.', ['academic', 'papers', 'network', 'authors']),

  // ------------------------------------------------------------- Tools
  site('Notion', 'https://www.notion.so', 'Tools', 'Docs, wikis and databases that flex into whatever structure you need.', ['notes', 'docs', 'wiki', 'database', 'productivity']),
  site('Obsidian', 'https://obsidian.md', 'Tools', 'Local-first markdown notes with backlinks and a huge plugin library.', ['notes', 'markdown', 'knowledge base', 'offline']),
  site('Slack', 'https://slack.com', 'Tools', 'Team chat organised into channels, with deep app and workflow hooks.', ['chat', 'team', 'communication', 'channels']),
  site('Linear', 'https://linear.app', 'Tools', 'Issue tracking built for speed — keyboard-first, with cycles and roadmaps.', ['issues', 'project management', 'bugs', 'planning']),
  site('Trello', 'https://trello.com', 'Tools', 'Kanban boards that are simple enough for personal planning.', ['kanban', 'boards', 'tasks', 'planning']),
  site('Airtable', 'https://www.airtable.com', 'Tools', 'Spreadsheet-shaped database with views, automations and an API.', ['database', 'spreadsheet', 'automation', 'api']),
  site('Zapier', 'https://zapier.com', 'Tools', 'Connect thousands of apps and automate the hand-offs between them.', ['automation', 'integrations', 'workflow', 'no-code']),
  site('Raycast', 'https://www.raycast.com', 'Tools', 'Keyboard launcher for macOS with clipboard history, snippets and extensions.', ['launcher', 'productivity', 'shortcuts', 'mac']),
  site('Google Drive', 'https://drive.google.com', 'Tools', 'Cloud storage with collaborative docs, sheets and slides.', ['storage', 'files', 'docs', 'collaboration']),
  site('Dropbox', 'https://www.dropbox.com', 'Tools', 'File sync and sharing that works the same on every platform.', ['storage', 'sync', 'files', 'backup']),

  // ------------------------------------------------------------- Other
  site('Product Hunt', 'https://www.producthunt.com', 'Other', 'Daily leaderboard of new products, tools and launches.', ['launch', 'products', 'discovery', 'startups']),
  site('Hacker News', 'https://news.ycombinator.com', 'Other', 'Tech and startup discussion with a famously signal-heavy front page.', ['news', 'tech', 'startups', 'forum']),
  site('Indie Hackers', 'https://www.indiehackers.com', 'Other', 'Founders sharing revenue numbers and build-in-public stories.', ['startups', 'bootstrapping', 'community', 'revenue']),
  site('Wayback Machine', 'https://archive.org/web/', 'Other', 'Browse archived snapshots of any page, back to the late 90s.', ['archive', 'history', 'snapshots', 'internet archive']),
  site('Speedtest', 'https://www.speedtest.net', 'Other', 'Measure download, upload and latency in a couple of clicks.', ['network', 'internet', 'latency', 'diagnostics']),
  site('Khan Academy', 'https://www.khanacademy.org', 'Other', 'Free structured lessons across maths, science and the humanities.', ['learning', 'courses', 'education', 'free']),
  site('Coursera', 'https://www.coursera.org', 'Other', 'University and company courses, many free to audit.', ['courses', 'learning', 'certificates', 'education']),
  site('Duolingo', 'https://www.duolingo.com', 'Other', 'Bite-sized language lessons with streaks that keep you honest.', ['language', 'learning', 'lessons', 'study']),
];

/**
 * Editorial prominence. The catalogue is curated by hand, so this is a honest
 * signal: when two sites answer the question equally well, the one most people
 * mean wins. (Figma before Spline for “design tools”, GitHub before Railway
 * for “where do I keep code”.)
 */
const PROMINENCE: Record<string, number> = {
  ChatGPT: 12,
  Claude: 8,
  Perplexity: 8,
  Figma: 12,
  Canva: 9,
  Unsplash: 5,
  GitHub: 12,
  'Stack Overflow': 9,
  'MDN Web Docs': 6,
  Vercel: 5,
  Replit: 3,
  'Google Scholar': 6,
  arXiv: 4,
  Wikipedia: 9,
  Notion: 10,
  Slack: 6,
  Zapier: 4,
  Airtable: 3,
  Shopify: 12,
  Printful: 4,
  Judge: 3,
  Ahrefs: 6,
  Semrush: 4,
  Mailchimp: 5,
  'Product Hunt': 5,
  'Hacker News': 7,
  'Wayback Machine': 4,
  YouTube: 6,
};

export const CATALOG: CatalogSite[] = RAW.map((entry) => ({
  ...entry,
  weight: PROMINENCE[entry.name] ?? 0,
}));
