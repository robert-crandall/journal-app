<script lang="ts">
	import { onMount } from 'svelte';
	
	export let data: Array<{
		date: string | Date;
		value: number;
	}> = [];
	export let height = 160;
	export let color = 'hsl(var(--p))';
	export let fillColor = 'hsla(var(--p), 0.1)';
	export let showYAxis = true;
	export let showXAxis = true;
	export let lineWidth = 2;
	export let smoothing = 0.2;
	
	let chartId = 'chart-' + Math.random().toString(36).substring(2, 10);
	let chartElement: SVGSVGElement;
	let width = 0;
	let resizeObserver: ResizeObserver;
	
	// Format date labels for x-axis
	function formatDate(date: string | Date): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
	
	// Format values for y-axis
	function formatValue(value: number): string {
		if (value >= 1000) {
			return Math.round(value / 100) / 10 + 'k';
		}
		return value.toString();
	}
	
	// Create SVG path for the line chart
	function createLinePath(): string {
		if (data.length < 2) return '';
		
		// Get domain values
		const xValues = data.map((d, i) => i * (width / (data.length - 1)));
		const maxY = Math.max(...data.map(d => d.value));
		const minY = Math.min(...data.map(d => d.value));
		const yScale = maxY > minY ? height / (maxY - minY) : 1;
		
		const points = data.map((d, i) => {
			const x = xValues[i];
			const y = height - ((d.value - minY) * yScale);
			return { x, y };
		});
		
		// Create a smooth curve through the points
		return createSmoothLine(points);
	}
	
	// Generate a smooth curve through points with bezier curves
	function createSmoothLine(points: Array<{x: number, y: number}>): string {
		if (points.length < 2) return '';
		
		let path = `M ${points[0].x},${points[0].y}`;
		
		for (let i = 0; i < points.length - 1; i++) {
			const current = points[i];
			const next = points[i + 1];
			const midX = (current.x + next.x) / 2;
			
			// Control points for smooth curve
			const cp1x = midX - (midX - current.x) * (1 - smoothing);
			const cp1y = current.y;
			const cp2x = midX + (next.x - midX) * smoothing;
			const cp2y = next.y;
			
			path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
		}
		
		return path;
	}
	
	// Create the fill path (from line to bottom)
	function createFillPath(): string {
		if (data.length < 2) return '';
		
		const linePath = createLinePath();
		const lastPoint = data.length > 0 ? 
			data.length - 1 : 0;
		const lastX = lastPoint * (width / (data.length - 1));
		
		return `${linePath} L ${lastX},${height} L 0,${height} Z`;
	}
	
	// Generate Y-axis tick marks
	function getYAxisTicks() {
		if (!showYAxis || data.length === 0) return [];
		
		const maxY = Math.max(...data.map(d => d.value));
		const minY = Math.min(...data.map(d => d.value));
		const range = maxY - minY;
		
		const tickCount = 3;
		const ticks = [];
		
		for (let i = 0; i < tickCount; i++) {
			const value = minY + (range * (i / (tickCount - 1)));
			const y = height - (((value - minY) / range) * height);
			ticks.push({ y, value });
		}
		
		return ticks;
	}
	
	// Generate X-axis tick marks
	function getXAxisTicks() {
		if (!showXAxis || data.length <= 1) return [];
		
		const tickCount = Math.min(5, data.length);
		const ticks = [];
		
		for (let i = 0; i < tickCount; i++) {
			const index = Math.floor((i / (tickCount - 1)) * (data.length - 1));
			const x = index * (width / (data.length - 1));
			ticks.push({ x, date: data[index].date });
		}
		
		return ticks;
	}
	
	function updateChart() {
		if (chartElement) {
			width = chartElement.clientWidth;
		}
	}
	
	onMount(() => {
		updateChart();
		
		resizeObserver = new ResizeObserver(() => {
			updateChart();
		});
		
		if (chartElement) {
			resizeObserver.observe(chartElement);
		}
		
		return () => {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	});
</script>

<div class="w-full">
	<svg 
		bind:this={chartElement} 
		{width} 
		{height} 
		viewBox="0 0 {width} {height}" 
		class="w-full h-auto"
		id={chartId}
		style="min-height: {height}px;"
	>
		{#key width}
			{#if data.length >= 2}
				<!-- Fill area under the line -->
				<path 
					d={createFillPath()} 
					fill={fillColor} 
					stroke="none" 
				/>
				
				<!-- Main line -->
				<path 
					d={createLinePath()} 
					fill="none" 
					stroke={color} 
					stroke-width={lineWidth} 
					stroke-linecap="round" 
					stroke-linejoin="round" 
				/>
				
				<!-- Data points -->
				{#each data.map((d, i) => ({ 
					x: i * (width / (data.length - 1)), 
					y: height - ((d.value - Math.min(...data.map(d => d.value))) * (height / (Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value))))})) as point, i}
					<circle 
						cx={point.x} 
						cy={point.y} 
						r={3} 
						fill={color}
					/>
				{/each}
				
				<!-- Y-axis gridlines and labels -->
				{#if showYAxis}
					{#each getYAxisTicks() as tick}
						<line 
							x1="0" 
							y1={tick.y} 
							x2={width} 
							y2={tick.y} 
							stroke="currentColor" 
							stroke-opacity="0.1" 
							stroke-dasharray="4,4" 
						/>
						<text 
							x="5" 
							y={tick.y - 5} 
							font-size="10" 
							fill="currentColor" 
							fill-opacity="0.5"
						>
							{formatValue(tick.value)}
						</text>
					{/each}
				{/if}
				
				<!-- X-axis labels -->
				{#if showXAxis && data.length > 1}
					{#each getXAxisTicks() as tick}
						<text 
							x={tick.x} 
							y={height - 5} 
							font-size="10" 
							text-anchor="middle" 
							fill="currentColor" 
							fill-opacity="0.5"
						>
							{formatDate(tick.date)}
						</text>
					{/each}
				{/if}
			{:else}
				<!-- No data or insufficient data message -->
				<text 
					x={width / 2} 
					y={height / 2} 
					text-anchor="middle" 
					fill="currentColor" 
					fill-opacity="0.3"
					font-size="12"
				>
					Not enough data
				</text>
			{/if}
		{/key}
	</svg>
</div>
