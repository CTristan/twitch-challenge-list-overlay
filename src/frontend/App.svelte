<script lang="ts">
    export let message = "Twitch Challenge Overlay (Svelte Placeholder)";
</script>

<main class="app-shell">
    <h1>{message}</h1>
</main>

<style>
    .app-shell {
        padding: 1rem;
        max-width: 25rem;
        margin: 0 auto;
        font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        color: inherit;
    }

    .app-shell h1 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
    }
</style>
