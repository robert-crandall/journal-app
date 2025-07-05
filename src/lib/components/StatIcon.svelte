<script lang="ts">
	import {
		Dumbbell,
		Brain,
		Heart,
		Zap,
		Target,
		BookOpen,
		Mountain,
		Utensils,
		Bed,
		User,
		Users,
		Briefcase,
		Home,
		Car,
		Palette,
		Music,
		Camera,
		Gamepad2,
		Coffee,
		Flower,
		Shield,
		Star,
		Award,
		TrendingUp,
		BarChart3
	} from 'lucide-svelte';

	let {
		icon,
		size = 20,
		class: className = ''
	}: {
		icon?: string | null;
		size?: number;
		class?: string;
	} = $props();

	const iconMap: Record<string, import('svelte').ComponentType> = {
		dumbbell: Dumbbell,
		brain: Brain,
		heart: Heart,
		zap: Zap,
		target: Target,
		'book-open': BookOpen,
		mountain: Mountain,
		utensils: Utensils,
		bed: Bed,
		user: User,
		users: Users,
		briefcase: Briefcase,
		home: Home,
		car: Car,
		palette: Palette,
		music: Music,
		camera: Camera,
		'gamepad-2': Gamepad2,
		coffee: Coffee,
		flower: Flower,
		shield: Shield,
		star: Star,
		award: Award,
		'trending-up': TrendingUp
	};

	function getIconComponent(iconName: string | null | undefined) {
		if (!iconName) return BarChart3; // Default fallback icon
		return iconMap[iconName] || BarChart3;
	}

	// Create reactive component reference
	const IconComponent = $derived(getIconComponent(icon));
</script>

<IconComponent {size} class={className} />
