const fs = require("fs");
const fetch = require("node-fetch").default || require("node-fetch");

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable");
  process.exit(1);
}

// Region mapping for YouTube API
const REGION_CONFIG = {
  "Global": ["US", "CA"], // US + Canada
  "EU": ["GB", "FR", "DE"], // UK + France + Germany  
  "AU": ["AU"], // Australia
  "JP": ["JP"], // Japan
  "TW": ["TW"], // Taiwan
  "KR": ["KR"], // Korea
  "CN": ["HK"] // Hong Kong (YouTube blocked in mainland China)
};

const MAX_RESULTS_PER_REGION = 15; // Get more to filter for best quality
const OUTPUT_FILE = "public/popular_live.json";
const API_BASE = "https://www.googleapis.com/youtube/v3";

// Search queries optimized for trending/popular live TV and news content
const SEARCH_QUERIES = {
  "Global": [
    "trending live news", 
    "popular live tv", 
    "hot news live", 
    "live breaking news trending",
    "most watched news live"
  ],
  "EU": [
    "trending bbc live", 
    "popular sky news", 
    "hot european news", 
    "trending france 24",
    "popular euronews live"
  ],
  "AU": [
    "trending abc news australia", 
    "popular australian live tv", 
    "hot news australia", 
    "trending 7news live"
  ],
  "JP": [
    "trending japanese tv", 
    "popular nhk live", 
    "hot japanese news", 
    "人気 ライブ ニュース"
  ],
  "TW": [
    "熱門直播新聞", 
    "popular taiwan news", 
    "trending tvbs", 
    "熱門台灣電視"
  ],
  "KR": [
    "trending korean news", 
    "popular ytn live", 
    "hot korean tv", 
    "인기 라이브 뉴스"
  ],
  "CN": [
    "trending cgtn", 
    "popular hong kong news", 
    "hot chinese tv", 
    "熱門直播電視"
  ]
};

async function fetchLiveStreams(regionCode, query) {
  const searchUrl = `${API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    eventType: 'live',
    regionCode: regionCode,
    maxResults: '10',
    order: 'relevance',
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
      type: detectContentType(item.snippet.title, item.snippet.channelTitle),
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));

  } catch (error) {
    console.error(`Error fetching live streams for ${regionCode}:`, error.message);
    return [];
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

function prioritizeStreams(streams) {
  // Priority: news > business > sports > others
  const priority = { 'news': 4, 'business': 3, 'sports': 2, 'space': 1 };
  
  return streams.sort((a, b) => {
    const priorityA = priority[a.type] || 0;
    const priorityB = priority[b.type] || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    
    // If same priority, sort by published time (more recent first)
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

async function fetchRegionStreams(regionName) {
  console.log(`\n🔍 Fetching live streams for ${regionName}...`);
  
  const regionCodes = REGION_CONFIG[regionName];
  const queries = SEARCH_QUERIES[regionName];
  let allStreams = [];

  // Search across all region codes and queries
  for (const regionCode of regionCodes) {
    for (const query of queries) {
      console.log(`  📡 Searching ${regionCode} for "${query}"`);
      
      const streams = await fetchLiveStreams(regionCode, query);
      allStreams.push(...streams);
      
      // Rate limiting - be nice to YouTube API
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Process results
  const uniqueStreams = removeDuplicates(allStreams);
  const prioritizedStreams = prioritizeStreams(uniqueStreams);
  const finalStreams = prioritizedStreams.slice(0, 8); // Tesla optimized: max 8 channels

  console.log(`  ✅ Found ${allStreams.length} total, ${uniqueStreams.length} unique, selected top ${finalStreams.length}`);
  
  return finalStreams;
}

async function updatePopularLive() {
  console.log("🚀 Starting YouTube Live Streams update...");
  console.log(`📅 ${new Date().toISOString()}`);
  
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

  // Fetch streams for each region
  for (const regionName of Object.keys(REGION_CONFIG)) {
    try {
      result[regionName] = await fetchRegionStreams(regionName);
    } catch (error) {
      console.error(`❌ Error processing ${regionName}:`, error.message);
      result[regionName] = []; // Empty array as fallback
    }
  }

  // Write results to JSON file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`\n✅ Successfully updated ${OUTPUT_FILE}`);
    
    // Log summary
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