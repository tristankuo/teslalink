const fs = require("fs");
const fetch = require("node-fetch").default || require("node-fetch");

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable");
  process.exit(1);
}

const OUTPUT_FILE = 'public/popular_live.json';
const API_BASE = "https://www.googleapis.com/youtube/v3";

// Quota management - Critical protection against exceeding daily limits
const QUOTA_LIMIT = 9000; // Stay well below 10,000 daily limit  
let quotaUsed = 0;

// Track API calls for quota monitoring
function trackQuotaUsage(cost, operation) {
  quotaUsed += cost;
  console.log(`   📊 Quota: +${cost} units (${operation}) | Total: ${quotaUsed}/${QUOTA_LIMIT} (${((quotaUsed/QUOTA_LIMIT)*100).toFixed(1)}%)`);
  
  if (quotaUsed >= QUOTA_LIMIT) {
    console.warn(`⚠️  Quota limit reached (${quotaUsed}/${QUOTA_LIMIT}). Stopping to preserve remaining quota.`);
    return false;
  }
  return true;
}

// Load existing data as fallback when quota is exceeded or API fails
function loadExistingData() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log('📁 Loaded existing data as fallback');
      return existingData;
    }
  } catch (error) {
    console.warn('⚠️  Could not load existing data:', error.message);
  }
  return {
    lastUpdated: new Date().toISOString(),
    Global: [], US: [], EU: [], AU: [], JP: [], TW: [], KR: [], CN: []
  };
}

