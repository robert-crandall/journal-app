import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    // Check if user is authenticated
    if (!locals.user) {
        // Redirect to login page if not authenticated
        throw redirect(302, `/auth/login?redirectTo=/tags/${params.id}/edit`);
    }
    
    // User is authenticated, return data needed for the page
    return {
        user: locals.user,
        tagId: params.id
    };
};
