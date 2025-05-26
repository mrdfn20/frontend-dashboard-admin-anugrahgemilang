<script>
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';

	export let data = [];
	export let labels = [];
	export let title = '';
	export let height = 300;

	let canvas;
	let chart;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: title,
						data,
						backgroundColor: 'rgba(128, 0, 32, 0.6)',
						borderColor: 'rgba(128, 0, 32, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		});
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	$: if (chart && data) {
		chart.data.datasets[0].data = data;
		chart.update();
	}

	$: if (chart && labels) {
		chart.data.labels = labels;
		chart.update();
	}
</script>

<div style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
