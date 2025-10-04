const fs = require("fs");
const fetch = require("node-fetch").default || require("node-fetch");

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable");
  process.exit(1);
}

// Region mapping for YouTube API - Optimized for quota efficiency
const REGION_CONFIG = {
  "Global": ["US"], // Focus on US as global representative
  "EU": ["GB"], // UK as EU representative  
  "AU": ["AU"], // Australia
  "JP": ["JP"], // Japan
  "TW": ["TW"], // Taiwan
  "KR": ["KR"], // Korea
  "CN": ["HK"] // Hong Kong (YouTube blocked in mainland China)
};

const MAX_RESULTS_PER_REGION = 12; // Reduced from 15 to save quota
const OUTPUT_FILE = "public/popular_live.json";
const API_BASE = "https://www.googleapis.com/youtube/v3";

// Optimized search queries targeting major local broadcasters and networks
const SEARCH_QUERIES = {
  "Global": [
    "CNN live news",           // Major US networks
    "Fox News live", 
    "ABC News live",
    "NBC News live"
  ],
  "EU": [
    "BBC News live",           // Major UK/EU networks
    "Sky News live", 
    "ITV News live",
    "Channel 4 News live"
  ],
  "AU": [
    "ABC News Australia live", // Major Australian networks
    "Seven News live", 
    "Nine News live",
    "Sky News Australia live"
  ],
  "JP": [
    "NHK World live",         // Major Japanese networks
    "TBS NEWS live", 
    "Fuji News live",
    "テレビ朝日 ニュース live"
  ],
  "TW": [
    "TVBS live",              // Major Taiwanese networks
    "中視新聞 live", 
    "民視新聞 live",
    "東森新聞 live"
  ],
  "KR": [
    "YTN live",               // Major Korean networks
    "KBS News live", 
    "MBC News live",
    "SBS News live"
  ],
  "CN": [
    "CGTN live",              // Major Chinese/HK networks
    "Now News live", 
    "TVB News live",
    "鳳凰衛視 live"
  ]
};

async function fetchLiveStreams(regionCode, query) {
  const searchUrl = `${API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    eventType: 'live',
    regionCode: regionCode,
    maxResults: '12',
    order: 'viewCount',        // Changed from 'relevance' to 'viewCount' for popularity
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
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  // Process results
  const uniqueStreams = removeDuplicates(allStreams);
  console.log(`  🔍 Validating ${uniqueStreams.length} streams...`);
  
  // Validate streams to remove private/unavailable content
  const validStreams = await validateStreams(uniqueStreams);
  const prioritizedStreams = prioritizeStreams(validStreams);
  const finalStreams = prioritizedStreams.slice(0, 8); // Tesla optimized: max 8 channels

  console.log(`  ✅ Found ${allStreams.length} total, ${uniqueStreams.length} unique, ${validStreams.length} valid, selected top ${finalStreams.length}`);
  
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