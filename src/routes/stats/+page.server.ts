import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
        // Redirect to login page if not authenticated
        throw redirect(302, '/auth/login?redirectTo=/stats');
    }
    
    // User is authenticated, return data needed for the page
    return {
        user: locals.user
    };
};