// --- Consolidated Channel Data ---
const CONSOLIDATED_MEDIA_CHANNELS = [
    { name: "Reuters", id: "UChqUTb7kYRX8-EiaN3XFrSQ", region: "Global", category: "News" },
    { name: "BBC News", id: "UC16niRr50-MSBwiO3YDb3Eg", region: "Global", category: "News" },
    { name: "Al Jazeera English", id: "UCNye-wBq0MfVKGtkv0x3VCw", region: "Global", category: "News" },
    { name: "Associated Press (AP)", id: "UCSTXqC-99B7D-qA70oK3yFA", region: "Global", category: "News" },
    { name: "AFP News Agency", id: "UC8x9YCGjzdXQDfJpgB544ag", region: "Global", category: "News" },
    { name: "CNA (Channel NewsAsia)", id: "UC83jt4dlz1Gjl58fzQrrKZg", region: "Global", category: "News" },
    { name: "WION (World is One News)", id: "UC_j0-t_G7qY1u2S8qL3gPGA", region: "Global", category: "News" },
    { name: "FIFA (Football)", id: "UCP_x-t0kYtLqD6iG7K-jS9w", region: "Global", category: "Sports" },
    { name: "Discovery Channel", id: "UCbA0G2V04xXg1g7eO_mX90g", region: "Global", category: "General TV" },
    { name: "ABC News", id: "UCBi2MRPN3SSYA6hP3yCq0vw", region: "US", category: "News" },
    { name: "CBS News", id: "UC85dFzW_G4sKz320oO_X57w", region: "US", category: "News" },
    { name: "NBC News", id: "UCeY0bbntWzzU8K0Qf3szGnw", region: "US", category: "News" },
    { name: "Wall Street Journal", id: "UCLihBPbQJ1-vY0f-bL3g_Fw", region: "US", category: "News" },
    { name: "New York Times", id: "UCqaw0leR97y_4goDqD_D-LA", region: "US", category: "News" },
    { name: "CBC News (Canada)", id: "UCF-y2yHCSKq57BvY2wO1BTA", region: "US", category: "News" },
    { name: "CTV News (Canada)", id: "UCiYvL_n_eM-8sWdI6Xszc9g", region: "US", category: "News" },
    { name: "ESPN", id: "UC-b-tA_z_fE0v4y6l6F0LdQ", region: "US", category: "Sports" },
    { name: "The Weather Channel", id: "UC0_QdK5vVz8923V_VbQ065g", region: "US", category: "Weather" },
    { name: "Euronews", id: "UCSrZ3UV4jOidv8ppoVuvW9Q", region: "EU", category: "News" },
    { name: "TRT World", id: "UC7M-8yGFD3_d48N3jO-R7Lw", region: "EU", category: "News" },
    { name: "Sky News (UK)", id: "UC-pSIn_k8-bXG_5f1_f326g", region: "EU", category: "News" },
    { name: "The Guardian (UK)", id: "UCRIZtPl-f9mWm_bF6QftI_g", region: "EU", category: "News" },
    { name: "France 24 English", id: "UCQfwfsi5VrQ8yKZ-UWmAEFg", region: "EU", category: "News" },
    { name: "DW News (Germany)", id: "UC_zSfnY_d9b-Fk2s3qH2_RA", region: "EU", category: "News" },
    { name: "El País (Spain)", id: "UCgXNn6aR1-pE8sS-2eN436A", region: "EU", category: "News" },
    { name: "The Olympic Channel", id: "UC0yQ2Pq3FGQWz6oU5DGZqbw", region: "EU", category: "Sports" },
    { name: "Eurosport", id: "UCc61pMvXWq9j1U-6g72L-oA", region: "EU", category: "Sports" },
    { name: "ABC News (Australia)", id: "UC_L5X7c3cQhWwN3sW2yV_6w", region: "AU", category: "News" },
    { name: "Sky News Australia", id: "UCO0akufu9MOzyz3nvGIXAAw", region: "AU", category: "News" },
    { name: "9 News Australia", id: "UCIYLOcEUX6TbBo7HQVF2PKA", region: "AU", category: "News" },
    { name: "7NEWS Australia", id: "UCeC2D_4_p-tA12tJ31vM0uw", region: "AU", category: "News" },
    { name: "Fox Sports Australia", id: "UC-lFk21_O_WjTz7H6zR85Jg", region: "AU", category: "Sports" },
    { name: "SBS Australia", id: "UC9cK95c_i8U8R9H7x16sQ9Q", region: "AU", category: "General TV" },
    { name: "CCTV English (China)", id: "UCGj0Qn3Xw-yB6mK2H11-53Q", region: "CN", category: "News" },
    { name: "CGTN (China)", id: "UCmdxK-LhIqgTqg-qC-gEw7Q", region: "CN", category: "News" },
    { name: "SCMP (Hong Kong)", id: "UCi9G_iX6iC32fCILiS58-iA", region: "CN", category: "News" },
    { name: "RTHK (Hong Kong)", id: "UCmJ-2y2Qe0eH3gN2gGf3e1w", region: "CN", category: "News" },
    { name: "Phoenix TV (Hong Kong)", id: "UCW-j65BwB2f9E4q7b7s00bA", region: "CN", category: "News" },
    { name: "i-Cable News (Hong Kong)", id: "UCQk5Ld8s4e1_P8T8L3z8d3w", region: "CN", category: "News" },
    { name: "CCTV Documentary (China)", id: "UC3-S2_Q18g5eF-Kk7jT4V7g", region: "CN", category: "General TV" },
    { name: "CCTV Chinese Theatre (China)", id: "UC2w-t-vRzW1f6_1z0Yv6J_Q", region: "CN", category: "General TV" },
    { name: "NHK News", id: "UC_m7pC2pP-5x-Jz3R_G2N8w", region: "JP", category: "News" },
    { name: "Fuji News Network (FNN)", id: "UCO_M5c0Q-P9-r_oVDfR1k_Q", region: "JP", category: "News" },
    { name: "TV Asahi (ANNnewsCH)", id: "UCGCZAYq5XbVw5VfA0_AHK2w", region: "JP", category: "News" },
    { name: "TBS NEWS DIG", id: "UC6AG81pAkf6Lbi_1VC5NmPA", region: "JP", category: "News" },
    { name: "NHK World-Japan (Intl TV)", id: "UCcD8k8V1B6-d6Q2380dM7ng", region: "JP", category: "General TV" },
    { name: "J SPORTS", id: "UC1oUj9M-47P-w25W2YQ8vJA", region: "JP", category: "Sports" },
    { name: "KBS News", id: "UCcQ_B-rXj6iYhXkE-7L715A", region: "KR", category: "News" },
    { name: "YTN", id: "UCh-2K5-xI-3c1A48Q2y-bJA", region: "KR", category: "News" },
    { name: "Yonhap News", id: "UCw7K2T6m5t9B-tI_P1Vp7KQ", region: "KR", category: "News" },
    { name: "SBS News", id: "UCkinYTS9IHqOEwR1Sze2JTw", region: "KR", category: "News" },
    { name: "MBN News", id: "UCG9aFJTZ-lMCHAiO1KJsirg", region: "KR", category: "News" },
    { name: "KBS World (General TV)", id: "UCkMhoB-X3W9cI-b71Ea-s7w", region: "KR", category: "General TV" },
    { name: "SBS Sports", id: "UCY7Y2eG-nFfR1eW2k922g3w", region: "KR", category: "Sports" },
    { name: "FTV News (民視新聞網)", id: "UC_V1e0z0wB7T8tB05N5cR_Q", region: "TW", category: "News" },
    { name: "TVBS NEWS", id: "UC5nwNW4KdC0SzrhF9BXEYOQ", region: "TW", category: "News" },
    { name: "EBC News (東森新聞)", id: "UCR3asjvr_WAaxwJYEDV_Bfw", region: "TW", category: "News" },
    { name: "CTS News (華視新聞)", id: "UC9dGWaE-NMYvEwM6sD2_Y3A", region: "TW", category: "News" },
    { name: "TTV News (台視新聞)", id: "UCu3pC5oHwY1k4_kGqY33rMQ", region: "TW", category: "News" },
    { name: "ELTA Sports", id: "UCzD9N2S0Q4_6JmR5V1W9B3A", region: "TW", category: "Sports" },
    { name: "Sanlih E-Television (SET)", id: "UCVh-X_W6n64G6t-1k1q-w2A", region: "TW", category: "General TV" },
];

