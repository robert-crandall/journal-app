<script lang="ts">
	import { page } from '$app/stores';
	import { User, Mail, Calendar } from 'lucide-svelte';
	
	let { data } = $props();
	
	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Profile - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-base-content">Your Profile</h1>
		<p class="text-base-content/70 mt-1">View and manage your account information</p>
	</div>
	
	<div class="card bg-base-100 border border-base-300">
		<div class="card-body">
			<!-- Profile Info -->
			<div class="flex flex-col md:flex-row gap-6">
				<div class="avatar placeholder">
					<div class="bg-primary text-primary-content rounded-full w-24">
						<span class="text-3xl">{data.user.username.charAt(0).toUpperCase()}</span>
					</div>
				</div>
				
				<div class="space-y-4 flex-1">
					<div>
						<div class="text-sm font-medium text-base-content/70">Username</div>
						<div class="flex items-center gap-2 mt-1">
							<User size={18} class="text-base-content/60" />
							<span class="text-lg font-medium">{data.user.username}</span>
						</div>
					</div>
					
					<div>
						<div class="text-sm font-medium text-base-content/70">Email</div>
						<div class="flex items-center gap-2 mt-1">
							<Mail size={18} class="text-base-content/60" />
							<span class="text-lg">{data.user.email}</span>
						</div>
					</div>
					
					{#if data.user.createdAt}
						<div>
							<div class="text-sm font-medium text-base-content/70">Member Since</div>
							<div class="flex items-center gap-2 mt-1">
								<Calendar size={18} class="text-base-content/60" />
								<span>{formatDate(data.user.createdAt)}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="divider"></div>
			
			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-2">
				<a class="btn btn-outline" href="/auth/password/change">
					Change Password
				</a>
				
				<a class="btn btn-error btn-outline" href="/auth/logout">
					Logout
				</a>
			</div>
		</div>
	</div>
</div>
