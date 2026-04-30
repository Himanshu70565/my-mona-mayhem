import type { APIRoute } from 'astro';
import type { ContributionResponse } from '../../../lib/types';
import { fetchGitHubContributions } from '../../../lib/contributions';
import { getCachedContributions, setCachedContributions } from '../../../lib/cache';
import { withRetry } from '../../../lib/retry';

export const prerender = false;

export const GET: APIRoute = async ({ params }): Promise<Response> => {
	try {
		const username = params.username as string;

		// Validate username
		if (!username || username.trim().length === 0) {
			return createErrorResponse('Username is required', 400);
		}

		if (username.length > 255 || !/^[a-zA-Z0-9\-]+$/.test(username)) {
			return createErrorResponse('Invalid username format', 400);
		}

		// Check cache first
		const cached = getCachedContributions(username);
		if (cached) {
			return createSuccessResponse(cached);
		}

		// Fetch with retry logic
		const contributions = await withRetry(
			() => fetchGitHubContributions(username),
			{ maxRetries: 3 }
		);

		// Cache the result
		setCachedContributions(username, contributions);

		return createSuccessResponse(contributions);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';

		if (message.includes('404') || message.includes('not found')) {
			return createErrorResponse(`User not found: ${message}`, 404);
		}

		if (message.includes('429')) {
			return createErrorResponse('Rate limited by GitHub. Please try again later.', 429);
		}

		if (message.includes('503')) {
			return createErrorResponse('GitHub service unavailable. Please try again later.', 503);
		}

		return createErrorResponse(`Failed to fetch contributions: ${message}`, 500);
	}
};

function createSuccessResponse(data: unknown): Response {
	const response: ContributionResponse = {
		success: true,
		data: data as any,
	};

	return new Response(JSON.stringify(response), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

function createErrorResponse(error: string, status: number): Response {
	const response: ContributionResponse = {
		success: false,
		error,
		status,
	};

	return new Response(JSON.stringify(response), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