const MEDIA_CHANNELS_BY_REGION = CONSOLIDATED_MEDIA_CHANNELS.reduce((acc, channel) => {
    if (!acc[channel.region]) {
        acc[channel.region] = [];
    }
    acc[channel.region].push(channel);
    return acc;
}, {});

const CHANNEL_IDS = Object.keys(MEDIA_CHANNELS_BY_REGION).reduce((acc, region) => {
    acc[region] = MEDIA_CHANNELS_BY_REGION[region].map(c => c.id);
    return acc;
}, {});

const PRIORITY_CHANNELS = Object.keys(MEDIA_CHANNELS_BY_REGION).reduce((acc, region) => {
    acc[region] = MEDIA_CHANNELS_BY_REGION[region].map(c => c.name);
    return acc;
}, {});

const REGION_CONFIG = {
  "Global": ["GB", "US", "AU", "CA"], 
  "US": ["US", "CA"],
  "EU": ["GB", "FR", "DE"],
  "AU": ["AU", "NZ"],
  "JP": ["JP"],
  "TW": ["TW"],
  "KR": ["KR"],
  "CN": ["HK"]
};

const SEARCH_QUERIES = {
  "Global": ["news live", "breaking news live", "live stream football"],
  "US": ["US news live", "breaking news US", "weather news live"],
  "EU": ["europe news live", "breaking news europe", "sports live"],
  "AU": ["australian news live", "breaking news australia"],
  "JP": ["ニュース ライブ", "速報", "スポーツ ライブ"],
  "TW": ["新聞直播", "即時新聞", "體育直播"],
  "KR": ["뉴스 라이브", "속보", "스포츠 라이브"],
  "CN": ["香港新聞 live", "中國新聞 live", "時事直播"]
};

