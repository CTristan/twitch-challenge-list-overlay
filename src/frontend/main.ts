import { ELEMENT_IDS, HTML_ELEMENTS } from "@/types/DOMConstants";
import { mount } from "svelte";
import App from "./App.svelte";

type MountTarget = HTMLElement;

const ensureMountTarget = (): MountTarget => {
    const existingTarget = document.getElementById(ELEMENT_IDS.APP);
    if (existingTarget !== null) {
        return existingTarget;
    }

    const createdTarget = document.createElement(HTML_ELEMENTS.DIV);
    createdTarget.id = ELEMENT_IDS.APP;
    document.body.append(createdTarget);
    return createdTarget;
};

// Svelte 5: use the imperative mount API instead of `new App(...)`.
const app = mount(App, {
    target: ensureMountTarget(),
});

export default app;
