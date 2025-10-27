import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
    compilerOptions: {
        css: "injected",
    },
    preprocess: [vitePreprocess()],
};

export default config;
