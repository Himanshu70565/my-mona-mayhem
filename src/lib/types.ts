/**
 * GitHub Contribution data types
 */

export interface ContributionDay {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
	days: ContributionDay[];
}

export interface ContributionGraph {
	weeks: ContributionWeek[];
	totalContributions: number;
	range: {
		start: string;
		end: string;
	};
	user: {
		login: string;
		name: string;
		avatarUrl: string;
	};
}

export interface ContributionResponse {
	success: boolean;
	data?: ContributionGraph;
	error?: string;
	status?: number;
}