async function fetchLiveStreamsByChannelId(channelId) {
  if (!trackQuotaUsage(100, `Channel Search: ${channelId}`)) {
    return [];
  }
  
  const searchUrl = `${API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    channelId: channelId,
    eventType: 'live',
    type: 'video',
    maxResults: '1',
    key: API_KEY
  });

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    
    return data.items.map(item => ({
      channel: item.snippet.channelTitle || "Unknown Channel",
      title: item.snippet.title || "Live Stream",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      videoId: item.id.videoId,
      type: detectContentType(item.snippet.title, item.snippet.channelTitle),
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error.message);
    return [];
  }
}

async function fetchLiveStreams(regionCode, query) {
  // Check quota before making API call
  if (!trackQuotaUsage(100, `Search: ${query} (${regionCode})`)) {
    console.warn(`⚠️  Skipping search for "${query}" due to quota limit`);
    return [];
  }

  const searchUrl = `${API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    eventType: 'live',
    regionCode: regionCode,
    maxResults: '12',
    order: 'viewCount',
    relevanceLanguage: getLanguageForRegion(regionCode),
    key: API_KEY
  });

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log(`No live streams found for region ${regionCode} with query "${query}"`);
      return [];
    }

    return data.items.map(item => ({
      channel: item.snippet.channelTitle || "Unknown Channel",
      title: item.snippet.title || "Live Stream",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      videoId: item.id.videoId,
      type: detectContentType(item.snippet.title, item.snippet.channelTitle),
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));

  } catch (error) {
    console.error(`Error fetching live streams for ${regionCode}:`, error.message);
    return [];
  }
}

function getLanguageForRegion(regionCode) {
  const languageMap = {
    'US': 'en',
    'GB': 'en', 
    'AU': 'en',
    'JP': 'ja',
    'TW': 'zh-TW',
    'KR': 'ko',
    'HK': 'zh-HK'
  };
  return languageMap[regionCode] || 'en';
}

// Add stream validation to filter out private/unavailable videos
async function validateStreams(streams) {
  if (streams.length === 0) return [];
  
  // Check quota before validation (costs 1 unit per call)
  if (!trackQuotaUsage(1, 'Video validation')) {
    console.warn(`⚠️  Skipping validation due to quota limit, returning original streams`);
    return streams;
  }
  
  const videoIds = streams.map(s => s.videoId).slice(0, 8); // Only validate top 8
  const videoDetailsUrl = `${API_BASE}/videos?` + new URLSearchParams({
    part: 'status,statistics',
    id: videoIds.join(','),
    key: API_KEY
  });

  try {
    const response = await fetch(videoDetailsUrl);
    if (!response.ok) {
      console.warn(`Video validation failed: ${response.status}`);
      return streams; // Return original if validation fails
    }

    const data = await response.json();
    const validVideoIds = new Set(
      data.items
        .filter(item => 
          item.status.privacyStatus === 'public' && 
          item.status.embeddable !== false &&
          parseInt(item.statistics.viewCount || 0) > 100 // Minimum view threshold
        )
        .map(item => item.id)
    );

    return streams.filter(stream => validVideoIds.has(stream.videoId));
  } catch (error) {
    console.warn(`Stream validation error: ${error.message}`);
    return streams; // Return original if validation fails
  }
}

function detectContentType(title, channel) {
  const lowerTitle = (title + " " + channel).toLowerCase();
  
  if (lowerTitle.includes('news') || lowerTitle.includes('breaking')) return 'news';
  if (lowerTitle.includes('sport') || lowerTitle.includes('espn')) return 'sports';
  if (lowerTitle.includes('business') || lowerTitle.includes('bloomberg')) return 'business';
  if (lowerTitle.includes('weather')) return 'weather';
  if (lowerTitle.includes('nasa') || lowerTitle.includes('space')) return 'space';
  if (lowerTitle.includes('music') || lowerTitle.includes('concert')) return 'music';
  
  return 'news'; // Default to news for live content
}

