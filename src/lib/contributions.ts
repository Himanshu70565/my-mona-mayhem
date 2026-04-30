/**
 * GitHub contribution data fetcher and parser
 */

import type { ContributionGraph } from './types';

export async function fetchGitHubContributions(
	username: string
): Promise<ContributionGraph> {
	const url = `https://github.com/${username}.contribs`;

	const response = await fetch(url, {
		headers: {
			'Accept': 'application/json',
			'User-Agent': 'Mona-Mayhem-Bot/1.0',
		},
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

	// Parse the contribution graph data from GitHub's JSON response
	const contributionData = parseContributionData(data, username);
	return contributionData;
}

function parseContributionData(data: unknown, username: string): ContributionGraph {
	// Type guard and extraction
	if (
		!data ||
		typeof data !== 'object' ||
		!('weeks' in data) ||
		!Array.isArray(data.weeks)
	) {
		throw new Error('Invalid contribution data format from GitHub');
	}

	const rawData = data as Record<string, unknown>;

	// Extract weeks - GitHub's format has contribution_days instead of days
	const weeks = (rawData.weeks as Array<Record<string, unknown>>).map(
		(week) => {
			const firstDay = String(week.first_day || '');
			// Add defensive check: if contribution_days is missing, use empty array
			const contributionDays = (week.contribution_days as Array<Record<string, unknown>>) || [];
			const days = contributionDays.map(
				(day, dayIndex) => {
					// Calculate the actual date for this day
					const date = new Date(firstDay);
					date.setDate(date.getDate() + dayIndex);
					const dateStr = date.toISOString().split('T')[0];

					return {
						date: dateStr,
						count: Number(day.count || 0),
						level: (Number(day.level || 0) as 0 | 1 | 2 | 3 | 4),
					};
				}
			);
			return { days };
		}
	);

	const totalContributions = Number(rawData.total_contributions || 0);

	// GitHub doesn't provide user info in .contribs endpoint, so use basic info
	return {
		weeks,
		totalContributions,
		range: {
			start: String(rawData.from || ''),
			end: String(rawData.to || ''),
		},
		user: {
			login: username,
			name: username,
			avatarUrl: `https://github.com/${username}.png`,
		},
	};
}

