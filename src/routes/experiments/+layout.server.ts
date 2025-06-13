import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    // Check if user is authenticated
    if (!locals.user) {
        // Redirect to login page if not authenticated
        throw redirect(302, `/auth/login?redirectTo=${url.pathname}`);
    }
    
    // User is authenticated, return data needed for the layout
    return {
        user: locals.user
    };
};