function removeDuplicates(streams) {
  const seen = new Set();
  return streams.filter(stream => {
    const key = stream.channel + "|" + stream.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function prioritizeStreams(streams, regionName) {
  const priorityChannels = PRIORITY_CHANNELS[regionName] || [];
  
  // Priority: known regional channels > news > business > sports > others
  const typePriority = { 'news': 4, 'business': 3, 'sports': 2, 'space': 1 };
  
  return streams.sort((a, b) => {
    // First priority: known regional channels
    const aIsRegional = priorityChannels.some(channel => 
      a.channel.toLowerCase().includes(channel.toLowerCase())
    );
    const bIsRegional = priorityChannels.some(channel => 
      b.channel.toLowerCase().includes(channel.toLowerCase())
    );
    
    if (aIsRegional && !bIsRegional) return -1;
    if (!aIsRegional && bIsRegional) return 1;
    
    // Second priority: content type
    const priorityA = typePriority[a.type] || 0;
    const priorityB = typePriority[b.type] || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    
    // Third priority: more recent content
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

// Filter out channels that are clearly from wrong regions
function filterByRegion(streams, regionName) {
  const unwantedPatterns = {
    "Global": [
      "arabic", "العربية", "الجزيرة", "العالم", "قناة", "الإخبارية",
      "hindi", "हिंदी", "भारत", "india tv", "aaj tak", "zee news",
      "urdu", "اردو", "پاکستان", "dunya news"
    ],
    "US": [
      "arabic", "العربية", "الجزيرة", "العالم", "قناة", "الإخبارية",
      "hindi", "हिंदी", "भारत", "india tv", "aaj tak", "zee news",
      "chinese", "中文", "taiwan", "台灣", "香港", "tvb news",
      "korean", "한국", "kbs", "mbc", "sbs", "ytn",
      "japanese", "日本", "nhk world", "テレビ朝日", "日本テレビ",
      "german", "deutsch", "dw news", "ard", "zdf",
      "french", "français", "france 24", "tf1", "france 2",
      "spanish", "español", "telemundo", "univision", "rt español",
      "african", "swahili", "hausa", "amharic", "ethiopian",
      "republic world", "times now", "cnbc awaaz"
    ],
    "EU": [
      "arabic", "العربية", "الجزيرة", "hindi", "हिंदی", "भारत", 
      "africa", "african", "swahili", "hausa", "amharic",
      "middle east", "الشرق الأوسط"
    ],
    "AU": [
      "hindi", "हिंदी", "arabic", "العربية", "german", "deutsch",
      "french", "français", "italian", "español"
    ],
    "JP": [
      "german", "deutsch", "french", "français", "english news",
      "australia", "british", "american", "中文", "한국"
    ],
    "TW": [
      "korean", "한국", "japanese", "日本", "english", "arabic", "العربية"
    ],
    "KR": [
      "chinese", "中文", "japanese", "日本", "english", "arabic", "العربية"
    ],
    "CN": [
      "korean", "한국", "japanese", "日本", "english news", "arabic", "العربية"
    ]
  };

  const patterns = unwantedPatterns[regionName] || [];
  
  return streams.filter(stream => {
    const text = (stream.channel + " " + stream.title).toLowerCase();
    return !patterns.some(pattern => text.includes(pattern.toLowerCase()));
  });
}

async function fetchRegionStreams(regionName) {
  console.log(`\n🔍 Fetching live streams for ${regionName}...`);
  
  const regionCodes = REGION_CONFIG[regionName];
  const queries = SEARCH_QUERIES[regionName];
  let allStreams = [];

  // 1. Try channel ID search first (local channels only)
  if (CHANNEL_IDS[regionName]) {
    console.log(`  📡 Searching ${CHANNEL_IDS[regionName].length} curated channels for ${regionName}`);
    for (const channelId of CHANNEL_IDS[regionName]) {
      const streams = await fetchLiveStreamsByChannelId(channelId);
      allStreams.push(...streams);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // 2. If not enough, fallback to keyword search
  if (allStreams.length < 4 && queries) {
    console.log(`  ⚠️ Not enough curated streams (${allStreams.length}), falling back to keyword search`);
    for (const regionCode of regionCodes) {
      for (const query of queries) {
        console.log(`  📡 Searching ${regionCode} for "${query}"`);
        
        const streams = await fetchLiveStreams(regionCode, query);
        allStreams.push(...streams);
        
        // Rate limiting - be nice to YouTube API
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
  }

  // Process results
  const uniqueStreams = removeDuplicates(allStreams);
  console.log(`  🔍 Removing geographic mismatches from ${uniqueStreams.length} streams...`);
  
  // Filter out streams from wrong regions
  const regionFiltered = filterByRegion(uniqueStreams, regionName);
  console.log(`  🌍 After regional filtering: ${regionFiltered.length} streams`);
  
  // Validate streams to remove private/unavailable content
  const validStreams = await validateStreams(regionFiltered);
  const prioritizedStreams = prioritizeStreams(validStreams, regionName);
  const finalStreams = prioritizedStreams.slice(0, 8); // Tesla optimized: max 8 channels

  console.log(`  ✅ Found ${allStreams.length} total, ${uniqueStreams.length} unique, ${regionFiltered.length} regional, ${validStreams.length} valid, selected top ${finalStreams.length}`);
  
  return finalStreams;
}

async function updatePopularLive() {
  console.log("🚀 Starting YouTube Live Streams update...");
  console.log(`📅 ${new Date().toISOString()}`);
  
  // Quota estimation
  const totalRegions = Object.keys(REGION_CONFIG).length;
  const avgQueries = 4;
  const estimatedSearchCalls = totalRegions * avgQueries;
  const estimatedValidationCalls = totalRegions; // 1 validation call per region
  const estimatedQuota = (estimatedSearchCalls * 100) + (estimatedValidationCalls * 1);
  
  console.log(`📊 Quota Estimation:`);
  console.log(`   Search calls: ${estimatedSearchCalls} × 100 units = ${estimatedSearchCalls * 100} units`);
  console.log(`   Validation calls: ${estimatedValidationCalls} × 1 unit = ${estimatedValidationCalls} units`);
  console.log(`   Total estimated: ${estimatedQuota} units (${((estimatedQuota/10000)*100).toFixed(1)}% of daily quota)`);
  console.log(`   Safety margin: ${10000 - estimatedQuota} units remaining\n`);
  
  // Load existing data as fallback
  const existingData = loadExistingData();
  
  const result = {
    lastUpdated: new Date().toISOString(),
    Global: [],
    EU: [],
    AU: [],
    JP: [],
    TW: [],
    KR: [],
    CN: [],
  };

  // Fetch streams for each region with quota protection
  for (const regionName of Object.keys(REGION_CONFIG)) {
    // Check if we should continue processing
    if (quotaUsed >= QUOTA_LIMIT) {
      console.warn(`⚠️  Quota limit reached. Using existing data for remaining regions.`);
      result[regionName] = existingData[regionName] || [];
      continue;
    }
    
    try {
      console.log(`\n🌍 Processing ${regionName}...`);
      const regionStreams = await fetchRegionStreams(regionName);
      
      if (regionStreams && regionStreams.length > 0) {
        result[regionName] = regionStreams;
        console.log(`   ✅ Updated ${regionName} with ${regionStreams.length} streams`);
      } else {
        // Use existing data if no new streams found
        result[regionName] = existingData[regionName] || [];
        console.log(`   📁 No new streams found, kept existing ${result[regionName].length} streams for ${regionName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${regionName}:`, error.message);
      // Fallback to existing data instead of empty array
      result[regionName] = existingData[regionName] || [];
      console.log(`   📁 Using existing data for ${regionName}: ${result[regionName].length} streams`);
    }
  }

  // Write results to JSON file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`\n✅ Successfully updated ${OUTPUT_FILE}`);
    
    // Log summary with quota usage
    console.log(`\n📊 Final Summary:`);
    console.log(`   Total quota used: ${quotaUsed}/10000 units (${((quotaUsed/10000)*100).toFixed(1)}%)`);
    console.log(`   Remaining quota: ${10000 - quotaUsed} units`);
    Object.entries(result).forEach(([region, streams]) => {
      if (region !== 'lastUpdated') {
        console.log(`   ${region}: ${Array.isArray(streams) ? streams.length : 0} live streams`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error writing to ${OUTPUT_FILE}:`, error.message);
    process.exit(1);
  }
}

// Run the updater
updatePopularLive().catch(error => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
