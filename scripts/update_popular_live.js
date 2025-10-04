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
// Using specific channel names and stricter geographic terms
const SEARCH_QUERIES = {
  "Global": [
    "CNN live",                // US major networks only
    "Fox News Channel live", 
    "MSNBC live",
    "CBS News live"
  ],
  "EU": [
    "BBC News UK live",        // UK-specific terms
    "Sky News UK live", 
    "ITV News Britain live",
    "Channel 4 News UK live"
  ],
  "AU": [
    "ABC News Australia live", // Australia-specific
    "Channel 7 News Australia", 
    "Channel 9 News Australia",
    "Sky News Australia live"
  ],
  "JP": [
    "NHK ニュース live",        // Japanese language terms
    "日本テレビ ニュース live", 
    "TBS ニュース live",
    "フジテレビ ニュース live"
  ],
  "TW": [
    "中視新聞台 live",          // Traditional Chinese terms
    "TVBS新聞台 live", 
    "民視新聞台 live",
    "東森新聞台 live"
  ],
  "KR": [
    "KBS 뉴스 live",           // Korean language terms
    "MBC 뉴스 live", 
    "SBS 뉴스 live",
    "YTN 뉴스 live"
  ],
  "CN": [
    "CGTN 中文 live",          // Chinese terms for HK/China
    "鳳凰衛視 live", 
    "TVB 新聞 live",
    "Now 新聞台 live"
  ]
};

// Known major channel names to prioritize - helps filter out incorrect regions
const PRIORITY_CHANNELS = {
  "Global": [
    "CNN", "Fox News", "MSNBC", "CBS News", "NBC News", "ABC News", 
    "PBS NewsHour", "C-SPAN", "Bloomberg Television"
  ],
  "EU": [
    "BBC News", "Sky News", "ITV News", "Channel 4 News", "euronews", 
    "France 24 English", "DW News", "RT UK"
  ],
  "AU": [
    "ABC News (Australia)", "7NEWS Australia", "9 News Australia", 
    "Sky News Australia", "SBS News", "10 News First"
  ],
  "JP": [
    "NHK World-Japan", "TBS NEWS", "Fuji News Network", "TV Asahi", 
    "Nippon TV", "テレビ朝日", "日本テレビ", "TBS"
  ],
  "TW": [
    "TVBS NEWS", "中視", "民視", "東森新聞", "華視", "公視", 
    "三立新聞", "年代新聞"
  ],
  "KR": [
    "KBS News", "MBC News", "SBS", "YTN", "채널A", "JTBC", 
    "TV조선", "MBN"
  ],
  "CN": [
    "CGTN", "鳳凰衛視", "TVB", "Now TV", "香港電台", "有線新聞", 
    "無綫新聞", "亞洲電視"
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
    "EU": [
      "arabic", "العربية", "الجزيرة", "hindi", "हिंदी", "भारत", 
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