export { renderers } from '../../../renderers.mjs';

async function fetchGitHubContributions(username) {
  const url = `https://github.com/${username}.contribs`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mona-Mayhem-Bot/1.0"
    }
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User not found: ${username}`);
    }
    throw new Error(
      `GitHub returned ${response.status}: ${response.statusText}`
    );
  }
  const data = await response.json();
  const contributionData = parseContributionData(data, username);
  return contributionData;
}
function parseContributionData(data, username) {
  if (!data || typeof data !== "object" || !("weeks" in data) || !Array.isArray(data.weeks)) {
    throw new Error("Invalid contribution data format from GitHub");
  }
  const rawData = data;
  const weeks = rawData.weeks.map(
    (week) => {
      const firstDay = String(week.first_day || "");
      const contributionDays = week.contribution_days || [];
      const days = contributionDays.map(
        (day, dayIndex) => {
          const date = new Date(firstDay);
          date.setDate(date.getDate() + dayIndex);
          const dateStr = date.toISOString().split("T")[0];
          return {
            date: dateStr,
            count: Number(day.count || 0),
            level: Number(day.level || 0)
          };
        }
      );
      return { days };
    }
  );
  const totalContributions = Number(rawData.total_contributions || 0);
  return {
    weeks,
    totalContributions,
    range: {
      start: String(rawData.from || ""),
      end: String(rawData.to || "")
    },
    user: {
      login: username,
      name: username,
      avatarUrl: `https://github.com/${username}.png`
    }
  };
}

const cache = /* @__PURE__ */ new Map();
const TTL_MS = 60 * 60 * 1e3;
function getCachedContributions(username) {
  const entry = cache.get(username);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}
function setCachedContributions(username, data) {
  cache.set(username, {
    data,
    expiresAt: Date.now() + TTL_MS
  });
}

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5e3
};
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError = null;
  let delay = opts.initialDelayMs;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isLastAttempt = attempt === opts.maxRetries;
      if (isLastAttempt) {
        break;
      }
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }
      const jitter = Math.random() * 0.1 * delay;
      await sleep(Math.min(delay + jitter, opts.maxDelayMs));
      delay = Math.min(delay * 2, opts.maxDelayMs);
    }
  }
  throw lastError || new Error("Max retries exceeded");
}
function isRetryableError(error) {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("network")) {
      return true;
    }
    const statusMatch = msg.match(/(\d{3})/);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 429 || statusCode === 408) {
          return true;
        }
        return false;
      }
      if (statusCode >= 500 && statusCode < 600) {
        return true;
      }
    }
  }
  return false;
}

const prerender = false;
const GET = async ({ params }) => {
  try {
    const username = params.username;
    if (!username || username.trim().length === 0) {
      return createErrorResponse("Username is required", 400);
    }
    if (username.length > 255 || !/^[a-zA-Z0-9\-]+$/.test(username)) {
      return createErrorResponse("Invalid username format", 400);
    }
    const cached = getCachedContributions(username);
    if (cached) {
      return createSuccessResponse(cached);
    }
    const contributions = await withRetry(
      () => fetchGitHubContributions(username),
      { maxRetries: 3 }
    );
    setCachedContributions(username, contributions);
    return createSuccessResponse(contributions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("404") || message.includes("not found")) {
      return createErrorResponse(`User not found: ${message}`, 404);
    }
    if (message.includes("429")) {
      return createErrorResponse("Rate limited by GitHub. Please try again later.", 429);
    }
    if (message.includes("503")) {
      return createErrorResponse("GitHub service unavailable. Please try again later.", 503);
    }
    return createErrorResponse(`Failed to fetch contributions: ${message}`, 500);
  }
};
function createSuccessResponse(data) {
  const response = {
    success: true,
    data
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
function createErrorResponse(error, status) {
  const response = {
    success: false,
    error,
    status
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
